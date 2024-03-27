import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:imagine_drive/handlers/socket.dart';

class ConnectionWidget extends StatefulWidget {
  @override
  State createState() => ConnectionWidgetState();
}

class ConnectionWidgetState extends State<ConnectionWidget> {
  eConnectionStatus status;
  bool visible = true;
  @override
  void initState() {
    super.initState();
    onConnectionChanged(Socket.connectionStatus.value);
    Socket.connectionStatus.listen(onConnectionChanged);
  }

  @override
  void dispose() {
    super.dispose();
    Socket.connectionStatus.unlisten(onConnectionChanged);
  }

  void onConnectionChanged(eConnectionStatus status) async {
    var _visible = true;
    if (status == eConnectionStatus.CONNECTED) {
      await Future.delayed(Duration(seconds: 4));
      if (status == eConnectionStatus.CONNECTED) _visible = false;
    }
    setState(() {
      this.status = status;
      visible = _visible;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!visible) return Container();

    Color color = Colors.green[400];
    String label = 'Connected';
    switch (status) {
      case eConnectionStatus.CONNECTING:
        color = Colors.grey[500];
        label = 'Connecting';
        break;
      case eConnectionStatus.DISCONNECTED:
        color = Colors.red[400];
        label = 'Disconnected';
        break;
      default:
    }
    return Container(
      height: 30,
      color: color,
      child: Center(
        child: Text(label),
      ),
    );
  }
}
