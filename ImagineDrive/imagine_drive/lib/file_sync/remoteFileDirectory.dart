import 'package:flutter/foundation.dart';
import 'package:imagine_drive/file_sync/clientData.dart';
import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileStatusSolver.dart';
import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/records/fileSelectRecords.dart';
import 'package:imagine_drive/file_sync/staffData.dart';
import 'package:imagine_drive/file_sync/userPreferences.dart';
import 'package:imagine_drive/file_sync/session/remoteSession.dart';
import 'package:imagine_drive/handlers/authenticator.dart';
import 'package:imagine_drive/handlers/socket.dart';
import 'package:imagine_drive/utils/callback.dart';
import 'package:imagine_drive/utils/cancelable.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:sqflite_common/sqlite_api.dart' as sqlapi;

import 'fileRecords.dart';
import 'firmData.dart';

class RemoteFileDirectory {
  static const TIMEOUT_TIME_SEC = 20; // in seconds
  static bool _isInit = false;
  static int _userId = -1;
  static const RETRIEVE_LIMIT = 140;

  /// callback when theres a file operation from other client. @param1: the relative path
  static Callback<List> onFileUpdated = Callback();
  static Function(ClientData) onClientAdded;

  static int _lastUpdateDate;
  static int _lastUpdateDateClient;
  static int _lastUpdateDateFirm;
  static int _lastUpdateDateStaff;
  static int _lastUpdateDateStaffF;

  // get the date time of most recent activity
  static int get lastUpdate => _lastUpdateDate;
  static int get lastUpdateClient => _lastUpdateDateClient;
  static int get lastUpdateFirm => _lastUpdateDateFirm;
  static int get lastUpdateStaff => _lastUpdateDateStaff;
  static int get lastUpdateStaffFiles => _lastUpdateDateStaffF;

  static set lastUpdate(int date) {
    _lastUpdateDate = date;
    UserPreferences.instance.lastRemoteUpdate = date;
  }

  static set lastUpdateClient(int date) {
    _lastUpdateDateClient = date;
    UserPreferences.instance.lastRemoteUpdateClient = date;
  }

  static set lastUpdateFirm(int date) {
    _lastUpdateDateFirm = date;
    UserPreferences.instance.lastRemoteUpdateFirm = date;
  }

  static set lastUpdateStaff(int date) {
    _lastUpdateDateStaff = date;
    UserPreferences.instance.lastRemoteUpdateStaff = date;
  }

  static set lastUpdateStaffFiles(int date) {
    _lastUpdateDateStaffF = date;
    UserPreferences.instance.lastRemoteUpdateStaffFiles = date;
  }

  // this reset the time use to query the data
  static void resetLastUpDate() {
    lastUpdate = DateTime(1970).millisecondsSinceEpoch;
    lastUpdateClient = DateTime(1970).millisecondsSinceEpoch;
    lastUpdateFirm = DateTime(1970).millisecondsSinceEpoch;
    lastUpdateStaff = DateTime(1970).millisecondsSinceEpoch;
    lastUpdateStaffFiles = DateTime(1970).millisecondsSinceEpoch;
    FileSelectRecords.resetSyncDate();
  }

  // function use to test if user was changed
  static void _onUserChanged() {
    if (Authenticator.userId == _userId) return;
    _userId = Authenticator.userId;
    //resetLastUpDate();
    _lastUpdateDate = UserPreferences.instance.lastRemoteUpdate;
    _lastUpdateDateClient = UserPreferences.instance.lastRemoteUpdateClient;
    _lastUpdateDateFirm = UserPreferences.instance.lastRemoteUpdateFirm;
    _lastUpdateDateStaffF = UserPreferences.instance.lastRemoteUpdateStaffFiles;
    _lastUpdateDateStaff = UserPreferences.instance.lastRemoteUpdateStaff;
  }

