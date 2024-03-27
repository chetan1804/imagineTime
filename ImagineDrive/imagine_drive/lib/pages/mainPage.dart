import 'package:flutter/material.dart';
import 'package:getwidget/getwidget.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/handlers/authenticator.dart';
import 'package:imagine_drive/pages/views/connectionWidget.dart';
import 'package:imagine_drive/pages/views/fileNotificationBar.dart';
import 'package:imagine_drive/pages/views/notificationList.dart';
import 'package:imagine_drive/pages/views/utils.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/virtualDrive.dart';
import 'package:url_launcher/url_launcher.dart';

import 'views/mainDrawer.dart';

class MainPage extends StatefulWidget {
  @override
  State<StatefulWidget> createState() => MainPageState();
}

class MainPageState extends State<MainPage> {
  String _toast;

  @override
  void initState() {
    super.initState();
    Utils.toast.listen(_toastChanged);
  }

  @override
  void dispose() {
    super.dispose();
    Utils.toast.unlisten(_toastChanged);
  }

  void _toastChanged(String toast) async {
    setState(() {
      _toast = toast;
    });

    if (_toast == null || _toast == "") return;
    await Future.delayed(Duration(seconds: 10));
    if (_toast == toast) Utils.toast.value = null;
  }

  void folderButton() {
    VirtualDrive.openFileExplorer();
  }

  void webpageButton() {
    launch(IMAGINETIME_WEB);
  }

  void toggleDrawer(BuildContext context) {
    var thisScaffold = Scaffold.of(context);
    if (!thisScaffold.isDrawerOpen)
      thisScaffold.openDrawer();
    else
      thisScaffold.openEndDrawer();
  }

  Widget buildToast() {
    var showFloatingToast = _toast != null;
    return GFFloatingWidget(
        verticalPosition: MediaQuery.of(context).size.width * 0.5,
        horizontalPosition: MediaQuery.of(context).size.height * 0.02,
        showBlurness: showFloatingToast,
        blurnessColor: Colors.black54,
        child: showFloatingToast
            ? GFToast(
                backgroundColor: Colors.white,
                text: _toast,
                textStyle: const TextStyle(color: Colors.black87),
                button: GFButton(
                  onPressed: () {
                    setState(() {
                      _toast = null;
                    });
                  },
                  text: 'OK',
                  type: GFButtonType.transparent,
                  color: GFColors.SUCCESS,
                ),
                autoDismiss: false,
              )
            : Container());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: Builder(
            builder: (_context) => TextButton(
                onPressed: () => toggleDrawer(_context),
                child: CircleAvatar(
                  child: Text(Authenticator.currentUser.initials),
                ))),
        title: Text('Imagine Share' +
            (SyncController.mounted
                ? " (" + SyncController.driveLetter.toUpperCase() + ")"
                : "")),
        toolbarHeight: 70,
        actions: [
          IconButton(onPressed: folderButton, icon: Icon(Icons.folder)),
          IconButton(onPressed: webpageButton, icon: Icon(Icons.web))
        ],
      ),
      body: Stack(children: [
        Container(
            child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [ConnectionWidget(), Flexible(child: NotificationList())],
        )),
        buildToast()
      ]),
      backgroundColor: Colors.grey[200],
      drawer: MainDrawer(),
      bottomNavigationBar: FileNotificationBar(),
    );
  }
}
