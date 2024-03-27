import 'package:imagine_drive/file_sync/syncController.dart';

class DownloadTest {
  static Future run() async {
    await SyncController.sync();
    var file = SyncController.queue.activeSync;
  }
}
