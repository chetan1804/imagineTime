// specific toggle data for firm and its subdirectories and files
import 'dart:core';
import 'dart:io';

import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/fileSelect/toggleGroup.dart';
import 'package:imagine_drive/file_sync/fileSelect/clientFiles.dart';
import 'package:imagine_drive/file_sync/fileSelect/StaffFiles.dart';
import 'package:imagine_drive/file_sync/fileSelect/toggleGroupFile.dart';
import 'package:imagine_drive/file_sync/firmData.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:sqflite_common/sqlite_api.dart' as sqlapi;
import '../records/fileSelectRecords.dart';

class FirmSelect extends ToggleGroup<List<ToggleGroup>, FirmData> {
  int firmId = 0;
  String name;
  bool isClientOn = true;
  bool isStaffOn = true;
  bool isGeneralOn = true;

  List<ToggleGroup> get groups {
    return [general, clients, staffs];
  }

  ToggleGroup<List<ClientFiles>, FirmData> clients;
  FileGroupToggle<FirmData> general;
  ToggleGroup<List<StaffFiles>, FirmData> staffs;
  // 0 - unloaded, 1 - loading, 2 - loaded
  int _firmLoadState = 0;
  bool _cancelled = false;

  FirmSelect(bool isOn, FirmData firm)
      : super(isOn, firm, null, firm.name, firm.name) {
    firmId = firm.id;
    name = firm.name;
    loader = _loader;
  }

  // callback when this firm will load all needed values
  Future<List<ToggleGroup>> _loader(dynamic group) async {
    if (_firmLoadState == 2) return loaded;
    while (_firmLoadState == 1) {
      sleep(Duration(seconds: 1));
      if (_cancelled) {
        return null;
      }
    }
    isClientOn =
        await FileSelectRecords.isDirectorySelected(data.name + "\\Clients");
    isGeneralOn = await FileSelectRecords.isDirectorySelected(
        data.name + "\\" + GENERAL_DIR);
    isStaffOn = await FileSelectRecords.isDirectorySelected(
        data.name + "\\" + STAFF_DIR);

    // initialize subdirs file groups
    clients = ToggleGroup(
      isClientOn,
      data,
      _loadClients,
      data.name + "\\" + CLIENTS_DIR,
      CLIENTS_DIR,
    );
    staffs = ToggleGroup(
      isStaffOn,
      data,
      _loadStaffs,
      data.name + '\\' + STAFF_DIR,
      STAFF_DIR,
    );
    general = FileGroupToggle<FirmData>(
      isGeneralOn,
      data,
      GENERAL_DIR,
      uri: data.name + '\\' + GENERAL_DIR,
    );
    _firmLoadState = 2;
    // if this is dirty then toggle all subfloders
    if (isDirty) {
      clients.isOn = isOn;
      staffs.isOn = isOn;
      general.isOn = isOn;
    }
    return [general, clients, staffs];
  }

  // callback when clients will be loaded
  Future<List<ClientFiles>> _loadClients(ToggleGroup group) async {
    List<ClientFiles> outputGroup = List.empty(growable: true);
    await FileRecords.client.retrieveListByFirm(firmId, (client) async {
      var ison = await FileSelectRecords.isDirectorySelected(
          data.name + "\\" + client.name);
      var clientSelect =
          ClientFiles(ison, client, data.name + "\\" + client.name);
      if (isDirty) clientSelect.isOn = isOn;
      outputGroup.add(clientSelect);
    });
    return outputGroup;
  }

  // callback when staffs will be loaded
  // this load all staff info
  Future<List<StaffFiles>> _loadStaffs(ToggleGroup group) async {
    var staffs = await FileRecords.staff.retrieveStaffForFirm(firmId);
    List<StaffFiles> output = List.empty(growable: true);
    for (var staff in staffs) {
      var ison = await FileSelectRecords.isDirectorySelected(
          data.name + "\\" + STAFF_DIR + "\\" + staff.name);
      var staffSelect = StaffFiles(
          ison, staff, data.name + "\\" + STAFF_DIR + "\\" + staff.name);
      output.add(staffSelect);
      if (isDirty) staffSelect.isOn = isOn;
    }
    return output;
  }

  @override
  Future batchCommit(sqlapi.Batch batch) async {
    await super.batchCommit(batch);
    // everything was toggled
    // if (isDirty) {
    //   FileSelectRecords.toggleDirectory(
    //     data.name,
    //     isOn,
    //     batch: batch,
    //     recursive: l,
    //   );
    // }
  }

  // use to retrieve all toggle firm
  static Future<List<FirmSelect>> retrieveAll() async {
    var firms = await FileRecords.firm.retrieveAllFirm();
    var output = List<FirmSelect>.empty(growable: true);
    for (var item in firms) {
      var ison = await FileSelectRecords.isDirectorySelected(item.name);
      output.add(FirmSelect(ison, item));
    }
    return output;
  }

  // use to save all modified selections
  static Future<void> saveAll(List<FirmSelect> firms) async {
    var batch = FileRecords.database.batch();
    for (var item in firms) {
      await item.batchCommit(batch);
    }
    FileRecords.commitBatch(batch);
  }
}
