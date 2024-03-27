import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dokan/flutter_dokan.dart';

void main() {
  const MethodChannel channel = MethodChannel('flutter_dokan');

  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    channel.setMockMethodCallHandler((MethodCall methodCall) async {
      return '42';
    });
  });

  tearDown(() {
    channel.setMockMethodCallHandler(null);
  });

  test('getPlatformVersion', () async {
    expect(await FlutterDokan.platformVersion, '42');
  });

  test('mount', () async {
    await FlutterDokan.mountMirror("c:/");
  });
}
