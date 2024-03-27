import 'dart:io';

import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/syncReporter.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/file_sync/fileStatusSolver.dart';
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
  static const MAX_LIST = 2;
  static String _mountPath; // path that being check
  static String _driveLetter;
  static String _mirrorPath;
  static bool _isInit = false;
  static FileSyncList _syncList = new FileSyncList(MAX_LIST);

  static bool get mounted => _isInit;
  static String get mountPath => _mountPath;
  static String get mirrorPath => _mirrorPath;
  static String get driveLetter => _driveLetter;
  static FileSyncList get queue => _syncList;
  static bool get autoSync => SyncReporter.autoSync;
  static set autoSync(bool val) => SyncReporter.autoSync = val;
  static bool get isWaitingFull {
    _syncList.processNextActive();
    return _syncList.isWaitingFull();
  }

  static Future<void> setMountPath(String mirrorPath,
      {String driveLetter = DEFAULT_MOUNT_DRIVE}) async {
    if (!_isInit) {
      SyncReporter.onReport = _fileKeeper;
      _isInit = true;
    }

    _mirrorPath = mirrorPath + '\\';
    _driveLetter = driveLetter;
    _mountPath = driveLetter + '\\';
    await Directory.fromUri(Uri.directory(_mirrorPath + 'data\\'))
        .create(recursive: true);
    await VirtualDrive.mount(
        driveLetter, _mirrorPath + 'data', DRIVE_DESCRIPTION);
  }

  /// finish syncing with the file
  /// @isSuccess: true to mark this file as synced.
  static void syncFinish(FileSync file, {bool isSuccess = false}) {
    _syncList.removeActive(file);
    file.close();
    if (isSuccess) FileRecords.markAsSynced(file.relativePath);
    if (autoSync) nextSync();
  }

  // destroy means this file synce will be permanently removed
  static void destroyFileSync(FileSync file) async {
    _syncList.removeActive(file);
    file.close();
    await FileRecords.removeRecord(file.relativePath);
    if (autoSync) nextSync();
  }

  // process next file to sync
  static void nextSync() {
    _syncList.processNextActive();
    if (!_syncList.isWaitingFull()) {
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
        if (!_syncList.isWaitingFull()) _syncList.addToWaiting(status, data);
        break;
      case eSyncState.DeleteLocal:
      case eSyncState.DeleteRemote:
        _syncList.addToActive(status, data: data);
        break;
      case eSyncState.Synced:
        break;
      default:
        Log.write('Unknown status. skipped on queue.', tag: 'SyncController');
        return;
    }

    _syncList.processNextActive();
  }

  static bool _requestProcessing = false;
  // act as Gate Keeper for any file changes. decides where file will be added
  // callback when theres a file that needs to be synced
  // return true if can process next request
  static Future<bool> _fileKeeper(eSyncState status, FileData data) async {
    if (status == eSyncState.Unknown || status == eSyncState.Synced)
      return Future.error(
          'Data couldnt be add. Invalid status ' + status.toString());

    // fix for issue where _syncList.isContains doesnt return the expected value because of async
    while (_requestProcessing) {
      await Future.delayed(Duration(milliseconds: 300));
    }

    _requestProcessing = true;

    // condition either the sync request will be added to queue or will be ignore insteadd
    // create or update sync
    if (_syncList.isContains(data.uri)) {
      // status was unknown so should be ignored
      if (status == eSyncState.Unknown) {
        _requestProcessing = false;
        return true;
      }

      // file with delete status will be move to active list
      if ((status == eSyncState.DeleteLocal ||
              status == eSyncState.DeleteRemote) &&
          _syncList.getWaiting(data.uri) != null) {
        var moved = _syncList.moveWaitingToActive(data.uri);
        if (moved == null)
          throw 'Cant sync file from waiting ' + data.uri.toString();
      } else {
        _syncList.updateStatus(status, data: data);
      }
    } else if (!_syncList.isWaitingFull()) {
      _addWaitingOrActive(data, status);
    } else {
      // ignore. because queue is full
      _requestProcessing = false;
      return false;
    }

    _requestProcessing = false;
    return !_syncList.isWaitingFull();
  }

  /// callback when added a file sync
  static void onAddedSyncFile(FileSync fileSync) {
    if (fileSync.status.value == eSyncState.Synced)
      Log.write('File ' + fileSync.relativePath + ' is already synced.',
          tag: 'SyncController::add', type: eLogType.WARNING);

    // update sync records
    FileRecords.updateRecords(
        [FileDefinition(fileSync.status.value, fileSync.data)]);

    // resync when found an error
    fileSync.error.listen((error) async {
      await Future.delayed(Duration(seconds: 1));
      _syncList.processNextActive();
    });
    fileSync.sync();
  }

  /// cancel all file sync operations
  static void destroyAllFileSync({bool clearWaiting = true}) {
    while (_syncList.activeSync.isNotEmpty) {
      destroyFileSync(_syncList.activeSync.last);
    }
    if (clearWaiting) _syncList.clearWaiting();
  }

  /// start manual syncing
  static Future sync() {
    return SyncReporter.sync();
  }
}
