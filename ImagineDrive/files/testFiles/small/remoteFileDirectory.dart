import 'dart:io';

import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/session/remoteSession.dart';
import 'package:imagine_drive/handlers/socket.dart';
import 'package:imagine_drive/utils/callback.dart';
import 'package:imagine_drive/utils/cancelable.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/log.dart';

class RemoteFileDirectory {
  static const TIMEOUT_TIME_SEC = 20; // in seconds
  static bool _isInit = false;
  static List<FileData> _files = [];
  static List<String> _clients = [];
  static DateTime _lastUpdate = new DateTime(1970);

  /// callback when theres a file operation from other client. @param1: the relative path
  static Callback<List> onFileUpdated = Callback();

  static DateTime get lastUpdate => _lastUpdate;
  static List<FileData> get files => _files;
  static List<String> get clients => _clients;

  static void _init() {
    if (_isInit) return;

    _isInit = true;

    // callback when theres an update from server specific for file changes
    // this includes file was deleted, uploaded or downloaded
    Socket.registerEvent(SOC_EVENT_FILE_DIR, (_data) {
      eSyncState status;
      switch (_data['action']) {
        case 'add':
          status = eSyncState.Redownload;
          break;
        case 'remove':
          status = eSyncState.DeleteLocal;
          break;
        default:
          status = eSyncState.Unknown;
      }
      _updateRecord(status, _data['file']);
    });
  }

  // callback when the record was changed
  static void _updateRecord(eSyncState status, Map<String, dynamic> newData) {
    var path = newData['uri'];
    var fileD = fromRelativePath(path);

    if (fileD == null) {
      fileD = FileData.fromJson(newData);
      _files.add(fileD);
    } else
      fileD.updateFromJson(newData);

    _lastUpdate = fileD.lastModified;
    Log.write(
        path +
            ' Record was updated. ' +
            status.toString() +
            ' ' +
            newData.toString(),
        tag: 'RemoteFileDirectory');
    onFileUpdated([status, fileD]);
  }

  // check specific path if exist in remote
  static bool isExist(String path) {
    return fromRelativePath(path) != null;
  }

  static FileData fromRelativePath(String relativePath) {
    for (var file in _files) {
      if (file.relativePath == relativePath) return file;
    }

    return null;
  }

  static FileData fromUri(Uri uri) {
    for (var file in _files) {
      if (file.uri == uri) return file;
    }

    return null;
  }

  // use to add data to remote
  static Future<RemoteSession> initiateUploadSession(FileData pData,
      {int retry = 5, Cancellable cancel}) async {
    files.add(pData);
    var jsonFile = pData.toJson();
    jsonFile['available'] = 0;
    var response = await Socket.transmitDataAckTimeout(
        SOC_EVENT_FILE_DIR, {'action': 'add', 'file': jsonFile},
        retry: retry, cancel: cancel, timeout: TIMEOUT_TIME_SEC * 1000);

    if (response['code'] == 200)
      return Future.value(new RemoteSession(response['sessionId']));

    return Future.error(
        'Failed initiating upload with server response ' + response['message']);
  }

  // use to start downloading file
  //
  static Future<RemoteSession> initiateDownloadSession(
      String relativePath, int offset,
      {int retry = 5, Cancellable cancel}) async {
    var response = await Socket.transmitDataAckTimeout(
        SOC_EVENT_FILE_DIR,
        {
          'action': 'download',
          'file': {'uri': relativePath, 'offset': offset}
        },
        cancel: cancel,
        retry: retry,
        timeout: TIMEOUT_TIME_SEC * 1000);

    if (response['code'] == 200)
      return Future.value(new RemoteSession(response['sessionId']));

    return Future.error(
        'Failed initiating download with message ' + response['message']);
  }

  static Future fileDeleteRequest(String relativePath, String client,
      {Cancellable cancel, DateTime deleteTime}) {
    return Socket.transmitDataAckTimeout(
        SOC_EVENT_FILE_DIR,
        {
          'action': 'remove',
          'file': {
            'uri': relativePath,
            'client': client,
            'lastModified': deleteTime.toUtc().millisecondsSinceEpoch,
            'deleted': true,
          }
        },
        cancel: cancel,
        retry: 6);
  }

  // callback when current data coming from remote was updated.
  // this includes files that should be sync and available clients
  // @data: the response data from server
  static void _onRecievedUpdatedLists(Map<String, dynamic> data) {
    _clients.clear();
    files.clear();
    data['files'].forEach((file) => _files.add(FileData.fromJson(file)));
    data['clients'].forEach((client) => _clients.add(client));
    //print((data));
  }

  // use to reset server values.
  // WARNING: this should only be use on debug mode
  static Future reset() {
    return Socket.transmitDataAckTimeout('reset', null, retry: 5);
  }

  // requests fresh copy of file list from server with the initial time
  static Future<List<FileData>> update() async {
    _init();

    // transmit request to server
    try {
      var response = await Socket.transmitDataAckTimeout(SOC_EVENT_FILE_DIR,
          {'action': 'update', 'initDate': lastUpdate.millisecondsSinceEpoch},
          retry: 4);
      _onRecievedUpdatedLists(response);
      return Future.value(_files);
    } catch (e, stack) {
      print(stack.toString());
      return Future.error('Sync error: unable to retrieve remote master list.');
    }
  }
}
