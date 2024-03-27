import 'package:imagine_drive/file_sync/fileSelect/firmSelect.dart';
import 'package:imagine_drive/file_sync/fileSelect/toggleGroup.dart';
import 'package:imagine_drive/file_sync/fileSelect/toggleGroupFile.dart';
import 'package:imagine_drive/file_sync/records/fileSelectRecords.dart';
import 'package:imagine_drive/file_sync/staffData.dart';
import 'package:sqflite_common/sqlite_api.dart' as sqlapi;

// this record the list
class StaffFiles extends FileGroupToggle<StaffData> {
  StaffFiles(bool isOn, StaffData data, String uri)
      : super(
          isOn,
          data,
          data.name,
          uri: uri,
        );
  @override
  Future batchCommit(sqlapi.Batch batch) async {
    await super.batchCommit(batch);
    if (isDirty && loadState != LOADED) {
      // await FileSelectRecords.toggleDirectory(data.firm, data.id, isOn,
      //     batch: batch);
    }
  }
}
