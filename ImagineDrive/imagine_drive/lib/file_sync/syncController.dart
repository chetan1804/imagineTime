import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/file_sync/records/fileSelectRecords.dart';
import 'package:imagine_drive/file_sync/userPreferences.dart';
import 'package:imagine_drive/file_sync/syncReporter.dart';
import 'package:imagine_drive/handlers/authenticator.dart';
import 'package:imagine_drive/utils/callback.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:imagine_drive/utils/virtualDrive.dart';

import 'fileData.dart';
import 'fileSync.dart';
import 'fileSyncList.dart';

/*
  This controls the file syncing for all files. It is the one decides who will
  be sync or not.
  This class also listens to local and remote file changes.

  call Sync() for look for files to be sync.
 */
class SyncController {
  /// maximum files that can be added on queue. the higher the number the lesser the file to be read
  static const MAX_LIST = 20;
  static String _mountPath; // path that being check
  static String _driveLetter;
  static String _mirrorPath;
  static bool _isInit = false;
  static FileSyncList _syncList = new FileSyncList(MAX_LIST);

  static bool get mounted => VirtualDrive.isMounted;
  static String get mountPath => _mountPath;
  static String get mirrorPath => _mirrorPath;
  static String get mirrorPathData => _mirrorPath + 'data\\';
  static String get driveLetter => _driveLetter;
  static FileSyncList get queue => _syncList;
  static bool get isSyncing => SyncReporter.syncing;
  static bool get autoSync => SyncReporter.autoSync;
  static set autoSync(bool val) => SyncReporter.autoSync = val;
  static bool get isWaitingFull {
    _syncList.processNextActive();
    return _syncList.isWaitingFull();
  }

  // events
  static Callback<dynamic> onSyncFinish =
      Callback(); // event to be called when finish syncing a file
  static set onSync(Function(bool) onEvent) =>
      SyncReporter.onSync = onEvent; // event to be called when start syncing

  // is it okay to add new sync file to queue
  static bool get isAddNewOkay {
    _syncList.processNextActive();
    return _syncList.isAddNewOkay;
  }

  /// call this before using sync features
  static Future<void> initializeForUser(
      {@required int userId, String driveLetter}) async {
    //Log.write("Initialize user " + userId.toString(),
    //    tag: 'SyncController', type: eLogType.VERBOSE);
    await UserPreferences.initializeForUser(userId);
    await FileRecords.initialize();
    await setMountPath(driveLetter: driveLetter);
    FileRecords.setupDir();
    if (!_isInit) {
      SyncReporter.onReport = _fileKeeper;
      _isInit = true;
      Authenticator.currentState.listen(_onAccountStateChanged);
    }
    _onAccountStateChanged(Authenticator.currentState.value);
  }

  static Future<void> uninitialize() async {
    autoSync = false;
    await stopAllFileSync(permanentlyRemove: false);
    await FileRecords.close();
    if (mounted) {
      await VirtualDrive.unMount();
    }
    _isInit = false;
    SyncReporter.stopSync();
    Authenticator.currentState.unlisten(_onAccountStateChanged);
    UserPreferences.dispose();
  }

  static Future<void> setMountPath(
      {String mirrorPath, String driveLetter}) async {
    if (mirrorPath == null) {
      mirrorPath = await UserPreferences.instance.workingDirectory;
    }

    // STEP: load the default drive if nothing was specified
    if (driveLetter == null) {
      driveLetter = UserPreferences.instance.lastDriveLetter;
      //if (driveLetter == null) driveLetter = DEFAULT_MOUNT_DRIVE;
      if (driveLetter == null) {
        Log.write('Drive letter is empty. Skipping.',
            tag: 'SyncController::setMount', type: eLogType.WARNING);
        return;
      } else if (kReleaseMode) {
        // check if drive letter is already taken
        if (await FileSyncUtil.isDirectoryExists(driveLetter + "\\")) {
          Log.write('Drive letter is already taken. Finding a new one.',
              tag: 'SyncController::setMount', type: eLogType.WARNING);
          driveLetter = await FileSyncUtil.getAvailableDriveLetter();
          UserPreferences.instance.lastDriveLetter = driveLetter;
        }
      }
    } else
      UserPreferences.instance.lastDriveLetter = driveLetter;

    _mirrorPath = mirrorPath + '\\';
    _driveLetter = driveLetter;
    _mountPath = driveLetter + '\\';

    Log.write(
        'Start mounting to ' + driveLetter + ', mirror path ' + _mirrorPath,
        tag: 'SyncController',
        type: eLogType.VERBOSE);

    // STEP: unmount old, mount new
    await Directory.fromUri(Uri.directory(_mirrorPath + 'data\\'))
        .create(recursive: true);
    if (VirtualDrive.isMounted) await VirtualDrive.unMount();
    await VirtualDrive.mount(
        driveLetter, _mirrorPath + 'data', DRIVE_DESCRIPTION);

    var driveDir = Directory.fromUri(Uri.directory(_mountPath));
    // STEP: wait to be mounted
    await FileSyncUtil.retry((_retry) async {
      if (!await driveDir.exists()) return Future.error('Retry mounting...');
    }, retry: 2, name: 'SyncController::setMountPath');

    Log.write('Mounted to ' + driveLetter + ', mirror path ' + _mirrorPath,
        tag: 'SyncController', type: eLogType.VERBOSE);
  }

  // callback when account changed
  static void _onAccountStateChanged(eAccountState state) {
    switch (state) {
      case eAccountState.SIGNED_IN_VERIFIED:
        autoSync = true;
        sync();
        break;
      default:
        autoSync = false;
    }
  }

