import 'package:imagine_drive/file_sync/fileOperations/fileDelete.dart';
import 'package:imagine_drive/file_sync/fileOperations/fileOperation.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:imagine_drive/utils/observable.dart';

import 'fileData.dart';
import 'fileOperations/fileDownload.dart';
import 'fileOperations/fileUpload.dart';
import 'syncController.dart';

enum eSyncState {
  Unknown,
  Synced,
  Redownload, // outdated needs to redownload
  Reupload, // outdated needs to reupload
  Downloading,
  Uploading,
  DeleteLocal,
  DeleteRemote
}

/*
  fileSync.dart
  Class that controls file specific operations such as for deleting, uploading and downloading
 */
class FileSync {
  Uri uri;
  String relativePath;
  FileData data;
  Observable<eSyncState> status =
      Observable<eSyncState>(initValue: eSyncState.Unknown);
  Observable<String> error = Observable(initValue: '');
  Observable<FileOperation> currentOperation = Observable(initValue: null);
  // true if this will sync will be use for debugging
  bool debug = true;
  // true if this instance will be closed after finished syncing
  bool closeOnFinished = true;
  String _strProgress = '';

  FileSync({
    eSyncState status = eSyncState.Unknown,
    this.data,
  }) {
    this.status.value = status;
    relativePath = data.relativePath;
    uri = data.uri;
  }

  void resetStatus(eSyncState status, {FileData data}) {
    if (status == this.status.value) return;
    this.status.value = status;
    data = data;
    Log.write('Status reset ' + status.toString(), tag: 'FileSync');
    sync(resetOperation: true);
  }

  /// use to sync this file. dont call this directly. sync via SyncController
  void sync({resetOperation: false}) async {
    await Future.delayed(Duration(milliseconds: 50));

    // resuse old operation
    if (!resetOperation && currentOperation.value != null) {
      if (currentOperation.value.resumable) resumeOperation();
      return;
    }

    // check first if theres a copy
    switch (status.value) {
      case eSyncState.Uploading:
        _setCurrentOperation(new FileUpload(this));
        break;
      case eSyncState.Downloading:
        _setCurrentOperation(new FileDownload(this));
        break;
      case eSyncState.Reupload:
        _setCurrentOperation(new FileUpload(this, freshCopy: true));
        break;
      case eSyncState.Redownload:
        _setCurrentOperation(new FileDownload(this, freshCopy: true));
        break;
      case eSyncState.DeleteLocal:
      case eSyncState.DeleteRemote:
        _setCurrentOperation(new FileDelete(this,
            localDelete: status.value == eSyncState.DeleteLocal));
        break;
      default:
    }
  }

  /// callback when theres a progress
  void _onProgressUpdate(double percent) {
    Log.writeFast(() {
      var prog = percent.toString().substring(0, 3);
      if (prog != _strProgress) {
        _strProgress = prog;
        return relativePath + ' ' + _strProgress + ' progress ';
      } else
        return '';
    }, tag: 'FileSync', type: eLogType.VERBOSE);
  }

  /// callback when file is in synced
  void _synced() {
    status.value = eSyncState.Synced;
    Log.write(relativePath + ' file was synced.', tag: 'FileSync');
    if (closeOnFinished) {
      SyncController.syncFinish(this, isSuccess: true);
    }
  }

  void _onError(err) {
    error.value = err.toString();
    Log.write(' current operation failed. ' + error.value,
        tag: 'FileSync', type: eLogType.ERROR);
    error.value = ' current operation failed. ' + error.value;
  }

  // this is instance doesnt need any further operations. close now
  void close() async {
    _setCurrentOperation(null);
  }

  void _setCurrentOperation(FileOperation pOperation) {
    if (currentOperation.value != null) {
      Log.writeFast(
          () =>
              relativePath +
              ' operation changes from ' +
              currentOperation.value.runtimeType.toString() +
              ' to ' +
              (pOperation != null
                  ? pOperation.runtimeType.toString()
                  : 'Empty'),
          tag: 'FileSync');
      // Stop current operation then replace
      currentOperation.value.close(waitUntilComplete: false).then((_response) {
        currentOperation.value = null;
        _setCurrentOperation(pOperation);
      });
    } else {
      // replace current operation
      if (pOperation != null) {
        Log.write(
            uri.toString() + ' starting new operation ' + pOperation.toString(),
            tag: 'FileSync');

        pOperation.progress.listen(_onProgressUpdate);
        _startOperation(pOperation);
      }
      /*else
        Log.write(
            relativePath +
                ' operation ended ' +
                currentOperation.value.runtimeType.toString(),
            tag: 'FileSync');*/

      currentOperation.value = pOperation;
    }
  }

  /// use to stop current operation
  /// @waitUntilComplete: false if force close current operation. force close also means it will be resumable
  Future stopOperation(
      {bool waitUntilComplete = false, bool retryLater = false}) {
    return currentOperation.value
        .close(waitUntilComplete: waitUntilComplete, resumable: retryLater);
  }

  bool isCurrentOperationResumable() {
    return currentOperation.value.resumable;
  }

  void resumeOperation() {
    if (!currentOperation.value.resumable) {
      Log.write('Couldnt resume uncancelled operation',
          tag: 'FileSync', type: eLogType.ERROR);
      return;
    }

    if (currentOperation.value.running) {
      Log.write(
          'Couldnt resume operation because it is running ' + relativePath,
          tag: 'FileSync',
          type: eLogType.ERROR);
      return;
    }

    Log.write(
        relativePath +
            " resuming cancelled operation. " +
            currentOperation.value.runtimeType.toString(),
        tag: 'FileSync');
    _startOperation(currentOperation.value);
  }

  void _startOperation(FileOperation operation) {
    operation.start().then((_response) {
      if (!operation.cancelled) {
        if (currentOperation.value == operation) currentOperation.value = null;
        _synced();
      }
    }).catchError(_onError);
  }

  // use to create a file sync if necessary
  static FileSync resolve(FileData data,
      {eSyncState pStatus = eSyncState.Unknown}) {
    if (data != null && data.isDirectory) return null;

    var status = pStatus;
    if (status == eSyncState.Synced) return null;

    return new FileSync(status: status, data: data);
  }
}
