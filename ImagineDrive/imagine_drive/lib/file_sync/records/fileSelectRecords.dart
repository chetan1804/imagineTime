// this file handles operation for updating file selection
// changes local and remote

import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/fileSelect/fileToggle.dart';
import 'package:imagine_drive/file_sync/localFileDirectory.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/file_sync/userPreferences.dart';
import 'package:imagine_drive/handlers/authenticator.dart';
import 'package:imagine_drive/handlers/socket.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:sqflite_common/sqlite_api.dart' as sqlapi;

import '../fileData.dart';

const SELECTION_TABLE = 'selection';
const SYNCED = 0; // file selection is syced
const UNSYNCED = 1; // file selection is not synced and later should be synced

// this class handles data for file sync selection.
// This manages local records and syncing to server
class FileSelectRecords {
  static Future<List<int>> getAllSelectedClients(int firmId) async {
    // client is on if still theres no files
    var select1 = "(select count(*) from sync where sync.client=client.id)=0";
    // client is on theres 1 file and above is selected
    var select2 =
        "(select count(*) from sync left outer join selection on sync.uri=selection.uri where (selection.ison!=0 or selection.ison is null) and sync.client=client.id)>0";
    var query = "select * from client where client.firm=? and (" +
        select1 +
        " or " +
        select2 +
        ")";
    var list = await FileRecords.database.rawQuery(query, [firmId]);

    FileRecords.endOperation();
    return Future.value(list.map<int>((e) => e["id"]).toList());
  }

  static Future<List<int>> getAllSelectedStaff(int firmId) async {
    // staff is on if still theres no files
    var select1 = "(select count(*) from sync where sync.personal=staff.id)=0";
    // staff is on if theres 1 file and above is selected
    var select2 =
        "(select count(*) from sync left outer join selection on sync.uri=selection.uri where (selection.ison!=0 or selection.ison is null) and sync.personal=staff.id)>0";
    var list = await FileRecords.database.rawQuery(
        "select * from staff where staff.firm=? and (" +
            select1 +
            " or " +
            select2 +
            ")",
        [firmId]);

    FileRecords.endOperation();
    return Future.value(list.map<int>((e) => e["id"]).toList());
  }

  // use to check if directory is selected
  static Future<bool> isDirectorySelected(String relativePath,
      {bool defaultIfNotFound = true}) async {
    var query1 = await FileRecords.database.rawQuery(
        "select * from selection where uri=?" + " and ison>=0 ",
        [relativePath]);
    if (query1.isEmpty) return defaultIfNotFound;
    return query1.first["ison"] == 1;
  }

  // get all selected files
  static Future<List<FileToggle>> getDirFiles(String uri) async {
    var query =
        "select sync.*, selection.ison from sync left join selection on selection.uri=sync.uri " +
            "where sync.uri like ?";

    var files = await FileRecords.database.rawQuery(query, [uri + "%"]);
    List<FileToggle> fileOutput = List.empty(growable: true);
    for (var filedata in files) {
      var isOn = true;
      var tmpIsOn = filedata["ison"];
      if (tmpIsOn != null && tmpIsOn == 0) isOn = false;
      fileOutput.add(FileToggle.fromMap(isOn, filedata));
    }
    return fileOutput;
  }

  // // get all selected files
  // static Future<List<FileToggle>> getAllFiles(
  //     {String where, List<Object> whereArgs}) async {
  //   var query =
  //       "select sync.*, selection.ison from sync left join selection on selection.uri=sync.uri";
  //   if (where.isNotEmpty) {
  //     query += " where " +
  //         where +
  //         " and sync.status!='archived' and sync.status!='deleted'";
  //   }
  //   var files = await FileRecords.database.rawQuery(query, whereArgs);
  //   List<FileToggle> fileOutput = List.empty(growable: true);
  //   for (var filedata in files) {
  //     var isOn = true;
  //     var tmpIsOn = filedata["ison"];
  //     if (tmpIsOn != null && tmpIsOn == 0) isOn = false;
  //     fileOutput.add(FileToggle.fromMap(isOn, filedata));
  //   }
  //   return fileOutput;
  // }

