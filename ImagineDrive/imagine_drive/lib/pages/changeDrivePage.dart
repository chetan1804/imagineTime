import 'dart:io';

import 'package:flutter/material.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/pages/views/bottomBar.dart';

class ChangeDrivePage extends StatefulWidget {
  final bool popPage;
  ChangeDrivePage({this.popPage = true});
  @override
  State createState() => ChangeDriveState();
}

class ChangeDriveState extends State<ChangeDrivePage> {
  String _currentValue;
  List<String> _items = List.empty(growable: true); //List.empty();
  bool isDirty = false;

  @override
  void initState() {
    super.initState();
    initDrives();
  }

  void initDrives() async {
    if (SyncController.mounted) _items.add(SyncController.driveLetter);
    _items.addAll(await FileSyncUtil.getAvailableDrives());
    if (mounted) {
      setState(() {
        _currentValue = _items[0];
        isDirty = _currentValue != SyncController.driveLetter;
      });
    }
  }

  // drive letter was changed
  void onChanged(String pVal) {
    setState(() {
      _currentValue = pVal;
      isDirty = _currentValue != SyncController.driveLetter;
    });
  }

  void onApply() async {
    setState(() {
      isDirty = false;
    });

    await SyncController.setMountPath(driveLetter: _currentValue);
    if (SyncController.autoSync) SyncController.sync();
    Navigator.of(this.context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: widget.popPage,
        title: Text('Change Drive Letter'),
      ),
      body: Container(
          alignment: Alignment.center,
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('Select Drive'),
            Padding(
              padding: EdgeInsets.all(20),
              child: DropdownButton<String>(
                  isDense: true,
                  value: _currentValue,
                  onChanged: onChanged,
                  selectedItemBuilder: (_context) => _items
                      .map((_item) => Text(_item))
                      .toList(growable: false),
                  items: _items
                      .map((_item) => DropdownMenuItem(
                            child: Text(_item),
                            value: _item,
                          ))
                      .toList(growable: false)),
            )
          ])),
      bottomNavigationBar: BottomBar(
        Text('Apply'),
        onPressed: onApply,
        enableOk: isDirty,
      ),
    );
  }
}
