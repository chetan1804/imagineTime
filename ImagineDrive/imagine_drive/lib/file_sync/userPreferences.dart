/*
  userPreferences.dart
  Class that handles preferences for specific loged user.
  Each user on a device can have their own preferences.
 */
import 'package:imagine_drive/utils/basePreference.dart';

import 'appPreferences.dart';

class UserPreferences extends BasePreference {
  static UserPreferences _userPreference;
  static int _lastUser;

  static UserPreferences get instance => _userPreference;
  UserPreferences(String workingPath) : super(path: workingPath + '\\pref');

  static Future<BasePreference> initializeForUser(int userId) async {
    if (_lastUser == userId) return _userPreference;

    var workingPath = await AppPreferences.getWorkingDirForUser(userId);
    _lastUser = userId;
    _userPreference = UserPreferences(workingPath);
    await _userPreference.initialize();
    return _userPreference;
  }

  static Future dispose() async {
    if (_userPreference != null) {
      _userPreference.close();
      _userPreference = null;
    }
  }

  set lastRemoteUpdate(int date) {
    setInt('lastUpdate', date);
  }

  int get lastRemoteUpdate {
    var lastUpdate = getInt('lastUpdate');
    if (lastUpdate != null)
      return lastUpdate;
    else
      return 0;
  }

  set lastRemoteUpdateClient(int date) {
    setInt('lastUpdateC', date);
  }

  int get lastRemoteUpdateClient {
    var lastUpdateC = getInt('lastUpdateC');
    if (lastUpdateC != null)
      return lastUpdateC;
    else
      return DateTime(1970).millisecondsSinceEpoch;
  }

  set lastRemoteUpdateFirm(int date) {
    setInt('lastUpdateF', date);
  }

  int get lastRemoteUpdateFirm {
    var lastUpdateC = getInt('lastUpdateF');
    if (lastUpdateC != null)
      return lastUpdateC;
    else
      return DateTime(1970).millisecondsSinceEpoch;
  }

  set lastRemoteUpdateStaff(int date) {
    setInt('lastUpdateSt', date);
  }

  int get lastRemoteUpdateStaff {
    var lastUpdateC = getInt('lastUpdateSt');
    if (lastUpdateC != null)
      return lastUpdateC;
    else
      return DateTime(1970).millisecondsSinceEpoch;
  }

  set lastRemoteUpdateStaffFiles(int date) {
    setInt('lastUpdateStf', date);
  }

  int get lastRemoteUpdateStaffFiles {
    var lastUpdateC = getInt('lastUpdateStf');
    if (lastUpdateC != null)
      return lastUpdateC;
    else
      return 0;
  }

  /// use to set the drive letter. eg. d:\
  set lastDriveLetter(String driveLetter) {
    setString('driveLetter', driveLetter);
    AppPreferences.lastDriveUsed = driveLetter;
  }

  String get lastDriveLetter {
    return getString('driveLetter');
  }

  Future<String> get workingDirectory async {
    if (_lastUser == null) throw 'User preferences is not yet initialized';
    return AppPreferences.getWorkingDirForUser(_lastUser);
  }

  List<int> _firms;
  List<int> get selectedFirms {
    if (_firms != null) return _firms;
    List<dynamic> firms = getObject('firms', defaultValue: null);
    if (firms != null) {
      _firms = firms.cast<int>();
      return _firms;
    }
    return null;
  }

  set selectedFirms(List<int> firms) {
    _firms = firms;
    setObject('firms', firms);
  }
}
