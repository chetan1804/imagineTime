import 'package:flutter/material.dart';
import 'package:imagine_drive/handlers/socket.dart';
import 'package:imagine_drive/pages/debugToolPage.dart';
import 'package:imagine_drive/pages/syncSelectionPage.dart';
import 'package:imagine_drive/pages/logPage.dart';
import 'package:imagine_drive/pages/mainPage.dart';
import 'package:imagine_drive/tests/testPage.dart';
import 'package:imagine_drive/utils/shiftRightFixer.dart';
import 'pages/changeDrivePage.dart';
import 'pages/loginPage.dart';

void main() async {
  runApp(ShiftRightFixer(
    child: MyApp(),
  ));
  Socket.connect();
}

class MyApp extends StatelessWidget {
  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        // This is the theme of your application.
        //
        // Try running your application with "flutter run". You'll see the
        // application has a blue toolbar. Then, without quitting the app, try
        // changing the primarySwatch below to Colors.green and then invoke
        // "hot reload" (press "r" in the console where you ran "flutter run",
        // or simply save your changes to "hot reload" in a Flutter IDE).
        // Notice that the counter didn't reset back to zero; the application
        // is not restarted.
        primarySwatch: Colors.blue,
      ),
      home: LoginPage(),
      routes: {
        '/setup1': (context) => SyncSelectionPage(setup: true),
        '/setup2': (context) => ChangeDrivePage(popPage: false),
        '/log': (context) => LogPage(),
        '/logout': (context) => LoginPage(),
        '/login': (context) => LoginPage(),
        '/home': (context) => MainPage(),
        '/debugTool': (context) => DebugToolPage(),
      },
    );
  }
}
