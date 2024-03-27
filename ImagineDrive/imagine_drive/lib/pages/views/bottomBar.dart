import 'package:flutter/material.dart';

class BottomBar extends StatelessWidget {
  final Function onPressed;
  final Widget caption;
  final bool enableOk;
  BottomBar(this.caption, {this.onPressed, this.enableOk = true});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 70,
      color: Colors.transparent,
      child: Column(
        children: [
          Divider(thickness: 1, height: 1),
          Padding(
              padding: EdgeInsets.all(20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  TextButton(
                      onPressed: this.enableOk ? onPressed : null,
                      child: caption)
                ],
              ))
        ],
      ),
    );
  }
}
