import 'package:imagine_drive/tests/testUtil.dart';

class UploadTests {
  static Future<void> smallFile() async {
    return TestUtil.testUploadFile('small\\file1.pdf');
  }

  static Future<void> mediumFile() {
    return TestUtil.testUploadFile('medium\\file1.pdf');
  }

  static Future<void> largeFile() {
    return TestUtil.testUploadFile('large\\file1.jpg');
  }

  static Future<void> smallFiles() {
    return TestUtil.testUploadDir('small');
  }

  static Future<void> mediumFiles() {
    return TestUtil.testUploadDir('medium');
  }

  static Future<void> largeFiles() {
    return TestUtil.testUploadDir('large');
  }

  static Future<void> testAll() async {
    await smallFile();
    await mediumFile();
    await largeFile();
    await smallFiles();
    await mediumFiles();
    await largeFiles();
  }
}
