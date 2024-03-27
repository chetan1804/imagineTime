import 'package:flutter/material.dart';
import 'package:imagine_drive/file_sync/fileSelect/fileToggle.dart';
import 'package:imagine_drive/file_sync/fileSelect/firmSelect.dart';
import 'package:imagine_drive/file_sync/fileSelect/toggleGroupFile.dart';
import 'package:imagine_drive/pages/views/sync_selection/groupStatusWidget.dart';

class FileGroupToggleWidget<U> extends StatefulWidget {
  final FileGroupToggle<U> data;
  final Function(FileGroupToggle, bool) onChangedValue;
  // contructor
  // @data - data to use for loading children
  // @onChangedValue - callback when a child file was changed
  FileGroupToggleWidget(this.data, this.onChangedValue);
  @override
  State<StatefulWidget> createState() => FileGroupToggleState();
}

class FileGroupToggleState extends State<FileGroupToggleWidget> {
  @override
  initState() {
    super.initState();
  }

  void onItemChanged(FileToggle item, bool pToggled) {
    setState(() {
      widget.onChangedValue(widget.data, pToggled);
      item.isOn = pToggled;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      child: GroupStatusWidget(widget.data,
          buildChild: () => Column(
                children: widget.data.loaded
                    .map((item) => ListTile(
                          title: Text(item.fileName),
                          trailing: Switch(
                              value: item.isOn,
                              onChanged: (toggled) =>
                                  onItemChanged(item, toggled)),
                        ))
                    .toList(),
              )),
    );
  }
}