  static Future _init() async {
    _onUserChanged();
    if (_isInit) {
      return;
    }

    _isInit = true;

    // callback when theres an update from server specific for file changes
    // this includes file was deleted, uploaded or downloaded
    Socket.registerEvent(SOC_EVENT_FILE_DIR, (_data) {
      _updateRecord(_data);
    });
  }

  // callback when the record was changed
  static void _updateRecord(Map<String, dynamic> newData) async {
    eSyncState status;
    var action = newData['action'];
    var data = FileData.fromJson(newData['file']);
    if (data == null) return;
    switch (action) {
      case 'add':
      case 'add_dir':
      case 'remove':
      case 'failed':
        status = await FileStatusSolver.fromRemote(data);
        break;
      default:
        status = eSyncState.Unknown;
    }

    //status = await FileStatusSolver.fromRemote(fileD);
    //if (status != eSyncState.Synced)
    Log.writeFast(
        () =>
            data.relativePath +
            ' Record was updated. ' +
            status.toString() +
            ' ' +
            newData.toString(),
        tag: 'RemoteFileDirectory');
    onFileUpdated([status, data]);
    if (data.staffId >= 0)
      lastUpdateStaffFiles = data.updateAt.millisecondsSinceEpoch;
    else
      lastUpdate = data.updateAt.microsecondsSinceEpoch;
  }

  // use to add data to remote
  static Future<RemoteSession> initiateUploadSession(FileData pData,
      {int retry = 5, Cancellable cancel}) async {
    Log.write('Initiating upload session ' + pData.relativePath,
        tag: 'RemoteFileDirectory', type: eLogType.VERBOSE);
    var jsonFile = await pData.toJson();
    jsonFile['available'] = 0;
    var response = await Socket.transmitDataAckTimeout(
      SOC_EVENT_FILE_DIR,
      {'action': 'add', 'file': jsonFile},
      retry: retry,
      cancel: cancel,
      timeout: TIMEOUT_TIME_SEC * 1000,
      tag: "RemoteFileDirectory.initiateUploadSession",
    );

    if (response['code'] == 200)
      return Future.value(
          new RemoteSession(response['sessionId'], uri: pData.relativePath));

    return Future.error(
        'Failed initiating upload with server response ' + response['message']);
  }

  // use to add folder to remote
  static Future<void> createFolder(FileData pData,
      {int retry = 5, Cancellable cancel}) async {
    Log.write('Initiating upload session ' + pData.relativePath,
        tag: 'RemoteFileDirectory', type: eLogType.VERBOSE);
    var jsonFile = await pData.toJson();
    jsonFile['available'] = 0;
    var response = await Socket.transmitDataAckTimeout(
      SOC_EVENT_FILE_DIR,
      {'action': 'add_dir', 'file': jsonFile},
      retry: retry,
      cancel: cancel,
      timeout: TIMEOUT_TIME_SEC * 1000,
      tag: "RemoteFileDirectory.createFolder",
    );

    if (response['code'] == 200) return Future.value();

    return Future.error(
        'Failed initiating upload with server response ' + response['message']);
  }

  /// use to start downloading file
  static Future<RemoteSession> initiateDownloadSession(
      String relativePath, int offset,
      {int retry = 5, Cancellable cancel}) async {
    Log.write('Initiating download session ' + relativePath,
        tag: 'RemoteFileDirectory', type: eLogType.VERBOSE);
    var response = await Socket.transmitDataAckTimeout(
      SOC_EVENT_FILE_DIR,
      {
        'action': 'download',
        'file': {'uri': relativePath, 'offset': offset}
      },
      cancel: cancel,
      retry: retry,
      timeout: TIMEOUT_TIME_SEC * 1000,
      tag: 'RemoteFileDirectory.initiateDownloadSession',
    );

    if (response['code'] == 200)
      return Future.value(
          new RemoteSession(response['sessionId'], uri: relativePath));

    return Future.error(
        'Failed initiating download with message from server. ' +
            response['message']);
  }

