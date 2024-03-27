import 'dart:developer';
import 'dart:io';

import 'package:imagine_drive/utils/cancelable.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/log.dart';

import 'syncController.dart';

class FileSyncUtil {
  static String get cacheDir {
    return SyncController.mirrorPath + CACHE_DIR;
  }

  static String getRelativePath(String path) {
    return path.replaceFirst(SyncController.mountPath, "");
  }

  static bool isValidPath(String path) {
    // doesnt have extension.? skip
    var i = path.lastIndexOf('\\');
    if (i >= 0 && !path.substring(i).contains('.')) {
      //print('skip ' + path);
      return false;
    }
    return true;
  }

  static Future<File> createCacheFile(String relativePath,
      {bool overwrite = true}) async {
    var file = File.fromUri(Uri.file(cacheDir + '\\' + relativePath));
    if (await file.exists()) {
      if (overwrite) {
        file = await file.delete();
      } else
        return file;
    }
    return await file.create(recursive: true);
  }

  /// use to run task and if failed retry it again
  /// @retry: number of times if will retry. 0 = dont retry, -1 forever to retry
  /// @timeout: the time it will wait to try it again. default 3 sec
  /// @cancelToken: to cancel task
  static Future retry(Function(int) task,
      {int retry = 1,
      Cancellable cancelToken,
      Function(dynamic) onError,
      int waiting = 3000,
      String name = 'retry'}) async {
    int retries = 0;

    do {
      try {
        var res = await task(retries);
        return Future.value(res);
      } catch (e) {
        if (onError != null) onError(e);

        // was cancelled?
        if (cancelToken != null && cancelToken.cancelled)
          return Future.error('cancelled');

        retries++;
        // retries achieved
        if (retry > -1 && retries > retry) return Future.error(e);
        Log.write('retrying', tag: name, type: eLogType.VERBOSE);
        var elapsed = Timeline.now;
        // wait for delay to retry
        do {
          await Future.delayed(Duration(milliseconds: 1000));
          if (cancelToken != null && cancelToken.cancelled)
            return Future.error('cancelled');
        } while (Timeline.now - elapsed < waiting * 1000);
      }
    } while (true);
  }
}
