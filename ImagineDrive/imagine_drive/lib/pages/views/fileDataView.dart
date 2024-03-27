import 'package:file_icon/file_icon.dart';
import 'package:flutter/material.dart';
import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/file_sync/remoteFileDirectory.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:flutter_slidable/flutter_slidable.dart';

// widget that display the file list item
class FileDataView extends StatefulWidget {
  final FileData fileData;
  FileDataView(this.fileData);
  @override
  State<StatefulWidget> createState() => FileDataViewState();
}

class FileDataViewState extends State<FileDataView> {
  // String _clientName = '';
  String _parentRelativePath = '';

  @override
  void initState() {
    super.initState();
    // widget.fileData.clientName.then((value) {
    //   if (!mounted) return;
    //   setState(() => _clientName = value);
    // });
    _parentRelativePath = widget.fileData.relativeParentPath;
  }

  void onPressed(BuildContext con) {
    if (widget.fileData.status != 'visible') return;
    var path = SyncController.driveLetter;
    path += '\\' + widget.fileData.relativePath;
    FileSyncUtil.openFileExplorer(path);
  }

  void viewOnExplorer(BuildContext con) async {
    if (widget.fileData.status != 'visible') return;
    var path = SyncController.driveLetter;
    path += '\\' + _parentRelativePath;
    FileSyncUtil.openFileExplorer(path);
  }

  void getShareLink(BuildContext con) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text('Copying link...')));
    RemoteFileDirectory.retrieveShareLink(uri: widget.fileData.relativePath)
        .then((value) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Link Copied!'),
        backgroundColor: Colors.green[500],
      ));
    }).onError((e, s) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Failed copying link, try again later!'),
          backgroundColor: Colors.red[500]));
    });
  }

  @override
  Widget build(BuildContext context) {
    var theme = Theme.of(context);
    Icon icon = Icon(Icons.check_circle_rounded, color: Colors.green, size: 14);
    switch (widget.fileData.status) {
      case 'deleted':
      case 'archived':
        icon = Icon(Icons.delete_forever_rounded,
            color: Colors.red[700], size: 18);
        break;
      case 'failed':
        icon = Icon(Icons.explicit, color: Colors.yellow, size: 18);
        break;
      default:
    }

    return Slidable(
      key: Key(widget.fileData.relativePath),
      endActionPane:
          ActionPane(motion: const ScrollMotion(), extentRatio: 0.6, children: [
        SlidableAction(
          label: 'View',
          backgroundColor: Colors.green[300],
          icon: Icons.remove_red_eye_outlined,
          foregroundColor: Colors.white,
          autoClose: true,
          onPressed: onPressed,
        ),
        SlidableAction(
          label: 'Explorer',
          backgroundColor: Colors.green[500],
          icon: Icons.folder_open_sharp,
          foregroundColor: Colors.white,
          autoClose: true,
          onPressed: viewOnExplorer,
        ),
        SlidableAction(
          label: 'Get Link',
          backgroundColor: Colors.green[700],
          icon: Icons.link_outlined,
          foregroundColor: Colors.white,
          autoClose: true,
          onPressed: getShareLink,
        )
      ]),
      enabled: widget.fileData.status == 'visible',
      child: ListTile(
        dense: true,
        leading: Stack(
          children: [
            !widget.fileData.isDirectory
                ? FileIcon(widget.fileData.fileName, size: 40)
                : Icon(Icons.folder),
            icon,
          ],
          alignment: AlignmentDirectional.bottomStart,
        ),
        title: Text(widget.fileData.fileName),
        subtitle: Text(_parentRelativePath),
        trailing: Text(
          FileSyncUtil.displayableDate(widget.fileData.updateAt),
          style: theme.textTheme.caption,
        ),
        onTap:
            widget.fileData.status == 'visible' ? () => onPressed(null) : null,
      ),
    );
  }
}
