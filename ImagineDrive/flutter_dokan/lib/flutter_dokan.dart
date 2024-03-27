import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';

enum FileStatus {
  NONE,
  FILE_ADDED,
  FILE_DELETED,
  FILE_MODIFIED,
  unknown,
  // the file was moved or renames
  FILE_MOVED
}

class FlutterDokan {
  static const MethodChannel _channel = const MethodChannel('flutter_dokan');
  static Function _onFileStateChanged;

  static Future<String> get platformVersion async {
    final String version = await _channel.invokeMethod('getPlatformVersion');
    return version;
  }

  // ignore: missing_return
  static Future<dynamic> _onNativeCallback(MethodCall pCall) {
    if (pCall.method == 'onFileChanged') {
      if (_onFileStateChanged != null) {
        var oldpath = pCall.arguments[2];
        var path = pCall.arguments[1];
        var status = pCall.arguments[0];
        if (Platform.isWindows) path = path.replaceAll('/', '\\');
        _onFileStateChanged(FileStatus.values[status], path, oldpath);
      }
    }
  }

  // if mounted then unmount
  static Future<String> unmountMirror(String driveLetter) async {
    if (driveLetter.length > 1)
      return Future.error('Couldnt accept ' +
          driveLetter +
          '. Please input valid drive letter with no special characters.');
    try {
      await _channel.invokeMethod('unmount', driveLetter);
      return 'success';
    } catch (e, stack) {
      return Future.error(e, stack);
    }
  }

  // use to mount the drive using mirroring
  // @targetDirMirror: which directory will be mirrored
  // @driveLetter: which drive to use
  // @driveDescript: name that will be displayed
  // @onFileStateChanged: callback when a file was updated/added/removed
  static Future<String> mountMirror(String targetDirMirror,
      {String driveLetter = "g:",
      String driveDescrip = "Dokan",
      Function(FileStatus, String, String) onFileStateChanged}) async {
    _channel.setMethodCallHandler(_onNativeCallback);
    _onFileStateChanged = onFileStateChanged;
    try {
      await _channel
          .invokeMethod('mount', [driveLetter, targetDirMirror, driveDescrip]);
      var dir = Directory.fromUri(Uri.directory(driveLetter + '\\'));
      // wait until mount directory exist
      while (!await dir.exists()) {
        await Future.delayed(Duration(milliseconds: 400));
      }
      return 'success';
    } catch (e, stack) {
      return Future.error(e, stack);
    }
  }

  static Future setFileAttribute(String filename, int attribute) async {
    try {
      await _channel.invokeMethod('setFileAttribute', [filename, attribute]);
      return;
    } catch (e, stack) {
      return Future.error(e, stack);
    }
  }
}