  static Future renameFile(String currentRelativePath, String newRelativePath,
      {int retry = 5, Cancellable cancel}) async {
    Log.write('Request rename directory ' + currentRelativePath,
        tag: 'RemoteFileDirectory', type: eLogType.VERBOSE);
    var response = await Socket.transmitDataAckTimeout(
      SOC_EVENT_FILE_DIR,
      {
        'action': 'rename',
        'cpath': currentRelativePath,
        'tpath': newRelativePath
      },
      cancel: cancel,
      retry: retry,
      timeout: TIMEOUT_TIME_SEC * 1000,
      tag: "RemoteFileDirectory.renameFile",
    );

    if (response['code'] == 200) return Future.value();

    return Future.error(
        'Failed initiating download with message from server. ' +
            response['message']);
  }

  static Future fileDeleteRequest(String relativePath, int client,
      {Cancellable cancel, DateTime deleteTime}) {
    return Socket.transmitDataAckTimeout(
      SOC_EVENT_FILE_DIR,
      {
        'action': 'remove',
        'file': {
          'uri': relativePath,
          'client': client,
          'updateAt': deleteTime.millisecondsSinceEpoch,
          'status': 'archived',
        }
      },
      cancel: cancel,
      retry: 6,
      tag: "RemoteFileDirectory.fileDeleteRequest",
    );
  }

  // callback when current data coming from remote was updated.
  // this includes files that should be sync and available clients
  // @data: the response data from server
  // @return: future value where true if recieved updates
  static Future<bool> _onRecievedUpdatedLists(Map<String, dynamic> data) async {
    if (data.containsKey('clients')) {
      sqlapi.Batch batch = FileRecords.database.batch();
      var lastUpdateEpoch = _lastUpdateDateClient;
      data['clients'].forEach((client) async {
        var clientData = ClientData.fromJson(client);
        var updateAtEpoch = clientData.updateAt.millisecondsSinceEpoch;
        if (updateAtEpoch > lastUpdateEpoch) {
          lastUpdateEpoch = updateAtEpoch;
          lastUpdateClient = lastUpdateEpoch;
        }
        //print(client);
        await FileRecords.client.addClientRecord(clientData, batch: batch);
        if (onClientAdded != null) onClientAdded(clientData);
      });
      await batch.commit(noResult: true, continueOnError: true);
      return data['clients'].length > 0;
    }
    return false;
  }

  // use to reset server values.
  // WARNING: this should only be use on debug mode
  static Future reset() {
    return Socket.transmitDataAckTimeout(
      'reset',
      null,
      retry: 5,
      tag: "RemoteFileDirectory.reset",
    );
  }

  // use for retrieving sharelink
  static Future<String> retrieveShareLink(
      {@required String uri, int dayExpires = 365}) async {
    var response = await Socket.transmitDataAckTimeout(
      SOC_EVENT_FILE_DIR,
      {
        'action': 'shareLink',
        'uri': uri,
        'days': dayExpires,
      },
      retry: 2,
      tag: "RemoteFileDirectory.retrieveShareLink",
    );

    if (response['code'] == 200) return response['link'];

    return Future.error(
        'Failed initiating download with message from server. ' +
            response['message']);
  }

  /// retrieve firms for loged user
  static Future<void> _retrieveFirms() async {
    try {
      // start remote request
      Map<String, dynamic> response = await Socket.transmitDataAckTimeout(
        SOC_EVENT_FILE_DIR,
        {
          'action': 'firms',
          'device': await Authenticator.deviceId,
          'from': lastUpdateFirm,
        },
        retry: 4,
        tag: "RemoteFileDirectory:_retrieveFirms",
      );
      // parse response from request
      if (response.containsKey('firms')) {
        List<FirmData> firmList = [];
        sqlapi.Batch batch = FileRecords.database.batch();
        var _lastU = lastUpdateFirm;
        for (var firm in response['firms']) {
          var firmData = FirmData.fromJson(firm);
          var updateAtEpoch = firmData.updateAt.millisecondsSinceEpoch;
          if (updateAtEpoch > _lastU) _lastU = updateAtEpoch;
          firmList.add(firmData);
          await FileRecords.firm.addFirm(firmData, batch: batch);
        }
        await batch.commit(noResult: true, continueOnError: true);
        lastUpdateFirm = _lastU;
        return;
      }
    } catch (e) {
      Log.write(
        'ERror ' + e.toString(),
        tag: 'RemoteFileDirectory:retrieveFirm',
        type: eLogType.ERROR,
      );
    }
    return;
  }

