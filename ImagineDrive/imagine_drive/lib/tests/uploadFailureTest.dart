import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/handlers/socket.dart';
import 'package:imagine_drive/tests/testUtil.dart';

class UploadFailureTest {
  static Future<void> run() {
    bool isTested = false;
    return TestUtil.testUploadFile('large\\file2.jpg', name: 'Failure Test',
        onSyncProgress: (syncFile, progress) async {
      if (!isTested && progress > 0.5) {
        print(
            'Disconnecting connection. Upload should fail and client who are downloading this file should also fail. Will reconnect after 30 seconds.');
        isTested = true;
        Socket.disconnect();
        await Future.delayed(Duration(seconds: 30));
        print(
            'Now reconnecting. This will resume uploading and other user will redownload.');
        SyncController.autoSync = true;
        Socket.connect();
        syncFile.closeOnFinished = true;
      }
    });
  }
}
