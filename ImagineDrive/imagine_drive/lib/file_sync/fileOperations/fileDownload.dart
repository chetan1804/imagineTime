import 'dart:convert';
import 'dart:developer';
import 'dart:io';

import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/file_sync/localFileDirectory.dart';
import 'package:imagine_drive/file_sync/remoteFileDirectory.dart';
import 'package:imagine_drive/file_sync/session/remoteSession.dart';
import 'package:imagine_drive/handlers/socket.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/fileWriter.dart';
import 'package:imagine_drive/utils/log.dart';
import 'fileOperation.dart';

class FileDownload extends FileOperation {
  static const MB2BYTES = 1000000;
  int _lastOffset = 0;
  bool freshCopy = false;
  RemoteSession _session;
  FileWriter _fileWriter;
  int _lastUpdate;
  int _totalSize;
  bool _connectionInterrupted = false;
  FileDownload(FileSync fileSync, {this.freshCopy = false}) : super(fileSync);
  bool _isStreaming =
      false; // true if the file is being uploaded at the same time

  @override
  Future onStarted() async {
    Log.writeFast(
      () => fileSync.relativePath + " started. " + fileSync.data.toString(),
      tag: "FileDownload",
      type: eLogType.VERBOSE,
    );

    // delete old file. this might a rename operation
    if (fileSync.data.oldRelativePath != "" &&
        fileSync.data.oldRelativePath != fileSync.data.relativePath) {
      await LocalFileDirectory.deletePathIfExist(fileSync.data.oldRelativePath);
    }

    // STEP: check if this is folder
    if (fileSync.data.isDirectory) {
      try {
        FileSyncUtil.retry((retries) async {
          await Directory.fromUri(fileSync.data.mirroredUri)
              .create(recursive: true);
        }, name: "FileDownload.createDirectory");
      } catch (e) {
        await cancel(reason: "failed creating directory");
      }
      return Future.value();
    }

    _connectionInterrupted = false;
    _totalSize = fileSync.data.totalSize;
    _isStreaming = !fileSync.data.isFullyDownloaded;
    Socket.connected.onValueChanged.add(_onConnectionInterrupted);

    // STEP 1: initialize file.
    if (freshCopy || _lastOffset <= 0) {
      freshCopy = false;
      _lastOffset = 0;
      /*
      var file = fileSync.data.loadFile();
      if (!await file.exists()) {
        // create new file
        LocalFileDirectory.skipReport(fileSync.data.uri);
        await file.create(recursive: true);
        await LocalFileDirectory.removeSkip(fileSync.data.uri);
      }*/
    }

    _fileWriter = FileWriter(fileSync.data.mirroredUri, offset: _lastOffset);
    Log.write(
        'started ' +
            fileSync.relativePath +
            ' offset: ' +
            _lastOffset.toString(),
        tag: 'FileDownload');

    // STEP 2: start downloading file
    _session = await RemoteFileDirectory.initiateDownloadSession(
        fileSync.data.relativePath, _lastOffset);
    _session.onRemoteReady = _onRemoteReady;
    _session.onDataRecieved = _onRecievedUpdate;
    _session.onError = _onSessionError;
    _session.onFinished = _onSessionFinished;
    if (fileSync.data.available <= 0)
      _session.onRecievedEvent = _onSessionRecievedEvent;

    // STEP: wait for file to become ready
    try {
      if (!cancelled) {
        await _waitUntilReady();
        await _session.start();
      }
    } catch (e) {
      await cancel(
          reason: 'Error on starting session. ' + e.toString(),
          retryLater: true);
    }

    // STEP 3: wait until fully downloaded
    await _waitUntilDownloaded();

    // STEP 4: check if correct size was downloaded
    if (!cancelled) await _checkFileIntegrity();

    // STEP 5: finish current session
    try {
      await _session.finish();
    } catch (e) {
      Log.write('Download finished failed. continue. ' + e,
          tag: 'FileDownload', type: eLogType.VERBOSE);
    } finally {
      _session.close();
      _session = null;
    }

    // STEP 6: cleanup file
    Log.write('Cleaning up file ' + fileSync.data.relativePath,
        tag: 'FileDownload');
    if (!cancelled) {
      await _fileWriter.flush();
      await _fileWriter
          .updateLastModified(fileSync.data.lastModified.toLocal());
    } else
      // reset the file if so it will be redownloaded
      _lastOffset = 0;

    Socket.connected.onValueChanged.add(_onConnectionInterrupted);
    await _fileWriter.close();
    return Future.value();
  }

