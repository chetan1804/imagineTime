import 'dart:collection';
import 'dart:convert';
import 'dart:developer';
import 'dart:io';
import 'dart:math';

import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/file_sync/session/remoteSession.dart';
import 'package:imagine_drive/utils/cancelable.dart';
import 'package:imagine_drive/utils/log.dart';

import '../fileSync.dart';
import '../remoteFileDirectory.dart';
import 'fileOperation.dart';

class _UploadFragment {
  String encoded;
  int bytes;
  _UploadFragment({this.encoded, this.bytes});
}

// if parent file is debug. this will delay the uploading. upload the file on smaller bytes
class FileUpload extends FileOperation {
  static const MB_2_BYTES = 1000000;
  static const UPLOAD_RETRY_COUNT = 10;
  static const RETRY_DELAY = 1000; // retry delay in milliseconds
  // the time we can only read file then close it.
  static const READ_FILE_TIMEOUT = 1000;
  // the waiting time for the next read. during this time, user can do other file operations
  static const UPLOAD_SLEEP = 3000; // in milliseconds
  // the maximum limit we can upload per segment
  static const SEGMENT_SIZE_LIMIT = MB_2_BYTES * 0.5;
  static const MEMORY_STREAM_LIMIT = 5000000; // memory stream can only handle

  FileData _data;
  int _lastUploadOffset = 0;
  bool _freshCopy = false;
  Cancellable _cancellable = Cancellable();
  RemoteSession _session;
  int _totalSize;
  Queue<_UploadFragment> _fileSegments = Queue();
  bool _isReadingSegments = false;

  FileUpload(FileSync fileSync, {bool freshCopy = false}) : super(fileSync) {
    _freshCopy = freshCopy;
  }

  // upload based from last offset
  @override
  Future onStarted() async {
    _totalSize = fileSync.data.totalSize;
    _data = await fileSync.data.copy();
    if (_freshCopy) {
      _lastUploadOffset = 0;
      _freshCopy = false;
    }
    _data.available = _lastUploadOffset;
    Log.writeFast(
      () => fileSync.relativePath + " started. " + _data.toString(),
      tag: "FileUpload",
      type: eLogType.VERBOSE,
    );

    // STEP: is this a directory? upload directory
    if (fileSync.data.isDirectory) {
      try {
        await RemoteFileDirectory.createFolder(fileSync.data,
            cancel: _cancellable, retry: 10);
        return finish();
      } catch (e) {
        Log.write('Failed creating directory ' + fileSync.data.relativePath,
            tag: 'FileUpload', type: eLogType.ERROR);
        return finish(error: e, retryLater: true);
      }
    }

    // STEP: check first if the file is fully copied to current localtion
    Log.write(
        _data.relativePath +
            ' File waiting to be initialized before initiating session.',
        type: eLogType.VERBOSE,
        tag: 'FileUpload');
    try {
      await FileSyncUtil.retry((_retries) {
        if (_totalSize > 0)
          return Future.value();
        else
          return Future.value('error');
      },
          name: 'Waiting for file to fully copied.',
          retry: 3,
          waiting: 1500,
          cancelToken: cancellable);
    } catch (e) {
      return finish(
          error: 'Current size of ' + fileSync.data.relativePath + ' is zero.');
    }

    // STEP: create remote session
    try {
      _session = await RemoteFileDirectory.initiateUploadSession(fileSync.data,
          cancel: _cancellable, retry: 10);
    } catch (e) {
      Log.write('Failed creating upload session ' + fileSync.data.relativePath,
          tag: 'FileUpload', type: eLogType.ERROR);
      return finish(error: e, retryLater: true);
    }

    // STEP: start listen for remote events
    _session.status.listen(onSessionStatusChanged);
    try {
      _session.onError = _onSessionError;
      _session.onFinished = _onSessionFinished;
      await _session.start();
    } catch (e, stack) {
      print(e + ' ' + stack.toString());
      return finish(error: e);
    }

    return upload();
  }

  void onSessionStatusChanged(eSessionState status) {
    switch (status) {
      case eSessionState.STARTED:
        break;
      case eSessionState.ERROR:
        break;
      default:
    }
  }

