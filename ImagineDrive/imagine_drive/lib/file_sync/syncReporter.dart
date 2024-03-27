import 'dart:io';

import 'package:imagine_drive/file_sync/clientData.dart';
import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/records/fileSelectRecords.dart';
import 'package:imagine_drive/file_sync/staffData.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/log.dart';
import './fileSync.dart';
import 'fileData.dart';
import 'firmData.dart';
import 'syncController.dart';
import 'localFileDirectory.dart';
import 'remoteFileDirectory.dart';
import '../handlers/socket.dart' as MySocket;

/*
    syncReporter.dart
    Class that listens for files that was changed locally or remotely and report
    to registered listeners.
 */
class SyncReporter {
  // if true, this will automatically sync whenever there was file changes on the target path
  static bool _autoSync = true;
  static Function(bool) onSync; // event to be called when start syncing
  static Function(eSyncState, FileData, bool) _onReport;
  static bool get syncing => _syncing;
  static bool _syncing = false;
  static bool _isInit = false;
  static set autoSync(bool value) {
    _autoSync = value;
    //LocalFileDirectory.listenToFileEvents = value;
    Log.write('Auto sync = ' + value.toString(), tag: 'SyncReporter');
  }

  static bool get autoSync => _autoSync;

  static void stopSync() {
    _syncing = false;
    if (onSync != null) onSync(false);
    Log.write('Sync stopped', tag: 'SyncReporter', type: eLogType.VERBOSE);
  }

  // callback when theres a need to sync a file
  /// @param 1: the status of file
  /// @param 2: the file data that was updated
  /// @param 3: true if record should be updated
  static set onReport(Function(eSyncState, FileData, bool) request) {
    _onReport = request;
    if (!_isInit) {
      _isInit = true;
      MySocket.Socket.connected.listen(_onConnectionChanged);
      LocalFileDirectory.onFileStateChanged = _onFileStateChanged;
      RemoteFileDirectory.onFileUpdated.add(_onRemoteFileChanged);
      //RemoteFileDirectory.onClientAdded = _onClientUpdated;
    }
  }

  static void _onConnectionChanged(bool connected) {
    if (connected) {
      if (autoSync && SyncController.mounted) sync();
    } else {
      stopSync();
    }
  }

  // callback when file on mount directory was changed
  static void _onFileStateChanged(eSyncState status, FileData data) {
    /*if (!autoSync) {
      Log.writeFast(
          () =>
              'Ignore file because autosync was disabled ' +
              data.relativePath +
              ' ' +
              status.toString(),
          tag: 'SyncReported',
          type: eLogType.VERBOSE);
      return;
    }*/
    _onReport(status, data, true);
  }

  // callback when a remote file was changed
  static void _onRemoteFileChanged(List args) {
    eSyncState status = args[0];
    FileData fileData = args[1];
    _onReport(status, fileData, true);
  }

  // use to synchronize all remote files with local files
  static Future<void> sync() async {
    if (syncing) {
      Log.write('Sync already in progress',
          tag: 'SyncReporter', type: eLogType.WARNING);
      return Future.value();
    }
    if (onSync != null) onSync(true);
    _syncing = true;
    Log.write("search start", tag: 'Reporter');
    try {
      await RemoteFileDirectory.updateStart(partialSync: true);
    } catch (e) {
      print(e);
      stopSync();
      return Future.value();
    }

    await _syncFiles();
    RemoteFileDirectory.updateEnd();

    Log.write("search end", tag: 'Reporter');
    stopSync();
    return Future.value();
  }

  // sync all unsynced files
  static Future<void> _syncFiles() async {
    if (SyncController.isWaitingFull) {
      return Future.value();
    }
    // resume unsynced files
    Log.write("Syncing unsynced files base from record...",
        tag: "SyncReportter", type: eLogType.VERBOSE);
    await FileRecords.file.retrieveAllUnsynced((file) async {
      if (!await _onReport(file.status, file.data, false)) return false;
      return true;
    });
  }
}