  /// finish syncing with the file
  /// @isSuccess: true to mark this file as synced.
  static void syncFinish(FileSync file, {bool isSuccess = false}) async {
    _syncList.removeActive(file);
    file.close();

    if (isSuccess) {
      await FileRecords.file.markAsSynced(file.relativePath);
    }
    onSyncFinish([file, isSuccess]);
    if (autoSync) nextSync();
  }

  // destroy means this file synce will be removed
  // @removeRecord: if true sync information will be removed it means it syncing is pending for file it will be not be automatically synced
  static Future stopFileSync(FileSync file, {bool removeRecord = true}) async {
    _syncList.removeActive(file);
    if (file.running) file.close();
    if (removeRecord) await FileRecords.file.removeRecord(file.relativePath);
    if (autoSync) {
      nextSync();
    }
  }

  // process next file to sync
  static void nextSync({int delay = 1}) async {
    if (delay > 0) await Future.delayed(Duration(seconds: delay));
    Log.write("Looking for next to sync...",
        tag: "SyncController", type: eLogType.VERBOSE);
    _syncList.processNextActive();
    if (_syncList.currentActive <= 0) {
      sync();
    }
  }

  // decides whether the file will be in waiting or in active
  static void _addWaitingOrActive(FileData data, eSyncState status) async {
    switch (status) {
      // add file to queue if state is one of following
      case eSyncState.Downloading:
      case eSyncState.Uploading:
      case eSyncState.Redownload:
      case eSyncState.Reupload:
      case eSyncState.Rename:
        if (!_syncList.isWaitingFull()) _syncList.addToWaiting(status, data);
        break;
      case eSyncState.DeleteLocal:
      case eSyncState.DeleteRemote:
        _syncList.addToActive(status, data: data);
        break;
      case eSyncState.Synced:
        Log.write('Skipped. Already synced.',
            tag: 'SyncController', type: eLogType.WARNING);
        break;
      default:
        Log.write('Unknown status. skipped on queue.',
            tag: 'SyncController', type: eLogType.WARNING);
        return;
    }

    _syncList.processNextActive();
  }

  // act as Gate Keeper for any file changes. decides if file will be added to sync list
  // callback when theres a file that needs to be synced
  // return true if can process next request
  static Future<bool> _fileKeeper(
      eSyncState status, FileData data, bool willRecordUpdate) async {
    // update sync records
    if (willRecordUpdate) {
      updateRecord(status, data);
    }

    // only process file if sign in is verified
    if (!Authenticator.isSignVerified) {
      Log.write('Couldnt process file, sign in is not verified.',
          tag: 'SyncController', type: eLogType.WARNING);
      return true;
    }

    if (status == eSyncState.Unknown || status == eSyncState.Synced) {
      Log.write(
          data.relativePath + ' status skippable, ignored.' + status.toString(),
          tag: 'SyncController::_fileKeeper',
          type: eLogType.WARNING);
      return true;
    }

    // update if this file will be synced or not
    //if (willRecordUpdate) {
    if (!await FileSelectRecords.isFileSyncable(data)) {
      Log.write(data.relativePath + ' sync was off, file ignored.',
          tag: 'SyncController::_fileKeeper', type: eLogType.VERBOSE);
      return true;
    }
    //}

    // condition either the sync request will be added to queue or will be ignore insteadd
    // create or update sync
    if (_syncList.isContains(data.relativePath)) {
      // status was unknown so should be ignored
      if (status == eSyncState.Unknown) {
        return true;
      }

      // file with delete status will be move to active list
      // or file is not yet exist
      if ((status == eSyncState.DeleteLocal ||
              status == eSyncState.DeleteRemote) &&
          _syncList.getWaiting(data.relativePath) != null) {
        var moved = _syncList.moveWaitingToActive(data.relativePath);
        if (moved == null) {
          Log.write('Cant sync file from waiting ' + data.relativePath,
              tag: "SyncController", type: eLogType.ERROR);
        }
      } else {
        _syncList.updateStatus(status, data: data);
      }
    } else if (!_syncList.isWaitingFull()) {
      _addWaitingOrActive(data, status);
    } else {
      // ignore. because queue is full
      return false;
    }

    return !_syncList.isWaitingFull();
  }

  static Future<void> updateRecord(eSyncState status, FileData data) {
    return FileRecords.file.updateRecord(FileDefinition(status, data));
  }

  /// callback when added a file sync. dont call this directly. insteadd use queue
  static void onAddedSyncFile(FileSync fileSync) {
    if (fileSync.status.value == eSyncState.Synced)
      Log.write('File ' + fileSync.relativePath + ' is already synced.',
          tag: 'SyncController::add', type: eLogType.WARNING);

    // resync when found an error
    /*
    fileSync.error.listen((error) async {
      await Future.delayed(Duration(seconds: 1));
      _syncList.processNextActive();
    });*/
  }

  /// callback from filesync when recieved an error
  static void onErrorFile(FileSync sync, {bool destroy = false}) async {
    if (destroy) stopFileSync(sync);
    await Future.delayed(Duration(seconds: 1));
    _syncList.processNextActive();
  }

  /// cancel all file sync operations
  static Future stopAllFileSync(
      {bool clearWaiting = true, bool permanentlyRemove = true}) async {
    while (_syncList.activeSync.isNotEmpty) {
      await stopFileSync(_syncList.activeSync.last,
          removeRecord: permanentlyRemove);
    }
    if (clearWaiting) _syncList.clearWaiting();
  }

  /// start manual syncing
  static Future sync() {
    if (!mounted) {
      Log.write('Couldnt synced, drive is not mounted',
          tag: 'SyncController', type: eLogType.WARNING);
      return Future.value();
    }
    return SyncReporter.sync();
  }
}
