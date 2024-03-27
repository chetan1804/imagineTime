import 'dart:io';

import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/localFileDirectory.dart';
import 'package:imagine_drive/file_sync/records/fileSelectRecords.dart';
import 'package:imagine_drive/file_sync/staffData.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:sqflite_common/sqlite_api.dart' as sqlapi;
import '../firmData.dart';

// use for handling local cached firms
class FirmRecords {
  /// use to retrieve the firm by name
  Future<FirmData> retrieveFirmByName(String name) async {
    var res =
        await FileRecords.query('firm', where: 'name = ?', whereArgs: [name]);
    if (res.length > 0) return FirmData.fromJson(res[0]);
    return null;
  }

  /// use to retrieve the firm by id
  Future<FirmData> retrieveFirmById(int id) async {
    var res = await FileRecords.query('firm', where: 'id = ?', whereArgs: [id]);
    if (res.length > 0) return FirmData.fromJson(res[0]);
    return null;
  }

  // retrieve all firm
  Future<List<FirmData>> retrieveAllFirm() async {
    var res = await FileRecords.query('firm');
    List<FirmData> firms = List.empty(growable: true);
    for (var item in res) {
      firms.add(FirmData.fromJson(item));
    }
    return firms;
  }

  // retrieve all staffs
  Future<List<StaffData>> retrieveAllStaffByFirm(int firmId) async {
    var res = await FileRecords.query('staff',
        where: 'firm = ?', whereArgs: [firmId]);
    List<StaffData> staffs = List.empty(growable: true);
    for (var item in res) {
      staffs.add(StaffData.fromJson(item));
    }
    return staffs;
  }

  // add firm
  Future addFirm(FirmData firm, {sqlapi.Batch batch}) async {
    if (batch == null) {
      await FileRecords.startOperation();
      await FileRecords.database.insert('firm', firm.toJson(),
          conflictAlgorithm: sqlapi.ConflictAlgorithm.replace);
      FileRecords.endOperation();
    } else {
      batch.insert('firm', firm.toJson(),
          conflictAlgorithm: sqlapi.ConflictAlgorithm.replace);
    }
    if (SyncController.mounted) await _setupFirm(firm);
  }

  // function to setup all firms
  Future setupAllFirm() async {
    var firms = await retrieveAllFirm();
    var batch = FileRecords.database.batch();
    for (var firm in firms) {
      await _setupFirm(firm, batch: batch);
    }
    await FileRecords.commitBatch(batch);
  }

  Directory firmDir, tmpDir;
  Future _setupFirm(FirmData firm, {sqlapi.Batch batch}) async {
    var firmpath = SyncController.mirrorPathData + firm.name;
    firmDir = Directory.fromUri(Uri.directory(firmpath));
    if (!await firmDir.exists()) {
      firmDir.create();
    }
    tmpDir = Directory.fromUri(Uri.directory(firmpath + "\\" + GENERAL_DIR));
    if (!await tmpDir.exists()) {
      tmpDir.create();
    }
    tmpDir = Directory.fromUri(Uri.directory(firmpath + "\\" + STAFF_DIR));
    if (!await tmpDir.exists()) {
      tmpDir.create();
    }
    // this is toggle visibility for firm and general directory
    var isFirmOn = await FileSelectRecords.isDirectorySelected(firm.name);
    var isGenOn = await FileSelectRecords.isDirectorySelected(
        firm.name + "\\" + GENERAL_DIR);
    LocalFileDirectory.toggleFileVisibility(
      isFirmOn ? FILE_ATTRIBUTE_NORMAL : FILE_ATTRIBUTE_HIDDEN,
      [firmpath],
    );
    LocalFileDirectory.toggleFileVisibility(
      isGenOn ? FILE_ATTRIBUTE_NORMAL : FILE_ATTRIBUTE_HIDDEN,
      [firmpath + "\\" + GENERAL_DIR],
    );
    // add file data information
    await FileRecords.file.updateRecord(
        FileDefinition(
            eSyncState.Synced,
            await FileData.fromLocalUri(
                Uri.directory(firmpath + "\\" + GENERAL_DIR))),
        batch: batch);
    await FileRecords.file.updateRecord(
        FileDefinition(
            eSyncState.Synced,
            await FileData.fromLocalUri(
                Uri.directory(firmpath + "\\" + STAFF_DIR))),
        batch: batch);
    await FileRecords.file.updateRecord(
        FileDefinition(
            eSyncState.Synced,
            await FileData.fromLocalUri(
                Uri.directory(firmpath + "\\" + CLIENTS_DIR))),
        batch: batch);
    await FileRecords.file.updateRecord(
        FileDefinition(eSyncState.Synced,
            await FileData.fromLocalUri(Uri.directory(firmpath))),
        batch: batch);
  }

  Future toggleSync(int firmId) {}
}
