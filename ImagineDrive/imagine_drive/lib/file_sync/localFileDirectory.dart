import 'dart:async';
import 'dart:io';

import 'package:flutter_dokan/flutter_dokan.dart';
import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:imagine_drive/utils/virtualDrive.dart';

import 'fileSyncUtil.dart';

class LocalFileDirectory {
  static List<Uri> ignoreList = List.empty(growable: true);
  static bool listenToFileEvents = true;
  // static FileData _lastFileChanged;
  // static eSyncState _lastFileChangedStatus;

  // setter for file change callback
  static set onFileStateChanged(Function(eSyncState, FileData) pCallback) {
    VirtualDrive.onFileStateChanged = (status, path, oldPath) async {
      if (!listenToFileEvents) return;
      if (!FileSyncUtil.isValidPath(path)) {
        Log.write(
          "File " + path + " is not a valid and will be ignored",
          tag: "LocalFileDirectory",
          type: eLogType.ERROR,
        );
        return;
      }

      switch (status) {
        case FileStatus.FILE_ADDED:
        //   _onFileChanged(eSyncState.Reupload, path, pCallback);
        //   break;
        case FileStatus.FILE_MODIFIED:
          _onFileChanged(eSyncState.Reupload, path, pCallback);
          break;
        case FileStatus.FILE_DELETED:
          _onFileChanged(eSyncState.DeleteRemote, path, pCallback);
          break;
        case FileStatus.FILE_MOVED:
          //print('Moved oldpath ' + oldPath);
          if (FileSyncUtil.isValidPath(oldPath))
            await _onFileChanged(eSyncState.DeleteRemote, oldPath, pCallback);
          await _onFileChanged(eSyncState.Reupload, path, pCallback);
          break;
        default:
      }
    };
  }

  static Future _onFileChanged(
      eSyncState sStatus, String path, Function pCallback) async {
    Uri uri;
    if (!SyncController.mounted) {
      Log.write(
          "File changes for " +
              path +
              " was ignored. The drive is not mounted.",
          tag: "LocalFileDirectory",
          type: eLogType.ERROR);
      return;
    }
    path = SyncController.driveLetter + "\\" + path;
    uri = Uri.file(path);

    // try to read file

    // is the changed was marked for skipping?
    var index = ignoreList.indexOf(uri);
    if (index >= 0) {
      //Log.write('Ignores ' + path + ' status: ' + sStatus.toString(),
      //    tag: 'LocalFileDirectory', type: eLogType.VERBOSE);
      return;
    }

    var fileData = await FileData.fromLocalUri(
      uri,
      overrideUpdateAt: true,
    );
    // is same file?
    // if (_lastFileChanged != null &&
    //     _lastFileChanged.relativePath == fileData.relativePath &&
    //     sStatus == _lastFileChangedStatus &&
    //     _lastFileChanged.lastModified == fileData.lastModified) {
    //   // is updated within 0.5 sec?
    //   Log.write(
    //       'File ' +
    //           fileData.relativePath +
    //           ' changed but was ignored. Nothing was changed since last. with status ' +
    //           sStatus.toString(),
    //       tag: 'LocalFileDirectory',
    //       type: eLogType.VERBOSE);
    //   return;
    // }

    // check if valid
    if (!await isValid(fileData)) {
      var fs = await fileSystemFromUri(fileData.mirroredUri);
      if (fileData.totalSize > 0) {
        try {
          if (await fs.exists()) await fs.delete();
        } catch (e) {}
      }
      if (sStatus == eSyncState.Reupload) {
        Log.write(
          "File update for " +
              fileData.relativePath +
              " is not valid. skipped...",
          type: eLogType.VERBOSE,
        );
        return;
      }
    }

    // _lastFileChanged = fileData;
    // _lastFileChangedStatus = sStatus;
    if (sStatus == eSyncState.DeleteRemote) {
      fileData.status = FILE_DELETED;
    }
    Log.write(
        'File changes ' + uri.toString() + ' status ' + sStatus.toString(),
        tag: 'LocalFileDirectory',
        type: eLogType.VERBOSE);
    pCallback(sStatus, fileData);
  }

  // use to iterate through directories
  // @predicate: callback when a file was processed. return true if continue iterate
  static Future<void> retrieveAllFiles(
      Function(FileSystemEntity) predicate) async {
    var dir = new Directory(SyncController.mirrorPathData);

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

  // use to skip specific report at one time. can be use when doesnt want to recieve any report for a specific changes
  // @uri: file uri which will be skipped
  static void skipReport(Uri uri) {
    if (!ignoreList.contains(uri)) ignoreList.add(uri);
  }

  static void skipReportFromPath(String path) {
    skipReport(Uri.file(SyncController.mountPath + path));
  }

  /// remote skip report for uri
  /// @delay: delay in removing skip. in milliseconds
  static Future removeSkip(Uri uri, {int delay = 200}) async {
    ignoreList.remove(uri);
    if (delay > 0) await Future.delayed(Duration(milliseconds: delay));
  }

  static Future removeSkipFromPath(String path, {int delay = 200}) {
    return removeSkip(Uri.file(SyncController.mountPath + path), delay: delay);
  }

  // use to toggle visibility of file
  static Future toggleFileVisibility(int attribute, List<String> files) async {
    for (var item in files) {
      var file = File.fromUri(Uri.file(item));
      var dir = Directory.fromUri(Uri.directory(item));
      if (await file.exists() || await dir.exists())
        await FlutterDokan.setFileAttribute(item, attribute);
    }
  }

  // this deletes file if invalid path
  // return true if file is invalid
  static Future<bool> isValid(FileData fileData) async {
    try {
      var pathSplits = fileData.relativePath.split("\\");
      if (pathSplits.length <= 2) {
        Log.write(
            "File does not conforms to file organization and will be deleted locally. " +
                fileData.relativePath,
            tag: "LocalFileDirectory",
            type: eLogType.WARNING);

        return false;
      } else {
        // validation if file is under staff folder
        if (await fileData.parentType == eParentType.UNKNOWN) {
          return false;
        }
      }

      if (!fileData.isDirectory && fileData.totalSize <= 0) {
        return false;
      }

      return true;
    } catch (e) {
      print("ERROR on delete invalid. " + e.toString());
      return true;
    }
  }

  static Future<void> deletePathIfExist(String relativePath) {
    fileSystemFromRelativePath(relativePath).then((fs) async {
      if (fs != null) {
        if (await fs.exists()) await fs.delete();
      }
    });
    return null;
  }

  static Future<FileSystemEntity> fileSystemFromRelativePath(
      String relativePath) {
    return fileSystemFromUri(
        Uri.file(SyncController.mirrorPathData + relativePath));
  }

  // use to check if the file or dir is exists
  static Future<bool> isPathExist(String relativePath) {
    return fileSystemFromRelativePath(relativePath).then((fs) {
      if (fs == null) return false;
      return fs.exists();
    });
  }

  static Future<FileSystemEntity> fileSystemFromUri(Uri uri) async {
    FileSystemEntity fs;
    var path = uri.toFilePath();
    if (await FileSystemEntity.isFile(path))
      fs = File.fromUri(uri);
    else
      fs = Directory.fromUri(uri);
    return fs;
  }
}
