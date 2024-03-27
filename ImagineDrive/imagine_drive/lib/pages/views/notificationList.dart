import 'package:flutter/material.dart';
import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/pages/views/fileDataView.dart';

class NotificationList extends StatefulWidget {
  @override
  State createState() => NotificationState();
}

class NotificationState extends State<NotificationList> {
  List<FileData> _syncedFiles = List.empty(growable: true);
  ScrollController _scrollControl = ScrollController();

  @override
  void initState() {
    super.initState();
    FileRecords.file.retrieveAllSynced().then((_syncedFiles) {
      setState(() {
        this._syncedFiles = _syncedFiles;
        try {
          _scrollControl.jumpTo(700);
        } catch (e) {}
      });
    });
    SyncController.onSyncFinish.add(onAddedSyncedFile);
  }

  @override
  void dispose() {
    super.dispose();
    SyncController.onSyncFinish.remove(onAddedSyncedFile);
  }

  void onAddedSyncedFile(dynamic args) {
    var success = args[1];
    if (success) {
      var fileData = args[0].data;
      var searchResult = _syncedFiles.indexWhere(
          (element) => element.relativePath == fileData.relativePath);
      if (searchResult >= 0) _syncedFiles.removeAt(searchResult);
      setState(() => _syncedFiles.add(fileData));
    }
  }

  Widget buildItem(BuildContext context, int index) {
    return FileDataView(_syncedFiles[index]);
  }

  @override
  Widget build(BuildContext context) {
    if (_syncedFiles.isEmpty) {
      var style = Theme.of(context)
          .textTheme
          .bodyText2
          .merge(TextStyle(color: Colors.grey));
      return Center(
        child: Text("EMPTY", style: style),
      );
    }
    return Scrollbar(
        isAlwaysShown: true,
        controller: _scrollControl,
        child: ListView.separated(
          controller: _scrollControl,
          itemBuilder: buildItem,
          addAutomaticKeepAlives: false,
          itemCount: _syncedFiles.length,
          separatorBuilder: (context, index) =>
              Divider(height: 1, thickness: 1),
        ));
  }
}
