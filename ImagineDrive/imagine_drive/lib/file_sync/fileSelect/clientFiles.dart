import 'package:imagine_drive/file_sync/clientData.dart';
import 'package:imagine_drive/file_sync/fileSelect/toggleGroup.dart';
import 'package:imagine_drive/file_sync/fileSelect/toggleGroupFile.dart';
import 'package:sqflite_common/sqlite_api.dart' as sqlapi;

class ClientFiles extends FileGroupToggle<ClientData> {
  ClientFiles(bool isOn, ClientData client, String uri)
      : super(isOn, client, client.name, uri: uri);
  @override
  Future batchCommit(sqlapi.Batch batch) async {
    await super.batchCommit(batch);
    if (isDirty && loadState != LOADED) {
      //await FileSelectRecords.toggleClient(data.firm, data.id, isOn,
      //    batch: batch);
    }
  }
}
