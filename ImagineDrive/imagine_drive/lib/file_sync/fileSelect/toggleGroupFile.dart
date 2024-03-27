import 'package:imagine_drive/file_sync/fileSelect/fileToggle.dart';
import 'package:imagine_drive/file_sync/fileSelect/toggleGroup.dart';
import 'package:imagine_drive/file_sync/records/fileSelectRecords.dart';

/// data for toggling group of files. where U is the data of group which can use for retrieving files
class FileGroupToggle<U> extends ToggleGroup<List<FileToggle>, U> {
  /// constructor
  /// @data: data attached to the group
  /// @whereFileQ: the query to get the file data
  /// @whereArgsFileQ: the query args
  /// @path: the path use to update the attribute of directory. can be empty
  FileGroupToggle(bool isOn, U data, String name, {String uri})
      : super(isOn, data, null, uri, name) {
    this.loader = _loader;
  }

  /// callback when files under a client will be loaded
  Future<List<FileToggle>> _loader(
      ToggleGroup<List<FileToggle>, U> instance) async {
    return await FileSelectRecords.getDirFiles(uri);
  }
}
