import 'package:imagine_drive/utils/basePreference.dart';
import 'package:uuid/uuid.dart';

import 'fileSyncUtil.dart';

/*
  Global preference that the app uses.
 */
class AppPreferences extends BasePreference {
  static BasePreference _instance;

  /// global settings for app
  static Future<BasePreference> get instance async {
    if (_instance == null) {
      _instance = BasePreference(
          path: await FileSyncUtil.storageTmpPath + '\\settings');
      await _instance.initialize();
    }
    while (_instance.dictionary == null) {
      await Future.delayed(Duration(seconds: 1));
    }
    return _instance;
  }

  static Future<String> getWorkingDirForUser(int userId) async {
    var pref = await instance;
    var path = pref.getString('path' + userId.toString());
    if (path == null) {
      path = Uuid().v1();
      pref.setString('path' + userId.toString(), path);
    }
    return await FileSyncUtil.storageTmpPath + '\\' + path;
  }

  static set lastLoggedUser(int userId) {
    instance.then((pref) {
      pref.setInt('lastUser', userId);
    });
    if (userId == null || userId < 0) lastDriveUsed = null;
  }

  static get lastLoggedUser async {
    var tmp = await instance;
    return tmp.getInt('lastUser', defaultV: -1);
  }

  static set lastDriveUsed(String driveLetter) {
    instance.then((pref) => pref.setString('lastDriveUsed', driveLetter));
  }
}
