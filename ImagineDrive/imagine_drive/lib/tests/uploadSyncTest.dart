import 'dart:io';
import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/file_sync/remoteFileDirectory.dart';

// test that mimic of closing app while uploading
class UploadSyncTest {
  static Future run() async {
    var isDone = false;
    var error = '';

    await RemoteFileDirectory.reset();
    SyncController.setMountPath(mirrorPath: await FileSyncUtil.storageTmpPath);
    SyncController.autoSync = false;
    await RemoteFileDirectory.updateStart();

    print('TEST: *************UploadSyncTest**************');
    // STEP 1: retrieve clients
    var client;
    await FileRecords.client.retrieveSelected((_client) {
      client = _client;
      return false;
    });
    if (client == null) return Future.error("Client empty. Test aborted");

    const sourcePath = "../README.md";
    var relativePath = client.name + '\\README2.md';
    var targetPath = SyncController.mountPath + relativePath;

    // STEP 2: make sure the theres no existing file data on remote
    if (FileRecords.file.retrieveRecord(relativePath) != null)
      await RemoteFileDirectory.fileDeleteRequest(relativePath, client.id);

    print('TEST: adding test file');

    // STEP 1: create a file
    var fileSource = File.fromUri(Uri.file(sourcePath));
    var fileTarget = File.fromUri(Uri.file(targetPath));
    var bytes = await fileSource.readAsBytes();
    fileTarget = await fileTarget.create(recursive: true);
    if (fileTarget.existsSync()) fileTarget.deleteSync();
    await fileTarget.writeAsBytes(bytes, flush: true);

    print('TEST: ' +
        bytes.length.toString() +
        ' bytes written to test file ' +
        targetPath);

    await SyncController.sync();
    // create sync file
    var interrupted = false;
    var relativeP = FileSyncUtil.getRelativePath(targetPath);
    var sync = SyncController.queue.getActive(relativeP);
    if (sync == null) {
      return Future.error(
          'Couldnt upload with the created file. The file might already uploaded on the server. You can reset the server.');
    }

    sync.error.listen((e) {
      isDone = true;
      error = e;
    });

    // test interupt uploading
    sync.currentOperation.listen((_status) {
      if (sync.currentOperation.value != null) {
        sync.currentOperation.value.progress.listen((_progress) async {
          if (_progress >= 0.5 && !interrupted) {
            interrupted = true;

            print('TEST: closed uploading.(Mimics app closing)');
            SyncController.syncFinish(sync);

            // check if file was closed
            if (SyncController.queue.getActive(relativeP) != null) {
              isDone = true;
              error = 'File was not properly closed and still syncing.';
              return;
            }

            // resume after 3 seconds
            await Future.delayed(Duration(seconds: 3));

            print('TEST: resuming upload');

            var localData = await FileData.fromLocalPath(
                SyncController.mountPath + relativePath);

            print('TEST: Local data found ' + localData.toJson().toString());

            // check if file still exist in remote
            await RemoteFileDirectory.updateStart();
            var remoteData =
                await FileRecords.file.retrieveRecord(relativePath);
            if (remoteData != null) {
              print(
                  'TEST: Remote data found ' + remoteData.toJson().toString());
            } else {
              isDone = true;
              error = 'TEST: remotedata for ' + relativePath + ' was deleted';
              return;
            }

            await SyncController.sync();
            sync = SyncController.queue.getActive(relativePath);

            if (sync != null) {
              sync.status.listen((status) {
                if (status == eSyncState.Synced) isDone = true;
              });
            } else {
              isDone = true;
              error =
                  'TEST: failed resuming upload. File couldn\'t be found! The FileSynce.resolve() might return null because of invalid condition. Or might want to restart the server.';
            }
          }
        });
      }
    });

    // wait for result
    while (!isDone) {
      await Future.delayed(Duration(milliseconds: 200));
    }

    print('TEST: Cleaning up');
    SyncController.autoSync = true;
    fileTarget.deleteSync();

    //await RemoteFileDirectory.fileDeleteRequest(
    //    fileData.relativePath, fileData.clientFolder);

    if (error != '') {
      print('TEST FAILED');
      return Future.error(error);
    } else {
      print('TEST SUCCESS');
      return Future.value();
    }
  }
}
