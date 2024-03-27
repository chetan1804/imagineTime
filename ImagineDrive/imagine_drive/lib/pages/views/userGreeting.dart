import 'package:flutter/material.dart';
import 'package:imagine_drive/file_sync/userData.dart';

/*
  profilePreview.dart
  This widget displays greetings to specific user.
 */
class UserGreeting extends StatelessWidget {
  final UserData data;
  UserGreeting(this.data);

  @override
  Widget build(BuildContext context) {
    var style = Theme.of(context).textTheme.headline6;
    return ListTile(
        title: Text('Hello ' + data.firstname, style: style),
        subtitle: Text(data.username),
        leading: CircleAvatar(child: Text(data.initials)));
  }
}
