import 'package:imagine_drive/file_sync/fileSelect/toggleInterface.dart';
import 'package:imagine_drive/file_sync/records/fileSelectRecords.dart';
import 'package:sqflite_common/sqlite_api.dart' as sqlapi;

class FileToggle extends ToggleInterface {
  String uri;
  String fileName;
  String relativePath;
  FileToggle(bool isOn, this.uri, this.fileName, this.relativePath)
      : super(isOn);

  // load toggle based from  json
  static FileToggle fromMap(bool isOn, Map<String, dynamic> map) {
    var relativePath = map['uri'].toString();
    var fname = relativePath.split('\\').last;
    return FileToggle(isOn, map['uri'], fname, relativePath);
  }

  @override
  Future batchCommit(sqlapi.Batch batch) async {
    if (!isDirty) return;
    await super.batchCommit(batch);
    await FileSelectRecords.setFileSelection(uri, isOn, batch: batch);
    //var path = SyncController.mountPath + relativePath;
    //LocalFileDirectory.toggleFileVisibility(
    //    isOn ? FILE_ATTRIBUTE_NORMAL : FILE_ATTRIBUTE_HIDDEN, [path]);
  }
}
