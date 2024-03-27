// this file is for handling virtual drive events

import 'dart:developer';
import 'dart:io';

import 'package:flutter_dokan/flutter_dokan.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';

class _FileChangedData {
  String path;
  String oldpath;
  FileStatus status;
  _FileChangedData(this.status, this.path, this.oldpath);
}

// class that handles file changes and notify for changes
class _FileChangesApplier {
  static const WAITING_SEC = 2;
  static Map<String, _FileChangedData> _listFiles =
      new Map<String, _FileChangedData>();
  static int _status = 0;
  static void add(FileStatus status, String path, String oldpath) {
    if (!_listFiles.containsKey(path)) {
      _listFiles[path] = new _FileChangedData(status, path, oldpath);
    } else {
      var data = _listFiles[path];
      data.status = status;
      data.oldpath = oldpath;
    }
    _delayApply();
  }

  static Future<void> _delayApply() async {
    // is there delay apply. reset
    if (_status != 0) {
      if (_status == 2) return;
      print("cancelling");
      _status = 2;
      while (_status != 0) {
        await Future.delayed(Duration(milliseconds: 100));
      }
    }
    print("applying");
    _status = 1;
    var elapsed = Timeline.now;
    while (_status == 1) {
      await Future.delayed(Duration(milliseconds: 100));
      if (Timeline.now - elapsed > WAITING_SEC * 1000000) break;
    }
    // was cancelled
    if (_status != 1) {
      print("cancelled");
      _status = 0;
      return;
    }
    apply();
  }

  static void apply() {
    for (var item in _listFiles.values) {
      VirtualDrive.onFileStateChanged(item.status, item.path, item.oldpath);
    }
    _listFiles.clear();
    print("Applied");
    _status = 0;
  }
}

class VirtualDrive {
  static String _driveLetter;
  static String _targetMirrorDir;
  static String _driveDescrip;
  // callback when any of file on drive was changed
  static Function(FileStatus, String, String) onFileStateChanged;
  static String get driveLetter => _driveLetter;
  static String get targetMirrorDir => _targetMirrorDir;
  static String get driveDescription => _driveDescrip;
  static bool get isMounted => _driveLetter != null;

  static void prepareUnmount() {
    _FileChangesApplier.apply();
  }

  // unmount the current mounted drive
  static Future<void> unMount() {
    if (_driveLetter == null) return Future.value();
    String letter = _driveLetter;
    if (letter.length > 1) letter = letter[0];
    _driveLetter = null;
    return FlutterDokan.unmountMirror(letter);
  }

  // use to start mounting
  static Future<void> mount(String driveLetter, String targetMirrorDir,
      String driveDescription) async {
    _targetMirrorDir = targetMirrorDir;
    _driveDescrip = driveDescription;
    await FlutterDokan.mountMirror(targetMirrorDir,
        driveLetter: driveLetter, driveDescrip: driveDescription);
    _driveLetter = driveLetter;
    var dir = Directory.fromUri(Uri.directory(driveLetter + "\\"));
    var stream = dir.watch(recursive: true);
    stream.listen(_onChanged);
  }

  static Future openFileExplorer() {
    return FileSyncUtil.openFileExplorer(driveLetter);
  }

  static void _onChanged(FileSystemEvent event) {
    print(event);
    var relativePath = FileSyncUtil.getRelativePath(event.path);
    var oldPath = "";
    var status = FileStatus.FILE_DELETED;
    switch (event.type) {
      case FileSystemEvent.create:
        status = FileStatus.FILE_ADDED;
        break;
      case FileSystemEvent.modify:
        status = FileStatus.FILE_MODIFIED;
        break;
      case FileSystemEvent.move:
        status = FileStatus.FILE_MOVED;
        var moveEvnt = event as FileSystemMoveEvent;
        oldPath = relativePath;
        relativePath = FileSyncUtil.getRelativePath(moveEvnt.destination);
    }
    _FileChangesApplier.add(status, relativePath, oldPath);
  }
}
