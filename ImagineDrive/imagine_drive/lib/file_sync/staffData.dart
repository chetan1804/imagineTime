import 'package:imagine_drive/utils/constants.dart';

import 'firmData.dart';
import 'syncController.dart';

class StaffData {
  int id;
  int userid;
  String firstname;
  String lastname;
  int firm;
  DateTime updateAt;
  bool sync; // true if this staff will be sync or not

  StaffData(
      {this.id,
      this.userid,
      this.firstname,
      this.lastname,
      this.firm,
      this.updateAt});

  String get name {
    return firstname + " " + lastname;
  }

  static StaffData fromJson(Map<String, dynamic> json) {
    var updateAt = json['updateAt'];
    if (updateAt.runtimeType == double) updateAt = updateAt.toInt();
    return StaffData(
        id: json["id"],
        userid: json["userid"],
        firm: json["firm"],
        firstname: json["firstname"],
        lastname: json["lastname"],
        updateAt: DateTime.fromMillisecondsSinceEpoch(updateAt, isUtc: true));
  }

  Map<String, dynamic> toJson() {
    return {
      'id': this.id,
      'userid': this.userid,
      'firm': this.firm,
      'firstname': this.firstname,
      'lastname': this.lastname,
      'updateAt': updateAt.millisecondsSinceEpoch,
    };
  }

  static String getMirroredPath(FirmData firm, StaffData staff) {
    if (staff == null) {
      return SyncController.mirrorPathData + firm.name + '\\' + STAFF_DIR;
    }
    return SyncController.mirrorPathData +
        firm.name +
        '\\' +
        STAFF_DIR +
        '\\' +
        staff.firstname +
        " " +
        staff.lastname;
  }
}
