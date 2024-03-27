import 'package:imagine_drive/file_sync/syncController.dart';

class FirmData {
  int id;
  String name;
  DateTime updateAt; // the last update of firm
  bool sync; // true if this firm will be sync or not

  FirmData({this.id, this.name, this.updateAt});

  static FirmData fromJson(Map json) {
    var updateAt = json['updateAt'];
    if (updateAt.runtimeType == double) updateAt = updateAt.toInt();
    return FirmData(
      id: json['id'],
      name: json['name'],
      updateAt: DateTime.fromMillisecondsSinceEpoch(updateAt, isUtc: true),
    );
  }

  Map<String, Object> toJson() {
    return {
      'id': this.id,
      'name': this.name,
      "updateAt": this.updateAt.millisecondsSinceEpoch
    };
  }

  String getPath() {
    return SyncController.mirrorPathData + name;
  }
}
