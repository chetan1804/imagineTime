import 'dart:io';

import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/localFileDirectory.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/handlers/syncMarker.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:sqflite_common/sqlite_api.dart' as sqlapi;
import '../fileSync.dart';

// handles file records and its data and statuses
class FileXRecords {
  static const TABLE = 'sync';
  Future updateRecords(List<FileDefinition> files, {sqlapi.Batch batch}) async {
    for (var item in files) {
      await updateRecord(item, batch: batch);
    }
  }

  // use to update specific record
  Future updateRecord(FileDefinition file, {sqlapi.Batch batch}) async {
    // delete the old record if the file was renamed because where using uri as primary key
    if (file.data.oldRelativePath != "" &&
        file.data.oldRelativePath != file.data.relativePath) {
      await removeRecord(file.data.oldRelativePath, addMarker: false);
    }
    var row = await file.toRow();
    var json = Map<String, Object>.from(row);
    var sql = 'replace into ' + TABLE;
    var fields = json.keys
        .fold('(', (previousValue, element) => previousValue + element + ',');
    sql += fields.substring(0, fields.length - 1) + ')';
    sql += ' values';
    fields = json.values.fold('(', (previousValue, element) {
      if (element != null)
        return previousValue + '?,';
      else
        return previousValue + '?,';
    });
    sql += fields.substring(0, fields.length - 1) + ')';

    // step: execute query

    try {
      if (batch != null) {
        batch.execute(sql, List.from(json.values));
      } else {
        await FileRecords.startOperation();
        await FileRecords.database.execute(sql, List.from(json.values));
      }
    } catch (e) {
      Log.write(e.toString(), tag: 'FileRecords', type: eLogType.ERROR);
    } finally {
      FileRecords.endOperation();
    }

    if (SyncController.mounted)
      await SyncMarker.markAs(file.status, relativePath: file.relativePath);
  }

  Future removeRecord(String relativePath, {bool addMarker = true}) async {
    if (addMarker)
      await SyncMarker.markAs(eSyncState.DeleteLocal,
          relativePath: relativePath);
    if (FileRecords.database != null) {
      await FileRecords.database
          .delete(TABLE, where: 'uri = ?', whereArgs: [relativePath]);
    } else {
      Log.write(
          "Couldnt delete record " +
              relativePath +
              "FileRecords.database is null",
          tag: 'Reporter',
          type: eLogType.ERROR);
    }
  }

  Future<FileDefinition> retrieveRecordById(int id) async {
    var row = await FileRecords.database
        .query(TABLE, where: 'id = ?', whereArgs: [id], limit: 1);
    if (row.length > 0) {
      return FileDefinition.fromRow(row.first);
    } else {
      return null;
    }
  }

  // retrieve specific file given the relative path
  Future<FileDefinition> retrieveRecord(String relativePath) async {
    var results = await FileRecords.query(TABLE,
        where: 'uri = ?', whereArgs: [relativePath]);
    if (results.length > 0) return FileDefinition.fromRow(results[0]);
    return null;
  }

  Future<void> retrieveAllUnsynced(Function(FileDefinition) comparer) async {
    //int count = 0;
    List<Map<String, dynamic>> list;
    await FileRecords.startOperation();
    list = await FileRecords.database.rawQuery(
        "select sync.* from sync left outer join selection on sync.uri=selection.uri " +
            "where (selection.ison=1 or selection.ison is null) and sync.syncStatus!=? and " +
            "(sync.category='folder' or sync.totalSize>0) " +
            "order by sync.updateAt desc limit 20",
        [eSyncState.Synced.index]);

    FileRecords.endOperation();
    Log.write("Unsynced files: " + list.length.toString(),
        tag: 'FileRecords', type: eLogType.INFO);
    //count = list.length;
    for (var item in list) {
      if (!await comparer(FileDefinition.fromJson(item))) return;
    }
    await Future.delayed(Duration(seconds: 2));
  }

  // use to retrieve all synced files
  Future<List<FileData>> retrieveAllSynced({int limit = 20}) async {
    List<FileData> res = List.empty(growable: true);
    var queryResult = await FileRecords.query(TABLE,
        where: 'syncStatus = 1', limit: limit, orderBy: 'updateAt');
    for (var result in queryResult) {
      res.add(FileData.fromJson(result));
    }
    return Future.value(res);
  }

  // use to retrieve file with where condition
  Future<void> retrieveWhere(
      {String where,
      List<Object> whereArgs,
      Function(Map<String, dynamic>) comparer}) async {
    var files =
        await FileRecords.query(TABLE, where: where, whereArgs: whereArgs);
    for (var file in files) {
      comparer(file);
    }
  }

  Future<void> updateStatus(String path, eSyncState status) async {
    await FileRecords.startOperation();
    await FileRecords.database.update(TABLE, {'syncStatus': status.index},
        where: 'uri = ?', whereArgs: [path]);
    FileRecords.endOperation();
    await SyncMarker.markAs(status, relativePath: path);
  }

  Future markAsSynced(String path) {
    return updateStatus(path, eSyncState.Synced);
  }

  // mark file as deleted
  Future markAsDeleted(String path, {bool deleteActualFile = false}) async {
    if (deleteActualFile) {
      var file = File.fromUri(Uri.file(SyncController.mirrorPathData + path));
      if (await file.exists()) {
        LocalFileDirectory.skipReportFromPath(path);
        await file.delete();
        await LocalFileDirectory.removeSkipFromPath(path);
      }
    }
    await FileRecords.startOperation();
    await FileRecords.database.update(
        TABLE, {'syncStatus': eSyncState.Synced.index, 'status': 'archived'},
        where: 'uri = ?', whereArgs: [path]);
    FileRecords.endOperation();
    await SyncMarker.markAs(eSyncState.DeleteLocal, relativePath: path);
  }
}
