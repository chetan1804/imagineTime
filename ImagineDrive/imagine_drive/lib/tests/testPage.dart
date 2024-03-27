import 'dart:math';

import 'package:flutter/material.dart';
import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/file_sync/remoteFileDirectory.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/handlers/authenticator.dart';
import 'package:imagine_drive/handlers/socket.dart';
import 'package:imagine_drive/tests/testUtil.dart';
import 'package:imagine_drive/tests/uploadFailureTest.dart';
import 'package:imagine_drive/tests/uploadInterruptTest.dart';
import 'package:imagine_drive/tests/uploadTests.dart';
import 'package:imagine_drive/utils/constants.dart';

class TestPage extends StatefulWidget {
  @override
  State<StatefulWidget> createState() => TestPageState();
}

class TestPageState extends State<TestPage> {
  String loginErrorText;
  var driveLetterController =
      new TextEditingController(text: DEFAULT_MOUNT_DRIVE);
  var usernameController = TextEditingController(text: 'test');
  var passwordController = TextEditingController(text: 'pass');

  @override
  void initState() {
    super.initState();
    Socket.connected.listen((connected) => setState(() {}));
  }

  void randomizeDriveLetter() async {
    var letters = await FileSyncUtil.getAvailableDrives();
    var random = Random();
    var randomLetter = letters[random.nextInt(letters.length - 1)];
    driveLetterController.text = randomLetter;
  }

  void cancelOperations() {
    SyncController.stopAllFileSync();
  }

  void login() async {
    if (SyncController.mounted) return;
    var loginResult = await Authenticator.login(
        username: usernameController.text, password: passwordController.text);

    //var loginResult = await Authenticator.silentLogin();
    // success fully signed in
    if (loginResult == eAccountState.SIGNED_IN_VERIFIED) {
      await SyncController.initializeForUser(
          userId: Authenticator.userId,
          driveLetter: driveLetterController.text);
      await SyncController.sync();
      setState(() {});
    } else {
      setState(() {
        if (loginResult == eAccountState.NOT_EXIST) {
          loginErrorText = 'Invalid account';
        } else {
          loginErrorText = 'Network issue, try again.';
        }
      });
    }
  }

  void onSignout() async {
    Authenticator.logout();
    await SyncController.uninitialize();
    setState(() {});
  }

  void uploadFile(String filename) {
    TestUtil.uploadFile(filename);
  }

  void onTestServer() async {
    //SyncController.setMountPath(TEST_MIRROR_DIR);
  }

  void toggleConnection() {
    if (Socket.connected.value)
      Socket.disconnect();
    else
      Socket.reconnect();
  }

  Widget buildNotMounted() {
    return Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      SizedBox.fromSize(
          size: Size(200, 50),
          child: TextField(
            controller: usernameController,
            decoration: InputDecoration(
                labelText: 'User Name', errorText: loginErrorText),
          )),
      SizedBox.fromSize(
          size: Size(200, 50),
          child: TextField(
            controller: passwordController,
            decoration: InputDecoration(
              labelText: 'Password',
            ),
          )),
      SizedBox.fromSize(
          size: Size(200, 50),
          child: TextField(
            controller: driveLetterController,
            decoration: InputDecoration(
              labelText: 'drive letter',
            ),
          )),
      TextButton(onPressed: randomizeDriveLetter, child: Text('Random Drive')),
      Padding(
        padding: EdgeInsets.all(20),
        child: TextButton(onPressed: login, child: Text("Login")),
      ),
    ]);
  }

  Widget buildFileUtils() {
    return Column(
      children: <Widget>[
        Spacer(flex: 48),
        TextButton(onPressed: onSignout, child: Text('Sign out')),
        Text('File Utilities'),
        TextButton(onPressed: SyncController.sync, child: Text("Sync")),
        TextButton(
            onPressed: () => uploadFile('small\\file1.pdf'),
            child: Text("Upload Small")),
        TextButton(
            onPressed: () => uploadFile('medium\\file1.pdf'),
            child: Text("Upload Medium")),
        TextButton(
            onPressed: () => uploadFile('large\\file1.jpg'),
            child: Text("Upload Large")),
        TextButton(
            onPressed: cancelOperations, child: Text('Cancel Operations')),
        TextButton(
            onPressed: TestUtil.clearAllClient, child: Text('Delete Files')),
        TextButton(
            onPressed: FileRecords.deleteAllRecords,
            child: Text('Delete Records')),
        TextButton(onPressed: TestUtil.resetFiles, child: Text('Reset')),
        Spacer(flex: 57),
      ],
    );
  }

  Widget buildUploadTests() {
    return Column(
      children: [
        Spacer(),
        Text('Upload Tests'),
        TextButton(onPressed: UploadTests.smallFile, child: Text('Small File')),
        TextButton(
            onPressed: UploadTests.mediumFile, child: Text('Medium File')),
        TextButton(onPressed: UploadTests.largeFile, child: Text('Large File')),
        TextButton(
            onPressed: UploadTests.smallFiles,
            child: Text('Multi Small Files')),
        TextButton(
            onPressed: UploadTests.mediumFiles,
            child: Text('Multi Medium Files')),
        TextButton(
            onPressed: UploadTests.largeFiles,
            child: Text('Multi Large Files')),
        TextButton(
            onPressed: UploadInterruptTest.run,
            child: Text('Upload Interrupt')),
        TextButton(
          onPressed: UploadFailureTest.run,
          child: Text('Upload Failure'),
        ),
        TextButton(
            onPressed: () async {
              await UploadTests.testAll();
              await UploadInterruptTest.run();
              await UploadFailureTest.run();
            },
            child: Text('Test All')),
        Spacer()
      ],
    );
  }

  Widget buildMounted() {
    return Row(
      children: [
        Spacer(),
        buildFileUtils(),
        buildUploadTests(),
        Column(children: [
          Spacer(),
          Text('Network Utilities'),
          TextButton(
              onPressed: toggleConnection,
              child: Text(Socket.connected.value ? 'Disconnect' : 'Connect')),
          TextButton(
              onPressed: RemoteFileDirectory.reset,
              child: Text('Clear Server')),
          Spacer()
        ]),
        Spacer()
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    var widget = SyncController.mounted ? buildMounted() : buildNotMounted();
    return Scaffold(
        backgroundColor: Colors.white,
        body: Container(
            decoration: BoxDecoration(color: Colors.white),
            child: Center(
              child: widget,
            )));
  }
}
