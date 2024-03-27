import 'dart:developer';
import 'dart:io';

import 'package:imagine_drive/utils/cancelable.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:path_provider/path_provider.dart';
import 'package:process_run/shell.dart';

import 'syncController.dart';

/*
 * 
 * fileSyncUtil.dart
 * This class provide helper and utilities available to this package
 */
class FileSyncUtil {
  static String _persistentPath;
  static String _storagePath;

  static String get cacheDir {
    return SyncController.mirrorPath + CACHE_DIR;
  }

  /// system persistent path
  static Future<String> get persistentPath async {
    if (_persistentPath != null) return _persistentPath;
    var dir = await getApplicationSupportDirectory();
    _persistentPath = dir.path;
    return _persistentPath;
  }

  /// get from local to relative
  static String getRelativePath(String path) {
    var path2 = path.replaceFirst(SyncController.mountPath, "");
    // maybe its not in mount path
    if (path2.length == path.length) {
      path2 = path.replaceFirst(SyncController.mirrorPathData, "");
    }
    if (path2[path2.length - 1] == "\\") {
      path2 = path2.substring(0, path2.length - 1);
    }
    return path2;
  }

  /// storage path, path were we will store the files
  static Future<String> get storageTmpPath async {
    if (_storagePath != null) return _storagePath;
    // look for a valid system drive
    for (var item in ['c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']) {
      var dir = Directory.fromUri(Uri.directory(item + ':\\windows'));
      if (await dir.exists()) {
        _storagePath = item + ':\\ImagineShareTemp';
        break;
      }
    }
    return _storagePath;
  }

  //use to get available drive letter
  static Future<String> getAvailableDriveLetter() async {
    for (var item in ['c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']) {
      if (!await isDirectoryExists(item + ':\\')) {
        return item + ':';
      }
    }
    return null;
  }

  // use to check if directory is exists
  static Future<bool> isDirectoryExists(String path) async {
    try {
      var dir = Directory.fromUri(Uri.directory(path));
      return await dir.exists();
    } catch (e) {
      return true;
    }
  }

  // use to check local absolute path
  static bool isValidPath(String localPath) {
    // doesnt have extension.? skip
    if (localPath.contains('Zone.Identifier:\$DATA')) return false;
    // var i = path.lastIndexOf('\\');
    // if (i >= 0 && !path.substring(i).contains('.')) {
    //   //print('skip ' + path);
    //   return false;
    // }
    return true;
  }

  // use to open file explorer
  static Future openFileExplorer(String path, {selected: false}) async {
    if (!selected)
      await Process.run('explorer.exe', [path]);
    else {
      var cmd = 'explorer.exe /select,' + path;
      await Shell(throwOnError: false, runInShell: false).run(cmd);
    }
  }

  static Future openNotepad(String filePath) async {
    await Shell(throwOnError: false, runInShell: false)
        .run('notepad ' + filePath);
  }

  static Future<File> getPersistentFile(String relativePath) async {
    return File.fromUri(Uri.file(await persistentPath + '\\' + relativePath));
  }

  static File getCacheFile(String relativePath) {
    return File.fromUri(Uri.file(cacheDir + '\\' + relativePath));
  }

  static Future<File> createCacheFile(String relativePath,
      {bool replace = true}) async {
    var file = File.fromUri(Uri.file(cacheDir + '\\' + relativePath));
    if (await file.exists()) {
      if (replace) {
        file = await file.delete();
      } else
        return file;
    }
    return await file.create(recursive: true);
  }

  static Future<File> createPersistentFile(String relativePath,
      {bool replace = true}) async {
    var file =
        File.fromUri(Uri.file(await persistentPath + '\\' + relativePath));
    if (await file.exists()) {
      if (replace) {
        file = await file.delete();
      } else
        return file;
    }
    return await file.create(recursive: true);
  }

  static Future<List<String>> getAvailableDrives() async {
    List<String> _items = List.empty(growable: true);
    for (int i = 100; i <= 122; i++) {
      var driveLetter = String.fromCharCode(i);
      var drive = driveLetter + ':\\';
      var dir = Directory.fromUri(Uri.file(drive));
      try {
        if (!await dir.exists()) {
          _items.add(driveLetter + ':');
        }
      } catch (e) {}
    }
    return _items;
  }

  /// use to run task and if failed retry it again
  /// @retry: number of times if will retry. 0 = dont retry, -1 forever to retry
  /// @waiting: the time it will wait to try it again. default 3000 milliseconds
  /// @cancelToken: to cancel task
  static Future retry(Function(int) task,
      {int retry = 1,
      Cancellable cancelToken,
      Function(dynamic) onError,
      int waiting = 3000,
      String name = 'retry',
      bool throwError = true}) async {
    int retries = 0;

    do {
      try {
        var res = await task(retries);
        return Future.value(res);
      } catch (e) {
        if (onError != null) onError(e);

        // was cancelled?
        if (cancelToken != null && cancelToken.cancelled) {
          if (throwError)
            return Future.error('cancelled');
          else
            return Future.value();
        }

        retries++;
        // retries achieved
        if (retry > -1 && retries > retry) {
          if (throwError)
            return Future.error(e);
          else {
            Log.write('Failed to run.', tag: name, type: eLogType.ERROR);
            return Future.value();
          }
        }
        Log.write('retrying', tag: name, type: eLogType.VERBOSE);
        var elapsed = Timeline.now;
        // wait for delay to retry
        do {
          await Future.delayed(Duration(milliseconds: 1000));
          if (cancelToken != null && cancelToken.cancelled) {
            if (throwError)
              return Future.error('cancelled');
            else
              return Future.value();
          }
        } while (Timeline.now - elapsed < waiting * 1000);
      }
    } while (true);
  }

  static String displayableDate(DateTime date) {
    if (date.isUtc) date = date.toLocal();
    var difference =
        DateTime.now().millisecondsSinceEpoch - date.millisecondsSinceEpoch;
    var differenceDuration = Duration(milliseconds: difference);
    if (differenceDuration.inDays >= 30)
      return 'months ago';
    else if (differenceDuration.inDays >= 14)
      return 'weeks ago';
    else if (differenceDuration.inDays >= 7)
      return 'a week ago';
    else if (differenceDuration.inDays >= 2)
      return 'days ago';
    else if (differenceDuration.inDays >= 1)
      return 'yesterday';
    else if (differenceDuration.inHours >= 1)
      return differenceDuration.inHours.toString() + ' hours ago';
    else if (differenceDuration.inMinutes >= 2)
      return differenceDuration.inMinutes.toString() + ' minutes ago';
    else
      return 'moments ago';
  }
}
