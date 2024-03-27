import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:imagine_drive/utils/log.dart';

class LogData {
  String tag;
  String message;
  String type;
  LogData({this.tag, this.message, this.type});
  static LogData fromString(String log) {
    var startLogTypeIndex = log.indexOf('type=');
    var startTagIndex = log.indexOf('tag=');
    var startMsgIndex = log.indexOf('message=');
    if (startLogTypeIndex < 0 || startTagIndex < 0 || startMsgIndex < 0)
      return null;
    var type = log
        .substring(startLogTypeIndex, log.indexOf(',', startLogTypeIndex))
        .split('=')[1]
        .split('.')[1];
    var tag = log
        .substring(startTagIndex, log.indexOf(',', startTagIndex))
        .split('=')[1];
    var message = log.substring(startMsgIndex).split('=')[1];
    return LogData(tag: tag, type: type, message: message);
  }

  Icon get icon {
    switch (type) {
      case 'VERBOSE':
        return Icon(Icons.add, size: 13, color: Colors.grey);
      case 'WARNING':
        return Icon(Icons.warning, size: 13, color: Colors.yellow);
      case 'ERROR':
        return Icon(Icons.bug_report_outlined, size: 13, color: Colors.red);
      case 'INFO':
        return Icon(Icons.info, size: 13, color: Colors.blue);
      default:
    }
  }

  Color get color {
    if (type != 'ERROR')
      return Colors.black;
    else
      return Colors.red;
  }
}

class LogPage extends StatefulWidget {
  @override
  State<StatefulWidget> createState() => LogPageState();
}

class LogPageState extends State<LogPage> {
  List<LogData> _logs = List.empty(growable: true);

  @override
  void initState() {
    super.initState();
    Log.onRecievedLog.add(onRecievedLog);
    loadAllLogs();
  }

  @override
  void dispose() {
    super.dispose();
    Log.onRecievedLog.remove(onRecievedLog);
    _logs = null;
  }

  // use to load all logs from file
  void loadAllLogs() async {
    var logs = await Log.readAllLog();
    if (logs == null) return;
    for (var log in logs) {
      var logData = LogData.fromString(log);
      if (logData != null) _logs.add(logData);
    }
    setState(() {});
  }

  // callback when recieved log
  void onRecievedLog(String log) {
    var logData = LogData.fromString(log);
    if (logData != null) {
      setState(() => _logs.add(logData));
    }
  }

  void displayFilter() {}

  void openLogfile() {
    Log.openTextEditor();
  }

  void logErase() {
    Log.clear();
    setState(() {
      _logs.clear();
    });
  }

  Widget buildLogs() {
    List<TextSpan> _textSpanList = List.empty(growable: true);
    for (var log in _logs) {
      _textSpanList.add(TextSpan(children: [
        WidgetSpan(child: log.icon),
        TextSpan(
            text: log.tag.padRight(22),
            style:
                TextStyle(fontWeight: FontWeight.bold, color: Colors.blueGrey)),
        TextSpan(text: log.message + '\n', style: TextStyle(color: log.color))
      ]));
    }
    return Scrollbar(
        isAlwaysShown: true,
        child: SingleChildScrollView(
            child: Padding(
          padding: EdgeInsets.all(10),
          child: RichText(text: TextSpan(children: _textSpanList)),
        )));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Logs'),
        actions: [
          IconButton(icon: Icon(Icons.delete_outline), onPressed: logErase),
          IconButton(icon: Icon(Icons.file_present), onPressed: openLogfile),
          IconButton(
              icon: Icon(Icons.filter_alt_outlined), onPressed: displayFilter),
        ],
      ),
      body: buildLogs(),
    );
  }
}
