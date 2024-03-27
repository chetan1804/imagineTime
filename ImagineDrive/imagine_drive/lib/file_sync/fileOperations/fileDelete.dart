import 'dart:io';

import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/localFileDirectory.dart';

import '../fileSyncUtil.dart';
import '../remoteFileDirectory.dart';
import 'fileOperation.dart';

class FileDelete extends FileOperation {
  bool localDelete = false;
  FileDelete(FileSync fileSync, {this.localDelete}) : super(fileSync);

  @override
  Future onStarted() async {
    // STEP: delete the actual file
    fileSync.data.status = 'archived';
    var file;
    if (!fileSync.data.isDirectory)
      file = fileSync.data.loadFileMirrored();
    else
      file = Directory.fromUri(fileSync.data.mirroredUriDir);
    if (localDelete && await file.exists()) {
      LocalFileDirectory.skipReport(fileSync.uri);
      await FileSyncUtil.retry(
        (_retries) async {
          if (await file.exists()) await file.delete();
        },
        retry: 5,
        name: 'FileDelete',
        throwError: false,
      );
      await LocalFileDirectory.removeSkip(fileSync.uri);
    }

    // STEP: for remote delete. send delete request
    if (!localDelete) {
      await RemoteFileDirectory.fileDeleteRequest(
          fileSync.data.relativePath, await fileSync.data.client,
          deleteTime: fileSync.data.updateAt, cancel: cancellable);
    }
    return Future.value();
  }
}
