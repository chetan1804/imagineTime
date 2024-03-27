import 'dart:io';

import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/file_sync/syncController.dart';

/*
  SyncMarker.dart
  Shell Icon Overlay helper. 
  Use to mark which files are synced and currently syncing by creating flag files.
 */
class SyncMarker {
  static String getCacheFilePath(String status, String syncRelativePath) {
    return FileSyncUtil.cacheDir + '\\' + status + '\\' + syncRelativePath;
  }

  static Future markAs(eSyncState status, {String relativePath}) async {
    switch (status) {
      case eSyncState.Synced:
        var file =
            File.fromUri(Uri.file(SyncController.mirrorPath + relativePath));
        // only mark as sync if the actual file exists
        if (await file.exists()) {
          _moveFile(
              fromPath: getCacheFilePath('syncing', relativePath),
              toPath: getCacheFilePath('synced', relativePath));
        }
        break;
      case eSyncState.DeleteLocal:
      case eSyncState.DeleteRemote:
        await _removeFile(getCacheFilePath('synced', relativePath));
        await _removeFile(getCacheFilePath('syncing', relativePath));
        break;
      default:
        _moveFile(
            fromPath: getCacheFilePath('synced', relativePath),
            toPath: getCacheFilePath('syncing', relativePath));
    }
  }

  static Future _moveFile({String fromPath, String toPath}) async {
    await _removeFile(fromPath);
    await _addFile(toPath);
  }

  static Future _removeFile(String path) async {
    await FileSyncUtil.retry((_retries) async {
      var file = File.fromUri(Uri.file(path));
      if (await file.exists()) {
        file = await file.delete();
      }
    }, retry: 5, name: 'SyncMarker::_removeFile');
  }

  static Future _addFile(String path) async {
    await FileSyncUtil.retry((_retries) async {
      var file = File.fromUri(Uri.file(path));
      if (!await file.exists()) await file.create(recursive: true);
    }, retry: 5, name: 'SyncMarker::_addFile ' + path, throwError: false);
  }
}
