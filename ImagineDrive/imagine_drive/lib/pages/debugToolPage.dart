import 'package:flutter/material.dart';
import 'package:imagine_drive/file_sync/fileRecords.dart';

// Page that displays tools for debugging purposes
class DebugToolPage extends StatefulWidget {
  @override
  State<StatefulWidget> createState() => DebugToolState();
}

class DebugToolState extends State<DebugToolPage> {
  int currentPage = 0;
  TextEditingController txtQueryCon = new TextEditingController();
  TextEditingController txtFileSCon = new TextEditingController();
  List<Map<String, Object>> searchResult = List.empty(growable: false);
  String error = "";

  void onSelectItem(int index) {
    setState(() => currentPage = index);
  }

  Future onFileSearchTxtChanged(String newStr) async {
    if (newStr.length < 3) return;
    var res = await FileRecords.database.rawQuery(
        "select sync.*,selection.ison from sync outer left join selection on sync.uri=selection.uri where instr(sync.uri, ?)",
        [newStr]);
    setState(() {
      searchResult = res;
    });
  }

  Future onQueryPressed() async {
    setState(() {
      error = "";
      searchResult = List.empty();
    });

    try {
      var res = await FileRecords.database.rawQuery(txtQueryCon.text, []);
      setState(() {
        searchResult = res;
      });
    } catch (e) {
      print(e);
      setState(() {
        error = e.toString();
      });
    }
  }

  Widget buildQueryRes() {
    return Column(
      children: searchResult
          .map((item) => Card(
                child: Padding(
                    padding: EdgeInsets.all(8), child: Text(item.toString())),
              ))
          .toList(),
    );
  }

  Widget buildBody() {
    switch (currentPage) {
      case 0:
        return Container(
          padding: EdgeInsets.all(8),
          child: Column(
            children: [
              TextField(
                controller: txtFileSCon,
                onChanged: onFileSearchTxtChanged,
                decoration: InputDecoration(hintText: "file keyword"),
              ),
              buildQueryRes()
            ],
          ),
        );
      case 1:
        return Container(
            padding: EdgeInsets.all(8),
            child: Column(
              children: [
                TextField(
                  controller: txtQueryCon,
                  decoration: InputDecoration(hintText: "select * from table"),
                ),
                TextButton(onPressed: onQueryPressed, child: Text("Query")),
                error.isEmpty
                    ? Container()
                    : Text(
                        error,
                        style: TextStyle(color: Colors.red),
                      ),
                buildQueryRes()
              ],
            ));
      default:
        return Container();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Debug tools"),
      ),
      body: buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentPage,
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.search),
            label: "Search",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.query_builder),
            label: "Query tool",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.info),
            label: "Info",
          )
        ],
        onTap: onSelectItem,
      ),
    );
  }
}
