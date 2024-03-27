import 'dart:async';
import 'dart:io';

import 'package:flutter_dokan/flutter_dokan.dart';
import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/utils/virtualDrive.dart';

import 'deleteCollection.dart';
import 'fileSyncUtil.dart';

class LocalFileDirectory {
  // setter for file change callback
  static set onFileStateChanged(
          Function(FileStatus, String, String) pCallback) =>
      VirtualDrive.onFileStateChanged = pCallback;

  // create file data from a valid path
  static Future<FileData> fromPath(String path) {
    return fromUri(Uri.file(path));
  }

  static Future<FileData> fromUri(Uri uri) {
    var file = File.fromUri(uri);
    return fromFileSystem(file);
  }

  static Future<FileData> fromFileSystem(FileSystemEntity file) async {
    var stat = await file.stat();
    var relativeP = FileSyncUtil.getRelativePath(file.path);
    var clientFolder = '';
    var isDirectory = file is Directory;
    var modified = stat.modified.toUtc();
    var deleted = false;
    if (!isDirectory) {
      clientFolder = relativeP.substring(0, relativeP.indexOf('\\', 1));
      if (stat.size <= 0) {
        var file = DeleteCollection.getMarkedFile(relativeP);
        if (await file.exists()) {
          modified = (await file.stat()).modified.toUtc();
          deleted = true;
        }
      }
    }
    return new FileData(file.uri, modified, stat.size, stat.size,
        relativePath: relativeP,
        isDirectory: isDirectory,
        clientFolder: clientFolder,
        deleted: deleted);
  }

  // @predicate: callback when a file was processed. return true if continue iterate
  static Future<void> retrieveAllFiles(
      Function(FileSystemEntity) predicate) async {
    var dir = new Directory(SyncController.mountPath);

    StreamSubscription<FileSystemEntity> subs;
    subs =
        dir.list(recursive: true, followLinks: false).listen((element) async {
      if (FileSyncUtil.isValidPath(element.path)) {
        // end if callback request to not continue
        if (!await predicate(element)) subs.cancel();
      }
    });
    return subs.asFuture();
  }
}
