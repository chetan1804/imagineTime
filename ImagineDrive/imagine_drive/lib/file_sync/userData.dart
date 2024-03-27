import 'package:jwt_decoder/jwt_decoder.dart';

class UserData {
  String firstname;
  String lastname;
  String username;
  int userid;
  UserData({this.firstname, this.lastname, this.username, this.userid});

  String get initials {
    return (firstname[0] + lastname[0]).toUpperCase();
  }

  static UserData fromJson(Map<String, dynamic> json) {
    return UserData(
        firstname: json["firstname"],
        lastname: json["lastname"],
        userid: json["userid"],
        username: json["username"]);
  }

  static UserData fromJWT(dynamic token) {
    try {
      var decoded = JwtDecoder.decode(token);
      return fromJson(decoded);
    } catch (e) {
      return null;
    }
  }
}
