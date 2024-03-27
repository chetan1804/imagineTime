import 'package:imagine_drive/file_sync/fileOperations/fileOperation.dart';
import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/localFileDirectory.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/utils/log.dart';

class FileRename extends FileOperation {
  FileRename(FileSync fileSync) : super(fileSync);

  @override
  Future onStarted() async {
    if (fileSync.data.oldRelativePath != "" &&
        await LocalFileDirectory.isPathExist(fileSync.data.oldRelativePath)) {
      var file = await LocalFileDirectory.fileSystemFromRelativePath(
          fileSync.data.oldRelativePath);
      file.rename(SyncController.mirrorPathData + fileSync.data.relativePath);
    } else {
      Log.write(
          fileSync.data.relativePath + ' couldnt rename, old path is not exist',
          type: eLogType.ERROR);
    }
    return Future.value();
  }
}