  Future<void> finish({dynamic error, bool retryLater = false}) async {
    Log.write('Cleaning up.', tag: 'FileUpload', type: eLogType.VERBOSE);
    _fileSegments.clear();

    if (_session != null) {
      try {
        await _session.finish();
      } catch (e) {
        Log.write(
          'Session finish failed, continue. ' + e.toString(),
          tag: 'FileUpload',
          type: eLogType.ERROR,
        );
      }
    }

    if (error != null) {
      await cancel(reason: error.toString(), retryLater: retryLater);
    }
    return Future.value();
  }

  Future _processFileSegments() async {
    if (_isReadingSegments) return;

    _fileSegments.clear();
    _isReadingSegments = true;
    RandomAccessFile _file;
    int offset = _lastUploadOffset;
    var readByteCount = min(fileSync.data.totalSize, SEGMENT_SIZE_LIMIT);

    do {
      await FileSyncUtil.retry((_retries) async {
        if (_file == null) {
          if (!await fileSync.data.loadFile().exists()) {
            cancel(
                reason:
                    'file was not exist, lets just wait for delete local operation.',
                retryLater: false);
            return Future.value();
          }
          _file = await fileSync.data.loadFile().open();
        }
        await _file.setPosition(offset);
      },
          retry: -1,
          waiting: 2000,
          cancelToken: _cancellable,
          onError: (_err) => print(_err),
          name: 'FileUpload->readfile');

      // STEP: read within the alotted time
      var readBytes;
      var readElapsed = Timeline.now;
      while (
          Timeline.now - readElapsed < READ_FILE_TIMEOUT * 1000 && !cancelled) {
        var minByteCount = min(readByteCount, _totalSize - offset).round();
        readBytes = await _file.read(minByteCount);
        _fileSegments.addFirst(_UploadFragment(
            encoded: base64.encode(readBytes), bytes: minByteCount));
        offset += minByteCount;
        if (offset >= _totalSize) {
          _isReadingSegments = false;
          break;
        }
      }

      // STEP: close file
      if (_file != null) {
        await _file.close();
        _file = null;
      }

      // STEP: sleep
      if (_isReadingSegments && !cancelled)
        await Future.delayed(Duration(milliseconds: UPLOAD_SLEEP));
    } while (_isReadingSegments && !cancelled);
    _isReadingSegments = false;
  }

  // use to upload specific bytes remotely
  // @startOffset: start of the data it will upload
  // @maxBytes: the maximum bytes to transmit
  // @delay: milliseconds. use to delay uploading. default 0
  Future<dynamic> upload() async {
    _processFileSegments();

    // start upload to remote
    while (_data.availablePercent < 1 &&
        !cancelled &&
        _session.status.value != eSessionState.OUTDATED) {
      // we are waiting for file to read
      while (_isReadingSegments && _fileSegments.isEmpty) {
        await Future.delayed(Duration(milliseconds: 200));
      }
      if (cancelled) break;

      var fragment = _fileSegments.removeLast();
      try {
        await _session
            .upload({'offset': _lastUploadOffset, 'data': fragment.encoded});
        _lastUploadOffset += fragment.bytes;
        _data.available = _lastUploadOffset;
        progress.value = _data.availablePercent;
      } catch (e) {
        return finish(
            error: 'UploadAll: Could not upload file ' + e.toString(),
            retryLater: true);
      }
    }

    // if this is outdated, we will wait for new operation so sync handler wont be destroyed
    if (_session.status.value == eSessionState.OUTDATED)
      await Future.delayed(Duration(seconds: 4));

    return finish();
  }

  void _onSessionFinished(eSessionState state) {
    if (state == eSessionState.UNKNOWN) return;
    var retry = state == eSessionState.OUTDATED ||
        state == eSessionState.FAILED ||
        state == eSessionState.ERROR;
    cancel(
        reason: 'Session was finished with ' + state.toString(),
        retryLater: retry);
  }

  /// callback when recieved an error from remote session
  void _onSessionError(dynamic error) {
    if (cancelled) return;
    var restart = true;
    // this is mean that the file was already deleted
    if (error['code'] == 'DELETED') restart = false;

    cancel(reason: 'Session error. ' + error.toString(), retryLater: restart);
  }
}