  // set the file toggle/select value
  static Future setFileSelection(String uri, bool isOn,
      {sqlapi.Batch batch}) async {
    await updateFile(
        null, null, uri, isOn, DateTime.now().millisecondsSinceEpoch,
        batch: batch, status: UNSYNCED);
    // batch.update(SELECTION_TABLE, {"ison": isOn ? 1 : 0, "status": 1},
    //     where: "uri=?",
    //     whereArgs: [uri],
    //     conflictAlgorithm: ConflictAlgorithm.replace);
  }

  // recursively toggle directory and its files within it
  static void toggleDirectory(String relativePath, bool isOn,
      {sqlapi.Batch batch, bool recursive = true}) {
    if (recursive) {
      _toggleAllChildrenFiles(relativePath, isOn, batch: batch);
    } else {
      var now = DateTime.now().millisecondsSinceEpoch;
      batch.rawInsert(
        "insert into selection(uri, ison, updateAt, status) " +
            "values(?,?,?,?) on conflict(uri) do update set ison=?, status=?, updateAt=?",
        [
          relativePath,
          isOn ? 1 : 0,
          now,
          UNSYNCED,
          isOn ? 1 : 0,
          UNSYNCED,
          now
        ],
      );
    }

    UserPreferences.instance.workingDirectory.then((value) {
      LocalFileDirectory.toggleFileVisibility(
        isOn ? FILE_ATTRIBUTE_NORMAL : FILE_ATTRIBUTE_HIDDEN,
        [value + "\\data\\" + relativePath],
      );
    });
  }

  static void _toggleAllChildrenFiles(String relativeUri, bool isOn,
      {sqlapi.Batch batch}) async {
    var now = DateTime.now().millisecondsSinceEpoch;
    if (isOn)
      batch.rawUpdate(
        "update selection set ison=?, updateAt=?, status=? " +
            "where uri like ?",
        [1, now, UNSYNCED, relativeUri + "%"],
      );
    else
      batch.rawInsert(
        "insert into selection(uri, ison, updateAt, status)" +
            " select sync.uri, ?, ?, ? from sync where sync.uri like ?" +
            " on conflict(uri) do update set ison=?, status=?, updateAt=?",
        [0, now, UNSYNCED, relativeUri + "%", 0, UNSYNCED, now],
      );
  }

  static Future<int> getLastUpdate() async {
    var query =
        "select updateAt from selection where status=? order by updateAt desc ";

    var res = await FileRecords.database.rawQuery(query, [SYNCED]);
    if (res.isNotEmpty) return res[0]["updateAt"];
    return 0;
  }

  static Future updateFile(
      int id, int fileId, String uri, bool isOn, int updateAt,
      {sqlapi.Batch batch, int status = SYNCED}) async {
    var res = await FileRecords.query(SELECTION_TABLE,
        where: "uri=?", whereArgs: [uri]);

    if (res.isNotEmpty) {
      var tmpUpdate = res[0]["updateAt"] as int;
      if (tmpUpdate >= updateAt) return;
    }
    var sql = "insert into selection(id, file, uri, ison, updateAt, status) " +
        "values(?,?,?,?,?,?) on conflict(uri) do update set ison=?, status=?, updateAt=?";
    var sqlparam = [
      id,
      fileId,
      uri,
      isOn ? 1 : 0,
      updateAt,
      status,
      isOn ? 1 : 0,
      status,
      updateAt
    ];
    if (batch != null) {
      batch.rawInsert(sql, sqlparam);
    } else {
      FileRecords.database.rawInsert(sql, sqlparam);
    }
    if (SyncController.mounted) {
      LocalFileDirectory.toggleFileVisibility(
        isOn ? FILE_ATTRIBUTE_NORMAL : FILE_ATTRIBUTE_HIDDEN,
        [SyncController.mirrorPathData + uri],
      );
    }
  }

  static Future sync() async {
    await _SelectionSyncer.sync();
  }

  static void resetSyncDate() {
    _SelectionSyncer.syncDate = 0;
  }

