import 'package:flutter/material.dart';
import 'package:imagine_drive/file_sync/fileSelect/toggleGroup.dart';

class GroupStatusWidget extends StatelessWidget {
  final ToggleGroup group;
  final Function buildChild;
  GroupStatusWidget(this.group, {this.buildChild});
  @override
  Widget build(BuildContext context) {
    if (group.loadState == IDLE || group.isLoading) {
      return Center(child: CircularProgressIndicator());
    }
    if (group.loaded is List && group.loaded.isEmpty) {
      return ListTile(title: Center(child: Text("Empty")));
    }
    return buildChild();
  }
}
