import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:process_run/shell.dart';
import 'package:flutter/services.dart';

class IconOverlayHandler {
  static Future register() async {
    var batCommand =
        'iconOverlayInit.bat'; //await rootBundle.loadString("assets/iconOverlayInit.reg");
    if (!await File.fromUri(Uri.file('iconOverlayInit.bat')).exists()) {
      //batCommand = 'SET DEBUG=\"\"\n' + batCommand;
      batCommand = "build\\windows\\runner\\Debug\\iconOverlayInit.bat";
    }
    var response =
        await Shell(throwOnError: false, runInShell: false).run(batCommand);
    //var response = await Process.run(batCommand, []);
    print(response);
  }

  static Future unregister() async {
    var batCommand =
        await rootBundle.loadString("assets/iconOverlayUninit.reg");
    var response = await Process.run(batCommand, []);
    print(response.stdout);
  }
}