  /// apply firm selection. and send request to server
  static Future<void> applyFirmSelection(List<FirmData> firms) async {
    try {
      List<int> firmIds = [];
      for (var item in firms) firmIds.add(item.id);

      // start remote request
      await Socket.transmitDataAckTimeout(
        SOC_EVENT_FILE_DIR,
        {
          'action': 'selectFirms',
          'device': await Authenticator.deviceId,
          'firms': firmIds
        },
        retry: 4,
        tag: "RemoteFileDirectory:applyFirmSelection",
      );
      return Future.value();
    } catch (e, stackTrace) {
      Log.write(e.toString(),
          tag: 'RemoteFileDirectory:', type: eLogType.ERROR);
      return Future.error(e, stackTrace);
    }
  }

  static Future _syncStaff() async {
    try {
      // lookup for clients
      do {
        var response = await Socket.transmitDataAckTimeout(
          SOC_EVENT_FILE_DIR,
          {
            'action': 'staff',
            'device': await Authenticator.deviceId,
            'from': lastUpdateStaff,
            'limit': RETRIEVE_LIMIT,
          },
          retry: 4,
          tag: "RemoteFileDirectory:_syncStaff",
        );
        // parse response from request
        if (response.containsKey('staff') && response['staff'].length > 0) {
          List<StaffData> stafflist = [];
          sqlapi.Batch batch = FileRecords.database.batch();
          var _lastU = lastUpdateStaff;
          for (var staff in response['staff']) {
            var staffdata = StaffData.fromJson(staff);
            var updateAtEpoch = staffdata.updateAt.millisecondsSinceEpoch;
            if (updateAtEpoch > _lastU) _lastU = updateAtEpoch;
            stafflist.add(staffdata);
            await FileRecords.staff.addStaff(staffdata, batch: batch);
          }
          await batch.commit(noResult: true, continueOnError: true);
          lastUpdateStaff = _lastU;
          return;
        } else
          break;
      } while (true);
    } catch (e) {
      Log.write("Failed syncing clients",
          tag: 'RemoteFileDirectory', type: eLogType.ERROR);
      return Future.error(e);
    }
  }

