import 'package:flutter/material.dart';
import 'package:getwidget/getwidget.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/handlers/authenticator.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:url_launcher/url_launcher.dart';

class LoginPage extends StatefulWidget {
  @override
  State createState() => LoginPageState();
}

class LoginPageState extends State<LoginPage> {
  TextEditingController passwordController = new TextEditingController();
  TextEditingController usernameController = new TextEditingController();
  bool signingIn = false;
  String _errorMsg;
  bool _obscurePassword = true;
  bool _isLoginButtonEnabled = false;

  @override
  void initState() {
    super.initState();
    _silentLogin();
  }

  // automates login upon loading
  Future _silentLogin() async {
    if (!await Authenticator.hasCachedToken) return;
    setState(() {
      signingIn = true;
    });
    await Authenticator.silentLogin();
    _setup();
  }

  void onLogin() async {
    usernameController.text = usernameController.text.trim();
    passwordController.text = passwordController.text.trim();
    setState(() {
      _errorMsg = '';
      signingIn = true;
    });
    var loginResult = await Authenticator.login(
      username: usernameController.text,
      password: passwordController.text,
    );

    switch (loginResult) {
      case eAccountState.SIGNED_IN_VERIFIED:
        _setup();
        break;
      case eAccountState.NOT_EXIST:
        setState(() {
          _errorMsg = 'Username or password is incorrect.';
          signingIn = false;
        });
        break;
      default:
        setState(() {
          signingIn = false;
          _errorMsg = 'Connection issue please try again later.';
        });
    }
  }

  void openWebpage() async {
    //if (await canLaunch(IMAGINETIME_WEB)) {
    await launch(
      IMAGINETIME_WEB,
    );
    //}
  }

  /// to setup the mounting, initialize user and go to home
  void _setup() async {
    if (!SyncController.mounted) {
      try {
        await SyncController.initializeForUser(userId: Authenticator.userId);
        if (!SyncController.mounted) {
          await Navigator.pushNamed(this.context, '/setup1');
          await Navigator.pushNamed(this.context, '/setup2');
        }
        if (SyncController.autoSync) SyncController.sync();
        Navigator.pushNamed(this.context, '/home');
      } catch (e, stackTrace) {
        Log.write("Setup error " + e.toString() + ', ' + stackTrace.toString(),
            tag: 'LoginPage', type: eLogType.ERROR);
      }
    }
  }

  // callback when text field was changed
  void onTextFieldsChanged(String newValue) {
    if (_errorMsg != null) setState(() => _errorMsg = null);

    var isValid = passwordController.text.isNotEmpty &&
        usernameController.text.isNotEmpty;
    if (isValid != _isLoginButtonEnabled)
      setState(() => _isLoginButtonEnabled = isValid);
  }

  Widget buildFields() {
    var loginStyle = Theme.of(context).primaryTextTheme.subtitle1;
    return Column(children: [
      //username
      Padding(
          padding: EdgeInsets.symmetric(vertical: 5),
          child: TextField(
            controller: usernameController,
            onChanged: onTextFieldsChanged,
            decoration: InputDecoration(
              border:
                  OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              hintText: 'Username',
            ),
          )),
      // password
      Padding(
          padding: EdgeInsets.symmetric(vertical: 5),
          child: TextField(
              obscureText: _obscurePassword,
              controller: passwordController,
              onChanged: onTextFieldsChanged,
              decoration: InputDecoration(
                suffixIcon: TextButton(
                    onPressed: () => setState(() {
                          _obscurePassword = !_obscurePassword;
                        }),
                    child: Icon(_obscurePassword
                        ? Icons.remove_red_eye_outlined
                        : Icons.remove_red_eye_rounded)),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                hintText: 'Password',
              ))),
      Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: GFButton(
          onPressed: passwordController.text.isNotEmpty &&
                  usernameController.text.isNotEmpty
              ? onLogin
              : null,
          text: 'Login',
          textStyle: loginStyle,
          shape: GFButtonShape.pills,
          fullWidthButton: true,
          blockButton: true,
          size: GFSize.LARGE,
        ),
      )
    ]);
  }

  Widget buildPrompt() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text('Were currently signing you in...'),
        Padding(
            padding: EdgeInsets.all(20),
            child: CircularProgressIndicator.adaptive()),
      ],
    );
  }

  Widget buildErrorMessage() {
    if (_errorMsg == null) return Container();
    return Text(_errorMsg, style: TextStyle(color: Colors.red));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Align(
        alignment: Alignment(0.01, -0.09),
        child: SizedBox(
          width: 300.0,
          height: 446.0,
          child: Column(
            children: <Widget>[
              Spacer(flex: 48),
              !signingIn
                  ? Text(
                      'Welcome to Imagine Share',
                      style: TextStyle(
                        fontFamily: 'Segoe UI',
                        fontSize: 20.0,
                        color: const Color(0xFF707070),
                      ),
                    )
                  : Container(),
              Spacer(flex: 63),
              buildErrorMessage(),
              signingIn ? buildPrompt() : buildFields(),
              Spacer(flex: 70),
              TextButton(
                  onPressed: openWebpage,
                  child: SvgPicture.asset(
                    'assets/logo.svg',
                    width: 170,
                  ))
            ],
          ),
        ),
      ),
    );
  }
}