  /// the file might still initiating the upload. wait for it to initiate
  Future<void> _waitUntilReady() {
    return FileSyncUtil.retry((_retries) {
      if (fileSync.data.available > 0)
        return Future.value();
      else
        return Future.error(
            'WaitUntilReady(). The file is might still uploading/cancelled and cant continue');
    },
        retry: 7,
        cancelToken: cancellable,
        name: 'FileDownload::waitUntilReady ' + fileSync.data.relativePath);
  }

  // callback from server when recieved a file segment
  void _onRecievedUpdate(data) async {
    //if (cancelled) return;
    _lastUpdate = Timeline.now;
    var decoded = base64.decode(data['data']);
    _fileWriter.write(decoded);
    _lastOffset = _lastOffset + decoded.length;
    progress.value = _lastOffset / _totalSize;
  }

  /// callback when recieved an error from remote session
  void _onSessionError(dynamic error) {
    if (cancelled) return;
    var restart = true;
    // this is mean that the file was already deleted
    if (error['code'] == 'DELETED') restart = false;

    cancel(reason: 'Session error. ' + error.toString(), retryLater: restart);
  }

  /// callback when recieved an event from remote session
  void _onSessionRecievedEvent(String event, dynamic data) {
    if (event == 'updated_size') {
      fileSync.data.available = data['datasize'];
      Log.write(
          fileSync.relativePath +
              ' size was updated ' +
              fileSync.data.available.toString(),
          tag: 'FileDownload',
          type: eLogType.VERBOSE);
    }
  }

  void _onSessionFinished(eSessionState state) {
    if (state == eSessionState.UNKNOWN) return;
    var retry = state == eSessionState.OUTDATED ||
        state == eSessionState.FAILED ||
        state == eSessionState.ERROR;
    if (retry) {
      cancel(
          reason: 'Session was finished with ' + state.toString(),
          retryLater: retry);
    }
  }

  // callback when the remote signals ready state with updated data
  void _onRemoteReady(data) {
    fileSync.data.updateFromJson(data);
    if (fileSync.data.available <= 0)
      cancel(
          reason: 'Invalid file size. Not enough data to download.',
          retryLater: false);
  }

  /// callback when connection was changed
  void _onConnectionInterrupted(bool isConnected) {
    if (!isConnected) {
      _connectionInterrupted = true;
      Socket.connected.onValueChanged.remove(_onConnectionInterrupted);
    }
  }

  /// wait from server until file is fully downloaded
  Future _waitUntilDownloaded() async {
    // download waiting for fully uploaded file.
    // because some files are has invalid size. wait until server returns finished
    _lastUpdate = Timeline.now;
    while (!cancelled) {
      // is file is still uploading. and progress is done. break;
      if (_isStreaming && progress.value >= 1) break;
      if (_session.isFinished) break;

      await Future.delayed(Duration(seconds: 1));
      var timeout =
          Timeline.now - _lastUpdate > (DOWNLOAD_SERVER_TIMEOUT * 1000000);
      if (timeout) {
        if (!(!_isStreaming && progress.value == 1))
          await cancel(reason: 'Download timeout: no response from server.');
        break;
      }
    }
  }

  /// when download finished. check file integrity
  Future _checkFileIntegrity() async {
    if (_isStreaming) {
      if (progress.value != 1) {
        if (_connectionInterrupted)
          await cancel(reason: 'Invalid data downloaded.');
        else
          Log.write(
              fileSync.data.relativePath + ' File exceed to expected size.',
              tag: 'FileDownload',
              type: eLogType.WARNING);
      }
    } else {
      // for files that has invalid size. and not fully downloaded. return invalid
      if (progress.value != 1 &&
          _session.finishedState != eSessionState.FINISHED)
        await cancel(reason: 'Invalid data downloaded.');
    }
  }
}
