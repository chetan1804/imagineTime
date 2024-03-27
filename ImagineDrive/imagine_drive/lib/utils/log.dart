/*
    log.dart
    This class handles console and file logging.
 */

import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';

import 'callback.dart';

enum eLogType {
  /// not so important log
  INFO,

  /// for detailing. not really important. good for debuggin
  VERBOSE,

  /// warning related log
  WARNING,

  /// error related log
  ERROR,
}

class Log {
  static const FILENAME = 'log.txt';

  /// check every N seconds
  static const CHECKUP_DELAY = 60;

  /// maximum file size for logging in MB
  static const MAXIMUM_FILE_SIZE = 5;
  static bool console = !kReleaseMode;
  static bool fileLogging = true;

  /// true if enable logging
  static bool enabled = true;
  static IOSink _writeFile;
  static int _lastCheckup = DateTime(1979).millisecondsSinceEpoch;
  static String _logPath;
  static Callback<String> onRecievedLog = new Callback<String>();

  /// where the log file will be saved
  static Future<String> get logFilePath async {
    if (_logPath != null) return _logPath;
    _logPath = await FileSyncUtil.storageTmpPath + '\\' + FILENAME;
    return _logPath;
  }

  /// use to print a log on console or a file
  /// @tag: marks the log
  /// @level: type of logging
  static void write(Object log,
      {String tag = "Syncing", eLogType type = eLogType.INFO}) {
    if (enabled) {
      var formattedLog = '[' +
          DateTime.now().toString() +
          '], type=' +
          type.toString() +
          ', tag=' +
          tag +
          ', message=' +
          log;
      if (console) {
        switch (type) {
          case eLogType.VERBOSE:
            printDebug(tag + ': ' + log.toString());
            break;
          case eLogType.ERROR:
            printError(tag + ': ' + log.toString());
            break;
          case eLogType.WARNING:
            printWarning(tag + ': ' + log.toString());
            break;
          default:
            print(tag + ': ' + log.toString());
        }
      }
      if (fileLogging) _write2File(formattedLog);
      onRecievedLog(formattedLog);
    }
  }

  static void writeFast(Function onWrite,
      {String tag, eLogType type = eLogType.INFO}) {
    if (enabled) {
      String val;
      if (console) {
        val = onWrite();
        if (val.length > 0)
          print(tag + ': ' + val);
        else
          return;
      }
      if (fileLogging) {
        if (val == null) val = onWrite();
        if (val.isEmpty) return;
        _write2File(tag + ': ' + val);
      }
      onRecievedLog(val);
    }
  }

  static Future<List<String>> readAllLog() async {
    var logPath = await logFilePath;
    var logFile = File.fromUri(Uri.file(logPath));
    if (!await logFile.exists()) return null;
    return logFile.readAsLines();
  }

  static void _write2File(String log) async {
    await _checkup();

    if (_writeFile != null) {
      _writeFile.writeln(log);
      return;
    }

    var _path = await logFilePath;
    if (_path == null) return;
    var file = File.fromUri(Uri.file(_path));
    _writeFile = file.openWrite();
    _writeFile.writeln(log);
  }

  // check if the file can be clear
  static Future _checkup() async {
    var currentEpoch = DateTime.now().millisecondsSinceEpoch;
    if (currentEpoch - _lastCheckup < CHECKUP_DELAY * 1000) return;

    _lastCheckup = currentEpoch;
    var path = await logFilePath;
    if (path == null) return;
    // check the size if exceed if true then delete
    var file = File.fromUri(Uri.file(path));
    if (await file.exists()) {
      var stat = await file.stat();
      if (stat.size >= MAXIMUM_FILE_SIZE * 1000000) {
        if (_writeFile != null) {
          _writeFile.close();
          _writeFile = null;
        }
        await file.delete();
      }
    }
  }

  // clear the log
  static void clear() async {
    if (_writeFile != null) {
      await _writeFile.close();
      _writeFile = null;
    }
    var _path = await logFilePath;
    var file = File.fromUri(Uri.file(_path));
    if (await file.exists()) {
      await file.delete();
    }
  }

  static void openTextEditor() async {
    await FileSyncUtil.openNotepad(await logFilePath);
  }

  static void printWarning(String text) {
    print('\x1B[33m$text\x1B[0m');
  }

  static void printError(String text) {
    print('\x1B[31m$text\x1B[0m');
  }

  static void printDebug(String text) {
    print('\x1B[240m$text\x1B[0m');
  }
}