  // update the syncing for specific file
  // return async true if this file will syncs
  static Future<bool> isFileSyncable(FileData data,
      {sqlapi.Batch batch}) async {
    var folders = data.relativePath.split("\\");
    var currentFolder = "";
    // use to check if the parent client folder is selected
    if (await data.client >= 0) {
      var firmname = folders.first;
      if (!await isDirectorySelected(firmname + "\\" + CLIENTS_DIR)) {
        setFileSelection(data.relativePath, false, batch: batch);
        return false;
      }
    }
    // check if parent are all sync-on
    for (var i = 0; i < folders.length; i++) {
      currentFolder += folders[i];
      if (!await isDirectorySelected(currentFolder)) {
        setFileSelection(data.relativePath, false, batch: batch);
        return false;
      }
      if (i + 1 < folders.length) currentFolder += "\\";
    }
    return true;
  }
}

// this class is use for syncing selection local cache to server. downloading and uploading
class _SelectionSyncer {
  static int _syncDate = -1;

  static Future sync() async {
    await _downloadData();
    await _uploadData();
  }

  static set syncDate(int val) {
    _syncDate = val;
    UserPreferences.instance.setInt("selectd", val);
  }

  static int get syncDate {
    if (_syncDate >= 0) return _syncDate;
    _syncDate = UserPreferences.instance.getInt("selectd", defaultV: 0);
    return _syncDate;
  }

  static Future _downloadData() async {
    const limit = 20;
    try {
      do {
        // create download request
        var res = await Socket.transmitDataAckTimeout(
          SOC_EVENT_FILE_DIR,
          {
            'action': 'dl_selection',
            'device': await Authenticator.deviceId,
            'from': syncDate,
            'limit': limit,
          },
          retry: -1,
          tag: "Downloading selection data",
        );
        if (res["code"] == 200) {
          var items = res['data'];
          if (items.length > 0) {
            var batch = FileRecords.database.batch();

            for (var item in items) {
              var updatedat = (item["updatedAt"]).toInt() + 1;
              await FileSelectRecords.updateFile(
                item["_id"],
                item["_file"],
                item["uri"],
                item["ison"],
                updatedat,
                batch: batch,
              );
              if (syncDate < updatedat) syncDate = updatedat;
            }
            FileRecords.commitBatch(batch);
          }

          if (items.length == 0) {
            break;
          }
        } else
          break;
      } while (true);
    } catch (e) {
      Log.write(
        "Failed download select " + e.toString(),
        type: eLogType.ERROR,
        tag: "FileSelectRecords",
      );
    }
  }

  // update data to server
  static Future _uploadData() async {
    var i = 0;
    var userid = Authenticator.currentUser.userid;
    sqlapi.Batch batch;
    do {
      // retrieve all unsynced database
      var unsynced = await FileRecords.query(SELECTION_TABLE,
          where: "status=?",
          whereArgs: [UNSYNCED],
          limit: 20,
          offset: i * 20,
          orderBy: "updateAt");
      // mark it as synced
      batch = FileRecords.database.batch();
      var data = unsynced.map((e) {
        batch.update(SELECTION_TABLE, {'status': SYNCED},
            where: 'uri=?', whereArgs: [e['uri']]);
        return {
          '_id': e['id'],
          'updated_at': e['updateAt'],
          '_file': e['file'],
          '_user': userid,
          'uri': e['uri'],
          'ison': e['ison']
        };
      }).toList();

      if (data.length == 0) break;

      // then upload unsynced data
      try {
        await Socket.transmitDataAckTimeout(
          SOC_EVENT_FILE_DIR,
          {
            'action': 'up_selection',
            'files': data,
          },
          tag: "Uploading selection data",
        );

        // apply changing file selection status from unsynced to synced
        await batch.commit(noResult: true, continueOnError: true);
        for (var item in unsynced) {
          var updatedat = item["updateAt"];
          if (syncDate < updatedat) syncDate = updatedat;
        }
      } catch (e, stackTrace) {
        print(stackTrace);
        Log.write("Failed transmit " + e.toString(),
            tag: "FileSelectRecords", type: eLogType.ERROR);
        break;
      }
      if (data.length < 20) break;
    } while (true);
  }
}
