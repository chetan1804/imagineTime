import 'package:flutter/material.dart';
import 'package:file_icon/file_icon.dart';
import 'package:imagine_drive/file_sync/fileSync.dart';

class FileActivityView extends StatefulWidget {
  final FileSync fileSync;
  FileActivityView(this.fileSync);
  @override
  State createState() => FileNotificationViewState();
}

class FileNotificationViewState extends State<FileActivityView> {
  double _progress;
  String _name;
  String _parentRelativePath;

  @override
  void initState() {
    super.initState();
    widget.fileSync.onProgress.add(onProgress);
    _name = widget.fileSync.data.fileName;
    if (_name.length > 30) _name = _name.substring(0, 27) + '...';
    _parentRelativePath = widget.fileSync.data.relativeParentPath;
  }

  void onProgress(double progress) {
    if (mounted)
      setState(() => _progress = progress);
    else
      widget.fileSync.onProgress.remove(onProgress);
  }

  // display for current file operation progress
  Widget buildProgress() {
    if (_progress == null || _progress < 0) _progress = 0;
    return Padding(
        padding: EdgeInsets.only(right: 50),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
                padding: EdgeInsets.only(
                  top: 3,
                  bottom: 5,
                ),
                child: Text(_parentRelativePath)),
            LinearProgressIndicator(value: _progress)
          ],
        ));
  }

  @override
  Widget build(BuildContext context) {
    var title = _name;
    Widget subTitleWidget;
    switch (widget.fileSync.status.value) {
      case eSyncState.Redownload:
      case eSyncState.Downloading:
        title = 'Downloading ' + title;
        subTitleWidget = buildProgress();
        break;
      case eSyncState.Reupload:
      case eSyncState.Uploading:
        title = 'Uploading ' + title;
        subTitleWidget = buildProgress();
        break;
      case eSyncState.Synced:
        subTitleWidget = Text('Sync success!');
        break;
      default:
    }
    return ListTile(
      dense: true,
      title: Text(title),
      subtitle: subTitleWidget,
      leading: FileIcon(widget.fileSync.data.fileName, size: 50),
    );
  }
}
