import 'dart:io';

import 'package:imagine_drive/file_sync/appPreferences.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/file_sync/userData.dart';
import 'package:imagine_drive/file_sync/userPreferences.dart';
import 'package:imagine_drive/handlers/socket.dart';
import 'package:imagine_drive/utils/cancelable.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:imagine_drive/utils/observable.dart';

enum eAccountState {
  SIGNED_OUT,
  SIGNED_IN_VERIFIED, // user account is signed and token was validated
  NOT_EXIST,
  NETWORK_ERROR,
  SIGNED_IN_NOT_VERIFIED, // account is signed but token is not yet validated
  INVALID, // account is not valid
  WAITING,
  SERVER_ERROR,
}

/*
  Class that handles authentication 
 */
class Authenticator {
  static UserData currentUser;
  static String _deviceId;
  static bool _isInit = false;
  static int get userId => currentUser.userid;
  static Observable<eAccountState> currentState =
      Observable(initValue: eAccountState.SIGNED_OUT);

  /// read current device id. return null if not available
  static Future<String> get deviceId async {
    if (_deviceId == null) {
      // for mac "ioreg -l | grep IOPlatformUUID | awk 'NR==1{print $4}' | sed 's/\"//g'"
      var processResult = await Process.run(
        'wmic',
        ['csproduct', 'get', 'UUID'],
        runInShell: false,
      );

      if (processResult.stderr == null || processResult.stderr == '') {
        _deviceId = processResult.stdout;
        _deviceId = _deviceId
            .substring(_deviceId.indexOf('\n') + 1)
            .replaceAll(RegExp('\r\n'), '')
            .trimRight();
        Log.write("Device Id " + _deviceId,
            tag: "Authenticator", type: eLogType.VERBOSE);
      } else
        Log.write(
            'Error retrieveing device id. ' + processResult.stderr.toString(),
            tag: 'Authenticator',
            type: eLogType.ERROR);
    }
    return _deviceId;
  }

  static bool get isSigned {
    return currentState.value == eAccountState.SIGNED_IN_VERIFIED ||
        currentState.value == eAccountState.SIGNED_IN_NOT_VERIFIED;
  }

  // check if current sign in is verified
  static bool get isSignVerified {
    return currentState.value == eAccountState.SIGNED_IN_VERIFIED;
  }

  static Future<bool> get hasCachedToken async {
    var val = await AppPreferences.lastLoggedUser;
    if (val == null || val < 0) return false;
    var tokenFile = await FileSyncUtil.getPersistentFile('token');
    return await tokenFile.exists();
  }

  // get the current token file
  static Future<String> get cachedToken async {
    var tokenFile = await FileSyncUtil.getPersistentFile('token');
    if (!await tokenFile.exists()) return Future.value(null);
    var token = await tokenFile.readAsString();
    currentUser = UserData.fromJWT(token);
    return token;
  }

  // set the token map
  static setCachedToken(dynamic token) async {
    if (token == null) {
      AppPreferences.lastLoggedUser = -1;
      var tokenFile = await FileSyncUtil.getPersistentFile('token');
      if (tokenFile.existsSync()) tokenFile.delete();
      return;
    }

    if (token != null) {
      currentUser = UserData.fromJWT(token);
      AppPreferences.lastLoggedUser = currentUser.userid;
    }

    FileSyncUtil.retry((_retries) {
      if (!SyncController.mounted)
        return Future.error('file need to be mounted.');

      FileSyncUtil.createPersistentFile('token', replace: false)
          .then((tokenFile) {
        tokenFile.writeAsString(token);
      }).onError((error, stackTrace) {
        Log.write('Error on saving token, ' + error.toString(),
            tag: 'Authenticator', type: eLogType.ERROR);
      });
    }, name: 'Authenticator::saving token', retry: -1);
  }

  static void _init() {
    if (_isInit) return;
    _isInit = true;
    // reauthourize user when connection was resumed
    Socket.connected.listen((_connected) async {
      if (_connected) {
        if (currentState.value == eAccountState.SIGNED_IN_VERIFIED) {
          await reauth();
        } else if (currentState.value == eAccountState.SIGNED_IN_NOT_VERIFIED) {
          await silentLogin();
        }
      }
    });
  }

  static Future<void> reauth() async {
    Socket.transmitDataAckTimeout(
        SOC_EVENT_REAUTH,
        {
          'device': await deviceId,
          'firms': UserPreferences.instance.selectedFirms != null
              ? UserPreferences.instance.selectedFirms
              : [],
          'version': VERSION
        },
        retry: 5,
        tag: 'Authenticator:Reauth');
  }

  // use to login
  static Future<eAccountState> login({String username, String password}) async {
    currentState.value = eAccountState.WAITING;
    _init();
    try {
      var device = await deviceId;
      Map response = await Socket.transmitDataAckTimeout(
          SOC_EVENT_AUTH,
          {
            'action': 'login',
            'username': username,
            'password': password,
            'device': device,
            'version': VERSION
          },
          retry: 2,
          tag: 'Authenticator::login');

      if (response.containsKey('token')) setCachedToken(response['token']);

      var stateInt = response['code'];
      var state = eAccountState.values[stateInt];
      var message = response['message'];
      if (message != null) {
        Log.write("Server response with message ",
            tag: "Authenticator", type: eLogType.VERBOSE);
      }
      currentState.value = state;
      return state;
    } catch (e, stack) {
      print(stack.toString());
      Log.write('Login failed ' + e.toString(),
          tag: 'Authenticator', type: eLogType.VERBOSE);
      return eAccountState.NETWORK_ERROR;
    }
  }

  // use for loging in silently based from cached token
  static Future<eAccountState> silentLogin({Cancellable cancellable}) async {
    currentState.value = eAccountState.WAITING;
    _init();
    var token = await cachedToken;
    if (token == null) return eAccountState.NOT_EXIST;
    if (await AppPreferences.lastLoggedUser < 0) {
      await setCachedToken(null);
      return eAccountState.NOT_EXIST;
    }

    var device = await deviceId;
    try {
      var response = await Socket.transmitDataAckTimeout(
        SOC_EVENT_AUTH,
        {'action': 'verify', 'device': device, 'token': token},
        retry: 1,
        cancel: cancellable,
        tag: 'Authenticator::autologin',
      );

      var state = response['code'];
      var result = eAccountState.values[state];
      if (result == eAccountState.NOT_EXIST) setCachedToken(null);
      currentState.value = result;
      return result;
    } catch (e) {
      currentState.value = eAccountState.SIGNED_IN_NOT_VERIFIED;
      return eAccountState.SIGNED_IN_NOT_VERIFIED;
    }
  }

  static Future<bool> logout() async {
    setCachedToken(null);
    AppPreferences.lastLoggedUser = null;
    var response = await Socket.transmitDataAckTimeout(
      SOC_EVENT_AUTH,
      {'action': 'logout', 'device': await deviceId},
      retry: -1,
      tag: 'Authenticator::autologin',
    );

    var state = response['code'];
    var signedOut = eAccountState.values[state] == eAccountState.SIGNED_OUT;
    currentState.value = eAccountState.values[state];
    Log.write('Request logout.', tag: 'Authenticator');
    return signedOut;
  }
}
