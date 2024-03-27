import 'dart:developer';
import 'dart:io';
import 'dart:typed_data';

import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/file_sync/localFileDirectory.dart';
import 'package:imagine_drive/file_sync/syncReporter.dart';
import 'package:imagine_drive/utils/log.dart';

import 'cancelable.dart';

/*
  Class helper that facilitates writing to file effectively.
  It cools down to give way for user operations while still writing to file.
 */
class FileWriter {
  static const MAX_WRITE_TIME = 2000000; // the maximum time to write the file
  // the time for file to standby so user can do other operations
  static const STANDBY_TIME = 2000000;
  static const MAX_BYTES_TO_WAIT = 1000000;

  Uri uri;
  List<int> _stream = List.empty(growable: true);
  bool _writing = false;
  bool _closed = false;
  int offset = 0;
  Cancellable _cancel = Cancellable();

  FileWriter(this.uri, {this.offset = 0}) {
    var file = File.fromUri(uri);
    file.exists().then((value) {
      if (!value) file.create(recursive: true);
    });
  }

  void write(Uint8List bytes) {
    _stream.addAll(bytes);
    _process();
  }

  void _process() async {
    if (_writing) return;

    _writing = true;

    do {
      var elapsedTime = Timeline.now;
      var mode = FileMode.writeOnlyAppend;
      List<int> copied;
      if (offset == 0) mode = FileMode.write;
      RandomAccessFile accessFile;
      // STEP: open the file
      try {
        await FileSyncUtil.retry((_retries) async {
          accessFile = await File.fromUri(uri).open(mode: mode);
        }, retry: 3, cancelToken: _cancel, name: 'FileWriterOpen::' + uri.path);
      } catch (e) {
        Log.write(e.toString(), tag: 'FileWriter', type: eLogType.VERBOSE);
        break;
      }

      // STEP: write all buffer within the time limit
      LocalFileDirectory.skipReport(uri);
      do {
        copied = List.from(_stream);
        _stream.clear();
        accessFile = await accessFile.writeFrom(copied);
        offset = copied.length;
        copied = null;
      } while (!_closed &&
          Timeline.now - elapsedTime < MAX_WRITE_TIME &&
          _stream.length > 0);

      accessFile = await accessFile.flush();
      await accessFile.close();
      LocalFileDirectory.removeSkip(uri);
      accessFile = null;
      elapsedTime = Timeline.now;

      // STEP: standby
      while (!_closed &&
          _stream.length < MAX_BYTES_TO_WAIT &&
          (_stream.length == 0 || Timeline.now - elapsedTime < STANDBY_TIME)) {
        await Future.delayed(Duration(milliseconds: 200));
      }
    } while (!_closed);

    _writing = false;
  }

  /// save all data to file and close
  Future<void> flush() async {
    if (_stream.length == 0) return Future.value();
    _closed = true;

    while (_writing) {
      await Future.delayed(Duration(milliseconds: 500));
    }

    RandomAccessFile accessFile;

    await FileSyncUtil.retry((_retries) async {
      var file = File.fromUri(uri);
      if (!await file.exists()) {
        await file.create(recursive: true);
      }
      accessFile = await file.open(mode: FileMode.writeOnlyAppend);
    }, retry: 3, name: "FileWriter:flush", throwError: false);

    LocalFileDirectory.skipReport(uri);
    accessFile = await accessFile.writeFrom(_stream);
    _stream.clear();
    accessFile = await accessFile.flush();
    await accessFile.close();
    LocalFileDirectory.removeSkip(uri);
    return Future.value();
  }

  /// use to update file last modified information
  Future<void> updateLastModified(DateTime lastModified) async {
    var file = File.fromUri(uri);
    if (await file.exists()) {
      LocalFileDirectory.skipReport(uri);
      await file.setLastModified(lastModified);
      await LocalFileDirectory.removeSkip(uri);
    }
  }

  Future<void> close({bool deleteFile = false}) async {
    _closed = true;

    while (_writing) {
      await Future.delayed(Duration(milliseconds: 500));
    }

    if (deleteFile) {
      var file = File.fromUri(uri);
      if (await file.exists()) {
        LocalFileDirectory.skipReport(uri);
        await file.delete();
        await LocalFileDirectory.removeSkip(uri);
      }
    }

    _stream = null;
  }
}
