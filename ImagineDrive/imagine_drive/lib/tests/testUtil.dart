import 'dart:io';

import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/file_sync/localFileDirectory.dart';
import 'package:imagine_drive/file_sync/remoteFileDirectory.dart';
import 'package:imagine_drive/utils/log.dart';
import '../utils/constants.dart';
import 'package:imagine_drive/file_sync/syncController.dart';

class TestUtil {
  static const TESTFILES_DIR = '../files/testFiles';

  /// use to upload a file from test files
  static Future<File> uploadFile(String fileName,
      {String clientFolder = '', String newFname = ""}) async {
    // if client folder left empty, load it from server
    if (clientFolder.length == 0) {
      int clientCount = 0;
      String clientName = "";
      await FileRecords.client.retrieveSelected((data) async {
        clientCount++;
        clientName = data.name;
        return false;
      });
      if (clientCount == 0) {
        await RemoteFileDirectory.updateStart();
        if (clientCount == 0)
          return Future.error('Couldnt retrieve client folder for uploading.');
        clientFolder = clientName;
      }
    }

    var sourceF = File.fromUri(Uri.file(TESTFILES_DIR + '/' + fileName));
    var newFilename = fileName;
    if (newFname != "") newFilename = newFname;
    newFilename = newFilename.split('\\').last;

    var targetP = SyncController.mountPath + clientFolder + '\\' + newFilename;
    var targetF = File.fromUri(Uri.file(targetP));
    if (await targetF.exists()) {
      FileSyncUtil.retry((_retries) async => targetF = await targetF.delete(),
          onError: (err) {
        Log.write('Failed deleting file retrying. ' + err.toString(),
            tag: 'TestUtil');
      });
    }
    await FileSyncUtil.retry(
        (_retries) async => targetF = await sourceF.copy(targetP),
        retry: 3,
        name: 'Copying file');
    print('TEST: file ' + sourceF.path + ' was copied to ' + targetP);
    return targetF;
  }

  /// use to upload all files in a directory
  /// @dirname: name directory to upload
  static Future<List<String>> getDirFiles(String dirname,
      {String clientFolder = ''}) async {
    List<String> files = List.empty(growable: true);

    // iterate through files
    var dir = Directory.fromUri(Uri.directory(TESTFILES_DIR + '/' + dirname));
    var subs = dir.list(recursive: true);
    await subs.listen((file) {
      var splits = file.path.split('\\');
      var filename = splits[splits.length - 2] + '\\' + splits.last;
      files.add(filename);
    }).asFuture();
    return files;
  }

  static Future<void> testUploadDir(String dirname,
      {String name = 'Testing',
      Function onStart,
      Function(FileSync) onCleanup,
      Function(FileSync, double) onSyncProgress,
      bool deleteFinalFile = false}) async {
    print('************* UPLOAD DIR START ' + name + '**************');
    await RemoteFileDirectory.updateStart();

    var files = await getDirFiles(dirname);
    var uploaded = 0;
    var error;

    List<Future> task = List.empty(growable: true);
    for (var file in files) {
      task.add(testUploadFile(file,
          name: file,
          deleteFinalFile: deleteFinalFile,
          onCleanup: (_sync) => uploaded++).onError((error, stackTrace) {
        print(stackTrace.toString());
        error = error;
      }));
    }

    Future.wait(task);

    // STEP: wait until all files uploaded
    while (uploaded < files.length && error == null) {
      await Future.delayed(Duration(milliseconds: 1000));
    }

    print('************* UPLOAD DIR ' +
        name +
        ' ' +
        (error != null ? 'FAILED' : 'SUCCEED') +
        ' **************');

    if (error != null) {
      print(error.toString());
      return Future.error(error);
    }
  }

  static Future clearClient(String clientname) async {
    var dir = Directory.fromUri(
        Uri.directory(SyncController.mountPath + '\\' + clientname));
    var subs = dir.list(recursive: true);
    await subs.listen((file) {
      if (file.existsSync()) {
        try {
          file.deleteSync();
        } catch (e) {
          print('Delete ignored' + e.toString());
        }
      }
    }).asFuture();
  }

  static Future clearAllClient() async {
    await RemoteFileDirectory.updateStart();
    await FileRecords.client.retrieveSelected((data) async {
      await clearClient(data.name);
      return true;
    });
  }

  /// provides functionality for uploading file and to monitor upload progress
  /// @filename: name of the file
  /// @onStart: callback upon start of the upload
  /// @onCleanup: callback for cleaning upload
  static Future testUploadFile(String filename,
      {String name = 'Testing',
      Function onStart,
      Function(FileSync) onCleanup,
      Function(FileSync, double) onSyncProgress,
      bool deleteFinalFile = false}) async {
    print('************* UPLOAD START ' + name + '**************');
    await RemoteFileDirectory.updateStart();

    // retrieve clients
    var client;
    await FileRecords.client.retrieveSelected((_client) {
      client = _client;
      return false;
    });
    if (client == null) return Future.error("Client empty. Test aborted");

    var normalizeFilename = filename;
    var split = normalizeFilename.split('\\');
    if (split.isNotEmpty) normalizeFilename = split.last;
    var targetPath =
        SyncController.mountPath + client.name + '\\' + normalizeFilename;

    SyncController.autoSync = false;
    var targetFile =
        await TestUtil.uploadFile(filename, clientFolder: client.name);
    if (onStart != null) onStart();

    // create sync file
    var fileData = await FileData.fromLocalPath(targetPath);
    var _status = eSyncState.Reupload;
    var sync = FileSync.resolve(fileData, pStatus: _status);
    sync.closeOnFinished = false;

    // listen to events
    sync.currentOperation.listen((_status) {
      if (sync.currentOperation.value != null) {
        sync.currentOperation.value.progress.listen((_progress) async {
          if (onSyncProgress != null) await onSyncProgress(sync, _progress);
        });
      }
    });

    await SyncController.updateRecord(sync.status.value, sync.data);
    SyncController.queue.addSync(sync);

    // wait for result
    while (sync.status.value != eSyncState.Synced && sync.error.value == '' ||
        (sync.currentOperation.value != null &&
            sync.currentOperation.value.running)) {
      await Future.delayed(Duration(milliseconds: 200));
    }

    // cleanup
    if (onCleanup != null) onCleanup(sync);
    SyncController.autoSync = true;
    if (sync.error.value == '')
      SyncController.syncFinish(sync, isSuccess: true);

    try {
      if (deleteFinalFile) await targetFile.delete();
    } catch (e, stack) {
      return Future.error(e, stack);
    }

    print('************* UPLOAD ' + name + ' SUCCEED **************');

    if (sync.error.value != '')
      return Future.error(sync.error.value);
    else
      return Future.value();
  }

  static Future resetFiles() async {
    SyncController.stopAllFileSync();
    await clearAllClient();
    FileRecords.deleteAllRecords();
  }
}