  // use to syncfiles and return the latest updateEpoch
  static Future<void> _syncFiles(
      {type: "files",
      lastUpdateEpoch: 0,
      partialSync: false,
      Function(int) onChangedEpoch}) async {
    try {
      do {
        // lookup for files
        var response = await Socket.transmitDataAckTimeout(
          SOC_EVENT_FILE_DIR,
          {
            'action': type,
            'device': await Authenticator.deviceId,
            'from': lastUpdateEpoch,
            'limit': RETRIEVE_LIMIT
          },
          retry: 4,
          tag: "RemoteFileDirectory:_syncFiles",
        );
        // iterate through retrieved files
        if (response.containsKey('files')) {
          var files = response['files'];
          Log.write(
              files.length.toString() + " was retrieved files for type " + type,
              tag: "RemoteFileDirectory");
          if (files.length > 0) {
            var dbbatch = FileRecords.database.batch();
            for (var file in files) {
              var fileData = FileData.fromJson(file);
              if (fileData != null) {
                // Log.write("File was added from remote. " + fileData.toString(),
                //     tag: "RemoteFileDirectory");
                if (fileData.updateAt.millisecondsSinceEpoch >
                    lastUpdateEpoch) {
                  lastUpdateEpoch = fileData.updateAt.millisecondsSinceEpoch;
                }
                var state = eSyncState.Synced;
                if (FileStatusSolver.isValidFile(fileData)) {
                  // add file data to records if not yet synced
                  state = await FileStatusSolver.fromRemote(fileData);
                } else {
                  Log.write(
                      fileData.relativePath +
                          " Invalid File." +
                          fileData.toString(),
                      tag: "RemoteFileDirectory",
                      type: eLogType.WARNING);
                }
                if (state != eSyncState.Synced) {
                  await FileRecords.file.updateRecord(
                      FileDefinition(state, fileData),
                      batch: dbbatch);
                  await FileSelectRecords.isFileSyncable(fileData,
                      batch: dbbatch);
                }
              } else {
                var updateAt = file['updateAt'];
                if (updateAt.runtimeType == double)
                  updateAt = updateAt.toInt() + 1;
                var updateAtV =
                    DateTime.fromMillisecondsSinceEpoch(updateAt, isUtc: true);
                if (updateAtV.millisecondsSinceEpoch > lastUpdateEpoch) {
                  lastUpdateEpoch = updateAtV.millisecondsSinceEpoch;
                }
              }
            }
            await FileRecords.commitBatch(dbbatch);
            if (onChangedEpoch != null) onChangedEpoch(lastUpdateEpoch);

            // are files already downloaded?
            if (partialSync || files.length < RETRIEVE_LIMIT) {
              break;
            }
          } else {
            break;
          }
        } else if (response['code'] == 400) {
          Log.write(response['message'],
              tag: "RemoteFileDirectory:_syncFiles:" + type,
              type: eLogType.ERROR);
          break;
        }
      } while (true);
    } catch (e, stack) {
      Log.write(e.toString(),
          tag: "RemoteFileDirectory:_syncFiles:" + type, type: eLogType.ERROR);
      print(stack.toString());
      return Future.error('Sync error: unable to retrieve remote master list.');
    }
  }

  // use to sync all clients
  static Future _syncClients() async {
    try {
      await _init();
    } on FormatException {
      resetLastUpDate();
    }

    try {
      // lookup for clients
      do {
        var response = await Socket.transmitDataAckTimeout(
          SOC_EVENT_FILE_DIR,
          {
            'action': 'clients',
            'device': await Authenticator.deviceId,
            'fromClient': lastUpdateClient,
            'limit': RETRIEVE_LIMIT,
          },
          retry: 4,
          tag: "RemoteFileDirectory:_syncClients",
        );
        if (response.containsKey('clients') && response['clients'].length > 0)
          await _onRecievedUpdatedLists(response);
        else
          break;
      } while (true);
    } catch (e) {
      Log.write("Failed syncing clients",
          tag: 'RemoteFileDirectory', type: eLogType.ERROR);
      return Future.error(e);
    }
  }

  // requests fresh copy of file list from server with the initial time
  static Future<void> updateStart({partialSync: false}) async {
    try {
      await _init();
    } on FormatException {
      resetLastUpDate();
    }
    try {
      Log.write("Remote sync start", tag: "RemoteFileDirectory");
      await Future.wait([_retrieveFirms(), _syncClients(), _syncStaff()]);
      await Future.wait([
        _syncFiles(
            lastUpdateEpoch: lastUpdate,
            partialSync: partialSync,
            onChangedEpoch: (epoch) => lastUpdate = epoch),
        _syncFiles(
            type: 'staff_files',
            lastUpdateEpoch: lastUpdateStaffFiles,
            partialSync: partialSync,
            onChangedEpoch: (epoch) => lastUpdateStaffFiles = epoch)
      ]);
      await FileSelectRecords.sync();
    } catch (e, stack) {
      print(stack);
      Log.write("Failed syncing. " + e.toString(),
          tag: "RemoteFileDirectory", type: eLogType.ERROR);
    }
  }

  static void updateEnd() {}
}
