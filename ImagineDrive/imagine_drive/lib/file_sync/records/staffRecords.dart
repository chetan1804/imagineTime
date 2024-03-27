import 'dart:io';

import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/firmData.dart';
import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/localFileDirectory.dart';
import 'package:imagine_drive/file_sync/records/fileSelectRecords.dart';
import 'package:imagine_drive/file_sync/staffData.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:sqflite_common/sqlite_api.dart' as sqlapi;

class StaffRecords {
  Future<StaffData> retrieveStaffByUserid(int userid) async {
    var res = await FileRecords.query('staff',
        where: 'userid = ?', whereArgs: [userid]);
    if (res.isNotEmpty) return StaffData.fromJson(res[0]);
    return null;
  }

  Future<StaffData> retrieveStaffById(int staffId) async {
    var res =
        await FileRecords.query('staff', where: 'id = ?', whereArgs: [staffId]);
    if (res.isNotEmpty) return StaffData.fromJson(res[0]);
    return null;
  }

  Future<StaffData> retrieveStaffByname(String name, int firm) async {
    var res = await FileRecords.database.rawQuery(
        "select *, firstname || ' ' || lastname as name from staff where name = ? and firm = ?",
        [name, firm]);
    if (res.isNotEmpty) return StaffData.fromJson(res[0]);
    return null;
  }

  // retrieve all staff given the firm
  Future<List<StaffData>> retrieveStaffForFirm(int firmId) async {
    var listStaffs = await FileRecords.query('staff',
        where: 'firm = ?', whereArgs: [firmId], orderBy: 'firstname');
    var output = List<StaffData>.empty(growable: true);
    for (var staff in listStaffs) {
      output.add(StaffData.fromJson(staff));
    }
    return output;
  }

  Future addStaff(StaffData staff, {sqlapi.Batch batch}) async {
    if (batch == null) {
      await FileRecords.startOperation(tag: "addStaff");
      await FileRecords.database.insert('staff', staff.toJson(),
          conflictAlgorithm: sqlapi.ConflictAlgorithm.replace);
      FileRecords.endOperation();
    } else {
      batch.insert('staff', staff.toJson(),
          conflictAlgorithm: sqlapi.ConflictAlgorithm.replace);
    }
    if (SyncController.mounted) _setupStaff(null, staff, true);
  }

  // function that sets up all staffs
  Future setupStaffs() async {
    if (!SyncController.mounted) return Future.value();

    List<int> tmpSelected2;
    return FileRecords.firm.retrieveAllFirm().then((firms) {
      for (var firm in firms) {
        retrieveStaffForFirm(firm.id).then((staffs) async {
          // setup all staffs
          var dir = new Directory(StaffData.getMirroredPath(firm, null));
          dir.createSync(recursive: true);
          tmpSelected2 = await FileSelectRecords.getAllSelectedStaff(firm.id);
          var batch = FileRecords.database.batch();
          for (var staff in staffs) {
            if (!SyncController.mounted) return;
            var ison = tmpSelected2.contains(staff.id);
            await _setupStaff(firm, staff, ison);
          }
          await FileRecords.commitBatch(batch);
        });
      }
    });
  }

  Future _setupStaff(FirmData firm, StaffData staff, bool ison,
      {sqlapi.Batch batch}) async {
    if (firm == null)
      firm = await FileRecords.firm.retrieveFirmById(staff.firm);

    var path = StaffData.getMirroredPath(firm, staff);
    var dir = Directory.fromUri(Uri.directory(path));
    dir.createSync(recursive: true);
    LocalFileDirectory.toggleFileVisibility(
      ison ? FILE_ATTRIBUTE_NORMAL : FILE_ATTRIBUTE_HIDDEN,
      [path],
    );

    // add file data information
    await FileRecords.file.updateRecord(
        FileDefinition(
            eSyncState.Synced,
            await FileData.fromLocalUri(
                Uri.directory(StaffData.getMirroredPath(firm, staff)))),
        batch: batch);
  }
}
