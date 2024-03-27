import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/tests/testUtil.dart';
import '../handlers/socket.dart' as SocketHandler;

class UploadInterruptTest {
  static Future run() async {
    var interrupted = false;
    var interrupConnect = false;
    var fileUpdateInterrupt = false;
    await TestUtil.testUploadFile('large\\file2.jpg',
        deleteFinalFile: false,
        name: 'UploadInterruptTest', onSyncProgress: (sync, progress) async {
      if (progress >= 0.3 && !interrupConnect) {
        interrupConnect = true;
        print('TEST: testing connection interrupt');
        SocketHandler.Socket.disconnect();

        // resume after 3 seconds
        await Future.delayed(Duration(seconds: 3));
        SocketHandler.Socket.reconnect();
        SyncController.autoSync = true;
        print('TEST: resuming connection');
      }
      if (progress >= 0.5 && !interrupted) {
        interrupted = true;

        print(
            'TEST: testing upload interruption. This stops operation and resumes after 3 seconds.');
        sync.stopOperation(waitUntilComplete: false, retryLater: true);
        // resume after 3 seconds
        await Future.delayed(Duration(seconds: 3));

        print('TEST: resuming upload');
        sync.resumeOperation();
      }

      if (progress >= 0.5 && interrupted && !fileUpdateInterrupt) {
        fileUpdateInterrupt = true;
        print('*******TEST: replacing new file');
        await TestUtil.uploadFile('large\\file1.jpg', newFname: 'file2.jpg');
      }
    });
  }
}
