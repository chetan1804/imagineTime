// this class represents client
class ClientData {
  int id;
  String name;
  int firm;
  DateTime updateAt;

  ClientData({this.id, this.name, this.firm, this.updateAt});

  static ClientData fromJson(Map json) {
    DateTime updateA;
    if (json.containsKey('updateAt')) {
      var updateAt = json['updateAt'];
      if (updateAt.runtimeType == double) updateAt = updateAt.toInt() + 1;
      updateA = DateTime.fromMillisecondsSinceEpoch(
        updateAt,
        isUtc: true,
      );
    }
    return ClientData(
        id: json['id'],
        name: json['name'],
        firm: json['firm'],
        updateAt: updateA);
  }

  Map<String, Object> toJson() {
    return {
      'id': this.id,
      'name': this.name,
      'firm': firm,
      'updateAt': updateAt.millisecondsSinceEpoch
    };
  }
}
