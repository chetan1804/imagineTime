import 'package:flutter/material.dart';
import 'package:imagine_drive/file_sync/firmData.dart';
import 'package:imagine_drive/file_sync/localFileDirectory.dart';
import 'package:imagine_drive/file_sync/remoteFileDirectory.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/file_sync/userPreferences.dart';
import 'package:imagine_drive/handlers/socket.dart';
import 'package:imagine_drive/pages/views/bottomBar.dart';
import 'package:imagine_drive/file_sync/fileSelect/firmSelect.dart';
import 'package:imagine_drive/utils/constants.dart';

import 'views/sync_selection/firmToggle.dart';

class SyncSelectionPage extends StatefulWidget {
  final bool setup;
  final List<FirmSelect> firms;
  final bool resync; // true if this will first before rendering anything

  /// @setup: true if this for setup page
  SyncSelectionPage({this.setup = false, this.firms, this.resync = true});
  @override
  State createState() => FirmSelectionState();
}

class FirmSelectionState extends State<SyncSelectionPage> {
  List<FirmSelect> firms = [];
  bool _loading = true;
  bool _errorMsg = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.firms == null) loadFirms();
  }

  Future loadFirms() async {
    if (!_loading) {
      setState(() {
        _loading = true;
        _errorMsg = false;
      });
    }
    if (this.widget.resync) {
      await RemoteFileDirectory.updateStart();
    }
    try {
      FirmSelect.retrieveAll().then((_firms) async {
        firms = _firms;
        setState(() {
          if (this.mounted) _loading = false;
        });
      }).onError((error, stackTrace) {
        print(error);
        print(stackTrace);
        setState(() {
          if (this.mounted) {
            _loading = false;
            _errorMsg = true;
          }
        });
      });
    } catch (error, stackTrace) {
      print(error);
      print(stackTrace);
      setState(() {
        _loading = false;
        _errorMsg = true;
      });
    }
    if (this.widget.resync) RemoteFileDirectory.updateEnd();
  }

  // callback when firm was applied
  void onApplied() async {
    setState(() => _saving = true);
    try {
      await FirmSelect.saveAll(firms);

      // clear queue
      if (SyncController.mounted)
        SyncController.stopAllFileSync(permanentlyRemove: false);

      // apply changes
      Navigator.of(context).pop([]);
      setState(() => _saving = false);
      if (!widget.setup) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Saved!')));
      }
      //RemoteFileDirectory.resetLastUpDate();
      // we  need to sync immediately if connected to remote
      if (Socket.connected.value) {
        await SyncController.sync();
      }
    } catch (e, stack) {
      print(e);
      print(stack);
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Remote issue. Try again later.')));
      setState(() => _saving = false);
    }
  }

  // callback when a child was toggled
  void onChildToggled(FirmSelect firmSelect, bool toggled) {
    if (!toggled) return;
    setState(() {
      firmSelect.isOn = true;
    });
  }

  Widget buildLoadPrompt() {
    return Container(
      child: Center(
        child: !_errorMsg
            ?
            // loading
            Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Padding(
                  padding: EdgeInsets.all(20),
                  child: Text("Please wait while we sync..."),
                ),
                CircularProgressIndicator()
              ])
            :
            // error
            ElevatedButton(
                onPressed: loadFirms,
                child: Icon(Icons.refresh),
              ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Selective Sync'),
        automaticallyImplyLeading: !widget.setup,
      ),
      body: !_loading && !_errorMsg
          ? SingleChildScrollView(
              child: Container(
                child: ExpansionPanelList(
                  expansionCallback: (index, isOpen) => firms[index]
                      .setExpanded(!isOpen)
                      .then((value) => setState(() => {})),
                  children: firms
                      .map<ExpansionPanel>((firm) => ExpansionPanel(
                          headerBuilder: (context, isOpen) => ListTile(
                              title: Text(firm.name),
                              leading: Checkbox(
                                visualDensity: VisualDensity.compact,
                                value: firm.isOn,
                                onChanged: (toggled) => setState(
                                    () => firm.recursiveToggle(toggled)),
                              )),
                          body: FirmToggle(firm, onChildToggled),
                          isExpanded: firm.expanded))
                      .toList(growable: false),
                ),
              ),
            )
          : buildLoadPrompt(),
      bottomNavigationBar: BottomBar(
        Text('Apply'),
        onPressed: !_saving && !_errorMsg && !_loading ? onApplied : null,
      ),
    );
  }
}
