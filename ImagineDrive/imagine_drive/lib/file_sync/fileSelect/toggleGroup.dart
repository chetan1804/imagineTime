import 'dart:io';
import 'package:imagine_drive/file_sync/fileSelect/toggleInterface.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/file_sync/localFileDirectory.dart';
import 'package:imagine_drive/file_sync/records/fileSelectRecords.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:sqflite_common/sqlite_api.dart' as sqlapi;

const LOADED = 2;
const LOADING = 1;
const IDLE = 0;

class ToggleGroup<T extends List<ToggleInterface>, U> extends ToggleInterface {
  String name;
  int _loadState = IDLE;
  U data;
  T loaded;
  String uri;
  bool _expanded = false;
  bool get expanded => _expanded;
  int get loadState => _loadState;
  bool get isLoading => _loadState == LOADING;
  Future<T> setExpanded(bool value) {
    _expanded = value;
    if (value) return load();
    return Future.value(loaded);
  }

  // the method that provides fuction for loading data
  Future<T> Function(ToggleGroup<T, U>) loader;

  ToggleGroup(bool on, this.data, this.loader, this.uri, this.name) : super(on);

  Future<T> load() async {
    if (_loadState == LOADED) return loaded;
    if (_loadState == LOADING) {
      await FileSyncUtil.retry(
        (_retries) {
          if (_loadState == LOADED) {
            return Future.value();
          } else {
            return Future.error("Still loading");
          }
        },
        throwError: false,
        waiting: 1000,
        retry: 3,
        name: "ToggleGroup.load " + name,
      );
      return loaded;
    }
    _loadState = LOADING;
    var res = await loader(this);
    loaded = res;
    await Future.delayed(Duration(milliseconds: 500));
    _loadState = LOADED;
    return loaded;
  }

  recursiveToggle(bool ison) {
    this.isOn = ison;
    if (loaded == null) return;
    for (var item in loaded) {
      if (!(item is ToggleGroup))
        item.isOn = ison;
      else {
        var toggleg = item as ToggleGroup;
        toggleg.recursiveToggle(ison);
      }
    }
  }

  @override
  Future batchCommit(sqlapi.Batch batch) async {
    await super.batchCommit(batch);
    // toggle all children
    if (isDirty) {
      FileSelectRecords.toggleDirectory(
        uri,
        isOn,
        batch: batch,
        recursive: _loadState != LOADED,
      );
    }
    if (_loadState == LOADED) {
      for (var item in loaded) {
        await item.batchCommit(batch);
      }
    } else {}
    // if (_getPath != null)
    //   LocalFileDirectory.toggleFileVisibility(
    //       isOn ? FILE_ATTRIBUTE_NORMAL : FILE_ATTRIBUTE_HIDDEN, [_getPath()]);
  }
}
