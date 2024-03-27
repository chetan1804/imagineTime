import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/handlers/authenticator.dart';
import 'package:imagine_drive/pages/syncSelectionPage.dart';
import 'package:imagine_drive/pages/views/userGreeting.dart';
import 'package:imagine_drive/pages/views/utils.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:imagine_drive/utils/virtualDrive.dart';

import '../changeDrivePage.dart';

class MainDrawer extends StatefulWidget {
  @override
  State createState() => MainDrawerState();
}

class MainDrawerState extends State<MainDrawer> {
  @override
  void initState() {
    super.initState();
    if (Authenticator.currentUser == null) onSignout();
  }

  void onSignout() async {
    await SyncController.uninitialize();
    var success = await Authenticator.logout();
    if (success) {
      Navigator.pushNamed(context, '/logout');
    }
  }

  /// callback when the drive letter was apply
  void onChangeDrive() async {
    var applied = await Navigator.push(
        context, MaterialPageRoute(builder: (_context) => ChangeDrivePage()));
    if (applied != null) {
      VirtualDrive.openFileExplorer();
      Scaffold.of(context).openEndDrawer();
      Utils.toast.value =
          'Mount ' + VirtualDrive.driveLetter + ' to ' + ' success!';
    }
  }

  void openLog() {
    Scaffold.of(context).openEndDrawer();
    Navigator.pushNamed(context, '/log');
  }

  void onPressedSelectiveSync() async {
    Scaffold.of(context).openEndDrawer();
    var result = await Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_context) => SyncSelectionPage(
                  resync: false,
                )));
    // after applied. sync and reset the last update
    if (result != null) {
      if (SyncController.autoSync) SyncController.sync();
    }
  }

  void openDebugTool() {
    Scaffold.of(context).openEndDrawer();
    Navigator.pushNamed(context, '/debugTool');
  }

  @override
  Widget build(BuildContext context) {
    var theme = Theme.of(context);
    return Drawer(
        child: ListView(
      children: [
        Padding(
          padding: EdgeInsets.symmetric(vertical: 10),
          child: UserGreeting(Authenticator.currentUser),
        ),
        ListTile(
          leading: Icon(Icons.logout),
          title: Text('Logout'),
          onTap: onSignout,
        ),
        Divider(thickness: 1, height: 1),
        Padding(
            padding: EdgeInsets.all(16),
            child: Text('Settings', style: theme.textTheme.headline6)),
        ListTile(
            leading: Icon(Icons.drive_file_move_outline),
            title: Text('Change Drive Letter'),
            onTap: onChangeDrive),
        ListTile(
            leading: Icon(Icons.business_outlined),
            title: Text('Sync Selection'),
            onTap: onPressedSelectiveSync),
        ListTile(
          leading: Icon(Icons.folder_open_outlined),
          title: Text('Open Folder'),
          onTap: VirtualDrive.openFileExplorer,
        ),
        Log.enabled
            ? ListTile(
                leading: Icon(Icons.receipt_long_outlined),
                title: Text('Logs'),
                onTap: openLog,
              )
            : Container(),
        kReleaseMode
            ? Container()
            : ListTile(
                leading: Icon(Icons.bug_report_outlined),
                title: Text('Debug Tools'),
                onTap: openDebugTool,
              )
      ],
    ));
  }
}
