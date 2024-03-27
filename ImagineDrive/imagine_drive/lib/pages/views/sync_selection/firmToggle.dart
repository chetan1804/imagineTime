import 'package:flutter/material.dart';
import 'package:getwidget/getwidget.dart';
import 'package:imagine_drive/file_sync/fileSelect/firmSelect.dart';
import 'package:imagine_drive/file_sync/fileSelect/toggleGroup.dart';
import 'package:imagine_drive/file_sync/fileSelect/toggleGroupFile.dart';
import 'package:imagine_drive/pages/views/sync_selection/fileGroupToggleWidget.dart';
import 'package:imagine_drive/pages/views/sync_selection/groupStatusWidget.dart';

const double PADDING = 30;

class FirmToggle extends StatefulWidget {
  final FirmSelect data;
  final Function(FirmSelect, bool) onChangedFirm;

  /// contructor
  /// @data - the needed data to process child
  /// @onChangedFirm - the value when child of firm was changed
  FirmToggle(this.data, this.onChangedFirm);
  @override
  State<StatefulWidget> createState() => FirmToggleState();
}

class FirmToggleState extends State<FirmToggle> {
  @override
  initState() {
    super.initState();
  }

  // use to render sub directories
  Widget buildSubDir(ToggleGroup<List<FileGroupToggle>, dynamic> group) {
    return GroupStatusWidget(
      group,
      buildChild: () => Padding(
          padding: EdgeInsets.fromLTRB(PADDING, 0, 0, 0),
          child: GroupStatusWidget(widget.data,
              buildChild: () => ExpansionPanelList(
                  elevation: 0,
                  // refresh when expand value changes
                  expansionCallback: (index, isOpen) => group.loaded[index]
                      .setExpanded(!isOpen)
                      .then((value) => setState(() => {})),
                  children: group.loaded
                      .map((item) => getExpansionPanel(group, item,
                          body: Padding(
                              padding: EdgeInsets.fromLTRB(PADDING, 0, 0, 0),
                              child: FileGroupToggleWidget(
                                item,
                                (fileGroup, toggled) =>
                                    onGroupToggled(group, fileGroup, toggled),
                              ))))
                      .toList()))),
    );
  }

  /// client/general/staffs was toggled
  void onGroupToggled(ToggleGroup parentGroup, ToggleGroup group, bool toggle) {
    if (group.isOn == toggle) return;
    setState(() {
      if (toggle) {
        parentGroup.isOn = true;
        group.isOn = true;
      }
      widget.onChangedFirm(widget.data, toggle);
    });
  }

  // toggle group including its clildren, it also updates parent
  void onGroupToggledAll(
      ToggleGroup parentGroup, ToggleGroup group, bool toggle) {
    if (group.isOn == toggle) return;
    setState(() {
      if (toggle) parentGroup.isOn = true;
      group.recursiveToggle(toggle);
      widget.onChangedFirm(widget.data, toggle);
    });
  }

  ExpansionPanel getExpansionPanel(ToggleGroup parentGroup, ToggleGroup group,
      {Widget body}) {
    return ExpansionPanel(
        headerBuilder: (context, isOpen) => ListTile(
            title: Text(group.name),
            leading: Checkbox(
              value: group.isOn,
              onChanged: (toggled) => setState(
                  () => onGroupToggledAll(parentGroup, group, toggled)),
            )),
        body: body,
        isExpanded: group.expanded);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
        padding: EdgeInsets.fromLTRB(PADDING, 0, 0, 0),
        child: GroupStatusWidget(widget.data,
            buildChild: () => ExpansionPanelList(
                    elevation: 0,
                    // refresh when expand value changes
                    expansionCallback: (index, isOpen) => widget
                            .data.groups[index]
                            .setExpanded(!isOpen)
                            .then((value) {
                          if (mounted) setState(() => {});
                        }),
                    children: [
                      // render general
                      getExpansionPanel(widget.data, widget.data.general,
                          body: FileGroupToggleWidget(
                              widget.data.general,
                              (group, toggled) =>
                                  onGroupToggled(widget.data, group, toggled))),
                      // render clients
                      getExpansionPanel(widget.data, widget.data.clients,
                          body: buildSubDir(widget.data.clients)),
                      // render staff
                      getExpansionPanel(widget.data, widget.data.staffs,
                          body: buildSubDir(widget.data.staffs)),
                    ])));
  }
}
