import 'dart:io';

import 'package:flutter_dokan/flutter_dokan.dart';
import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/fileStatusSolver.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/utils/log.dart';
import './fileSync.dart';
import 'fileData.dart';
import 'syncController.dart';
import 'localFileDirectory.dart';
import 'remoteFileDirectory.dart';
import '../handlers/socket.dart' as MySocket;

/*
    syncReporter.dart
    Class that search for files that was changed locally or remotely and report
    to registered listeners.
 */
class SyncReporter {
  // if true, this will automatically sync whenever there was file changes on the target path
  static bool autoSync = true;
  static Function(eSyncState, FileData) _onReport;
  static bool get syncing => _syncing;
  static bool _syncing = false;
  static bool _isInit = false;
  static Map<Uri, List<eSyncState>> ignoreList = Map();

  // callback when theres a need to sync a file
  static set onReport(Function(eSyncState, FileData) request) {
    _onReport = request;
    if (!_isInit) {
      _isInit = true;
      MySocket.Socket.connected.listen(_onConnectionChanged);
      LocalFileDirectory.onFileStateChanged = _onFileStateChanged;
      RemoteFileDirectory.onFileUpdated.add(_onRemoteFileChanged);
    }
  }

  static void _onConnectionChanged(bool connected) {
    if (connected && autoSync) sync();
  }

  // callback when file on mount directory was changed
  static void _onFileStateChanged(
      FileStatus status, String path, String oldpath) async {
    if (!autoSync) return;

    if (!FileSyncUtil.isValidPath(path)) return;

    var sStatus = eSyncState.Unknown;

    switch (status) {
      case FileStatus.FILE_MODIFIED:
        sStatus = eSyncState.Reupload;
        break;
      case FileStatus.FILE_DELETED:
        sStatus = eSyncState.DeleteRemote;
        break;
      case FileStatus.FILE_MOVED:
        print('Moved oldpath ' + oldpath);
        sStatus = eSyncState.Reupload;
        break;
      default:
    }

    if (sStatus == eSyncState.Unknown) return;
    Uri uri;
    path = SyncController.driveLetter + path;

    try {
      uri = Uri.file(path);
    } catch (e) {
      print('invalid path ' + path);
      return;
    }

    // is the changed was marked for skipping?
    var skipInfo = ignoreList[uri];
    if (skipInfo != null) {
      var index = skipInfo.indexOf(sStatus);

      if (index >= 0) {
        skipInfo.removeAt(index);
        if (skipInfo.length == 0) ignoreList.remove(skipInfo);
        Log.write('Ignores ' + path + ' status: ' + sStatus.toString(),
            tag: 'SynReporter', type: eLogType.VERBOSE);
        return;
      }
    }

    // added delay. fix for File Data modified date and time doestnt return correctly when read while still copying
    await Future.delayed(Duration(seconds: 1));
    Log.write(
        'File changes ' + uri.toString() + ' status ' + sStatus.toString(),
        tag: 'SyncReporter',
        type: eLogType.VERBOSE);
    var fileData = await LocalFileDirectory.fromUri(uri);
    await _onReport(sStatus, fileData);
  }

  // callback when a remote file was changed
  static void _onRemoteFileChanged(List args) async {
    eSyncState status = args[0];
    FileData fileData = args[1];
    await _onReport(status, fileData);
  }

  // use to synchronize all remote files with local files
  static Future<void> sync() async {
    if (syncing) return Future.value();
    if (SyncController.isWaitingFull) return Future.value();

    _syncing = true;
    Log.write("search start", tag: 'Reporter');
    try {
      await RemoteFileDirectory.update();
    } catch (e) {
      print(e);
      _syncing = false;
      return Future.value();
    }

    _syncClients();
    await _syncFiles();

    Log.write("search end", tag: 'Reporter');
    _syncing = false;
    return Future.value();
  }

  // sync all files from remote to local
  static Future<void> _syncFiles() async {
    List<FileData> remoteFiles = List.from(RemoteFileDirectory.files);

    // resume unsynced files
    var unsynced = await FileRecords.retrieveAllUnsynced();
    for (var item in unsynced) {
      if (!await _onReport(item.status, item.data)) return Future.value();
    }
/*
    // check all local files that can be uploaded
    await LocalFileDirectory.retrieveAllFiles((localFile) async {
      if (!(localFile is Directory)) {
        var uri = localFile.uri;
        var remoteI = remoteFiles.indexWhere((element) => element.uri == uri);

        // file was already uploaded?
        if (remoteI >= 0) {
          remoteFiles.removeAt(remoteI);
        }

        var fileData = await LocalFileDirectory.fromFileSystem(localFile);
        var status = await FileStatusSolver.fromLocal(fileData);
        return await _onReport(status, fileData);
      } else
        return true;
    });

    // check all remote files that can be downlaoded
    for (var item in remoteFiles) {
      // report. and is it necessary to continue?
      var status = await FileStatusSolver.fromRemote(item);
      if (!await _onReport(status, item)) break;
    }*/
  }

  // sync all client directory
  static void _syncClients() {
    RemoteFileDirectory.clients.forEach((client) {
      // make sure client directory exists
      var clientDir = new Directory(SyncController.mountPath + client);
      if (!clientDir.existsSync()) clientDir.createSync(recursive: true);
    });
  }

  // use to skip specific report at one time. can be use when doesnt want to recieve any report for a specific changes
  // @uri: file uri which will be skipped
  static void skipReport(Uri uri, {eSyncState status}) {
    if (ignoreList.containsKey(uri))
      ignoreList[uri].add(status);
    else
      ignoreList[uri] = List.filled(1, status, growable: true);
  }

  /// skip reporting for file modification
  static void skipReportForChanges(Uri uri) {
    skipReport(uri, status: eSyncState.Reupload);
  }

  static void removeAllSkip(Uri uri) {
    ignoreList.remove(uri);
  }
}
