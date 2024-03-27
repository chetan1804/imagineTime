import 'dart:io';

import 'package:imagine_drive/file_sync/clientData.dart';
import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/firmData.dart';
import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/localFileDirectory.dart';
import 'package:imagine_drive/file_sync/records/fileSelectRecords.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:sqflite_common/sqlite_api.dart' as sqlapi;

class ClientRecords {
  Future<ClientData> getClientFromName(String name, int firm) async {
    var res = await FileRecords.query('client',
        where: 'instr(name,?) and firm=?', whereArgs: [name, firm]);
    if (res.length > 0) return ClientData.fromJson(res[0]);
    return null;
  }

  Future<ClientData> getClientFromId(int id) async {
    var res =
        await FileRecords.query('client', where: 'id = ?', whereArgs: [id]);
    if (res.length > 0) return ClientData.fromJson(res[0]);
    return null;
  }

  // retrieve all clients for firm
  // Future<List<ClientData>> retrieveAllByFirm(int firmId) async {
  //   var results = await FileRecords.database
  //       .query("client", where: "firm=?", whereArgs: [firmId]);
  //   return results.map((item) => ClientData.fromJson(item)).toList();
  // }

  Future<void> retrieveListByFirm(
      int firmId, Function(ClientData) comparer) async {
    int count = 0;
    List<Map<String, dynamic>> list;
    var i = 0;
    do {
      //await FileRecords.startOperation(tag: "RetrieveListByFirm");
      list = await FileRecords.query("client",
          where: "firm=?",
          whereArgs: [firmId],
          orderBy: "name",
          limit: 20,
          offset: i * 20);
      //FileRecords.endOperation();
      count = list.length;
      i++;
      for (var item in list) {
        comparer(ClientData.fromJson(item));
      }
    } while (count >= 19);
  }

  // efficient way of querying clients for selected firms
  Future<void> retrieveSelected(Function(ClientData) comparer) async {
    int count = 0;
    List<Map<String, dynamic>> list;
    var i = 0;
    var limit = 20;
    do {
      //await FileRecords.startOperation(tag: "retrieveSelected");
      list = await FileRecords.database.rawQuery(
          "select * from client where (select count(*) from sync join selection on selection.file=sync.id where selection.ison!=0 and sync.client=client._id)>0 limit ? offset ?",
          [i * limit]);

      //FileRecords.endOperation();
      count = list.length;
      i++;
      for (var item in list) {
        var isContinue = comparer(ClientData.fromJson(item));
        // the return type is a future value?
        if (isContinue is Future<bool>) isContinue = await isContinue;
        if (isContinue) {
          count = 0;
          break;
        }
      }
    } while (count >= limit - 1);
  }

  // use to add/update client records
  Future<void> addClientRecords(List<ClientData> clients) async {
    if (clients.length > 0) {
      var batch = FileRecords.database.batch();
      for (var item in clients) {
        batch.insert('client', item.toJson(),
            conflictAlgorithm: sqlapi.ConflictAlgorithm.replace);
      }
      await batch.commit(noResult: true, continueOnError: true);
    }
  }

  Future addClientRecord(ClientData client, {sqlapi.Batch batch}) async {
    if (batch == null) {
      await FileRecords.startOperation(tag: "addClientRecord");
      await FileRecords.database.insert('client', client.toJson(),
          conflictAlgorithm: sqlapi.ConflictAlgorithm.replace);
      FileRecords.endOperation();
    } else {
      batch.insert('client', client.toJson(),
          conflictAlgorithm: sqlapi.ConflictAlgorithm.replace);
    }
    if (SyncController.mounted) _setupClient(null, client, true);
  }

  Future setupAllClients() {
    if (!SyncController.mounted) return Future.value();
    var tmpSelected;
    // retrieve all firms
    return FileRecords.firm.retrieveAllFirm().then((firms) async {
      // retrieve all clients for each firm
      for (var firm in firms) {
        if (!SyncController.mounted) return;
        tmpSelected = await FileSelectRecords.getAllSelectedClients(firm.id);
        var batch = FileRecords.database.batch();
        await retrieveListByFirm(firm.id, (client) async {
          var ison = tmpSelected.contains(client.id);
          await _setupClient(firm, client, ison, batch: batch);
        });
        await FileRecords.commitBatch(batch);
      }
    });
  }

  Future _setupClient(FirmData firm, ClientData client, bool ison,
      {sqlapi.Batch batch}) async {
    if (firm == null) {
      firm = await FileRecords.firm.retrieveFirmById(client.firm);
    }

    var path = SyncController.mirrorPathData + firm.name + '\\' + client.name;
    // make sure client directory exists

    try {
      var clientDir = Directory.fromUri(Uri.directory(path));
      if (!clientDir.existsSync()) clientDir.createSync(recursive: true);

      LocalFileDirectory.toggleFileVisibility(
        ison ? FILE_ATTRIBUTE_NORMAL : FILE_ATTRIBUTE_HIDDEN,
        [path],
      );
      // add file data information
      await FileRecords.file.updateRecord(
          FileDefinition(eSyncState.Synced,
              await FileData.fromLocalUri(Uri.directory(path))),
          batch: batch);
    } catch (e, stack) {
      print(stack);
      Log.write(path + " " + e.message,
          tag: "SyncReporter", type: eLogType.ERROR);
    }
  }
}
