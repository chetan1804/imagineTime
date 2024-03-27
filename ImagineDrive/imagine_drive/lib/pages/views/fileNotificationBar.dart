import 'package:flutter/material.dart';
import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/pages/views/fileActivityView.dart';

class FileNotificationBar extends StatefulWidget {
  @override
  State createState() => FileNotificationBarState();
}

class FileNotificationBarState extends State<FileNotificationBar> {
  FileSync _activeSync;

  @override
  void initState() {
    super.initState();
    for (var item in SyncController.queue.activeSync) {
      if (item.status.value != eSyncState.DeleteLocal &&
          item.status.value != eSyncState.DeleteRemote &&
          item.status.value != eSyncState.Synced) {
        onAddedSync(item);
        break;
      }
    }
    SyncController.queue.onAddedActive.add(onAddedSync);
    //SyncController.onSync = onSync;
  }

  @override
  void dispose() {
    super.dispose();
    SyncController.queue.onAddedActive.remove(onAddedSync);
  }

  // callback when started  syncing
  void onSync(_) {
    setState(() {});
  }

  void onAddedSync(FileSync file) {
    // we dont need this
    if (file != null) {
      if (file.status.value == eSyncState.DeleteLocal ||
          file.status.value == eSyncState.DeleteRemote ||
          file.status.value == eSyncState.Synced) {
        if (file == _activeSync) setState(() => _activeSync = null);
        return;
      }
    }
    if (_activeSync != null && _activeSync.running) return;
    setState(() {
      _activeSync = file;
      _activeSync.onClosed.add((_) {
        setState(() => _activeSync = null);
      });
      _activeSync.status.listen((_status) {
        if (_status == eSyncState.DeleteLocal ||
            _status == eSyncState.DeleteRemote)
          setState(() => _activeSync = null);
      });
    });
  }

  Widget buildUptoDate() {
    var theme = Theme.of(context);
    String title = 'Up to date!';
    var leading;
    // if (SyncController.queue.nextInLine != null || SyncController.isSyncing) {
    //   title = 'Syncing';
    //   leading = CircularProgressIndicator.adaptive();
    // } else {
    leading = Icon(Icons.check, color: Colors.green, size: 30);
    //}
    return ListTile(
      dense: true,
      leading: leading,
      title: Text(title, style: theme.textTheme.headline6),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 70,
      color: Colors.white70,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Divider(thickness: 1, height: 1),
          Spacer(),
          _activeSync != null ? FileActivityView(_activeSync) : buildUptoDate(),
          Spacer()
        ],
      ),
    );
  }
}
