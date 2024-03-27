import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/localFileDirectory.dart';
import 'package:imagine_drive/utils/log.dart';

class FileStatusSolver {
  // get status based from remote data
  static Future<eSyncState> fromRemote(FileData remoteData) async {
    if (remoteData.id == null) {
      Log.write(remoteData.relativePath + ' remote data id is null',
          tag: 'FileStatusSolver', type: eLogType.ERROR);
      return eSyncState.Unknown;
    }
    var definition = await FileRecords.file.retrieveRecordById(remoteData.id);

    if (definition != null) {
      // the path was changed? then rename
      if (definition.data.relativePath != remoteData.relativePath) {
        remoteData.oldRelativePath = definition.data.relativePath;
        // only rename synced file
        if (definition.status == eSyncState.Synced &&
            await LocalFileDirectory.isPathExist(
                definition.data.relativePath)) {
          return eSyncState.Rename;
        }
        return eSyncState.Downloading;
      }

      if (definition.data.updateAt.millisecondsSinceEpoch >
          remoteData.updateAt.millisecondsSinceEpoch)
        return definition.status;
      else if (definition.data.updateAt.millisecondsSinceEpoch ==
              remoteData.updateAt.millisecondsSinceEpoch &&
          remoteData.totalSize == definition.data.totalSize)
        return eSyncState.Synced;
    } else {
      // the file exist without id. then update its id
      var localData =
          await FileRecords.file.retrieveRecord(remoteData.relativePath);
      if (localData != null &&
          localData.data.updateAt.millisecondsSinceEpoch ==
              remoteData.updateAt.millisecondsSinceEpoch) {
        await FileRecords.file
            .updateRecord(FileDefinition(eSyncState.Synced, remoteData));
        return eSyncState.Synced;
      }
    }

    // for failed
    if (remoteData.status == 'failed') {
      if (definition == null)
        return eSyncState.DeleteLocal;
      else if (definition.status == eSyncState.Uploading ||
          definition.status == eSyncState.Reupload) {
        remoteData.updateAt = DateTime.now().toUtc();
        remoteData.status = 'visible';
        return eSyncState.Reupload;
      } else
        return eSyncState.DeleteLocal;
    }

    if (definition == null) {
      if (remoteData.status != 'deleted' && remoteData.status != 'archived')
        return eSyncState.Downloading;
      else
        return eSyncState.Synced;
    }

    if (remoteData.status == 'deleted' || remoteData.status == 'archived') {
      if (remoteData.status != definition.data.status)
        return eSyncState.DeleteLocal;
      return eSyncState.Synced;
    } else if (remoteData.status == 'visible') return eSyncState.Redownload;

    return definition.status;
  }

  /// get status based from local file
  static Future<eSyncState> fromLocal(FileData data) async {
    var definition = await FileRecords.file.retrieveRecord(data.relativePath);
    if (definition == null) return eSyncState.Uploading;

    var recordData = definition.data;
    if (data.status != recordData.status) {
      if (data.status == 'deleted' || data.status == 'archived')
        return eSyncState.DeleteRemote;
      else
        return eSyncState.DeleteLocal;
    }

    if (recordData.updateAt == data.updateAt &&
        recordData.totalSize == data.totalSize)
      return eSyncState.Synced;
    else {
      return eSyncState.Uploading;
    }
  }

  static bool isValidFile(FileData data) {
    if (data.relativePath == null) return false;
    if (data.fileName == "") return false;
    //if (data.available <= 0) return false;
    return true;
  }
}
