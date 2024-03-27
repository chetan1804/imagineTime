import 'package:imagine_drive/utils/log.dart';

import 'fileData.dart';
import 'fileSync.dart';
import 'syncController.dart';

class FileSyncData {
  FileData data;
  eSyncState status;
  FileSyncData next;
  Uri get uri => data.uri;
  FileSyncData(this.status, this.data);
}

class FileSyncList {
  int maxQueue;
  int _totalQueue = 0;
  FileSyncData nextInLine;
  FileSyncData lastInLine;
  List<FileSync> activeSync = List.empty(growable: true);

  FileSyncList(this.maxQueue);

  bool isWaitingFull() => _totalQueue >= maxQueue;

  int get currentWaiting => _totalQueue;

  // return currently in sync files except the deleting state
  int get currentActive => activeSync.length;

  // make sure theres always in sync
  void processNextActive() {
    int found = 0; // number of currently active
    // resume stopped filesync
    for (var item in activeSync) {
      if (item.currentOperation.value != null &&
          item.isCurrentOperationResumable() &&
          !item.currentOperation.value.running) {
        item.resumeOperation();
      }

      // delete state are not included
      if (item.status.value != eSyncState.DeleteLocal &&
          item.status.value != eSyncState.DeleteRemote &&
          item.status.value != eSyncState.Synced) found++;
    }
    // check next active sync. make sure theres active in sync
    if (found == 0 && nextInLine != null) {
      var toAdd = nextInLine;
      moveWaitingToActive(toAdd.uri);
    }
  }

  // start syncing the file
  void addToActive(eSyncState pStatus, {FileData data}) {
    var newSync = FileSync.resolve(data, pStatus: pStatus);
    if (newSync != null) {
      addSync(newSync);
      Log.write(
          'Added to active ' + data.relativePath + ' ' + pStatus.toString(),
          tag: 'FileSyncList',
          type: eLogType.VERBOSE);
    } else
      Log.write(
          'Skipped adding ' + data.relativePath + ' ' + pStatus.toString(),
          tag: 'FileSyncList');
  }

  // use to move the currently waiting file to active.
  // @uri: the uri of the file to move from waiting
  // @return: true if successfully moved
  bool moveWaitingToActive(Uri uri) {
    var waiting = popWaiting(uri);
    if (waiting != null) {
      addToActive(waiting.status, data: waiting.data);
      return true;
    } else
      return false;
  }

  void addSync(FileSync newSync) {
    activeSync.add(newSync);
    SyncController.onAddedSyncFile(newSync);
  }

  void addToWaiting(eSyncState pStatus, FileData data) {
    var waiting = FileSyncData(pStatus, data);
    if (nextInLine == null) {
      nextInLine = waiting;
    } else {
      if (lastInLine != null)
        lastInLine.next = waiting;
      else
        nextInLine.next = waiting;
      lastInLine = waiting;
    }
    _totalQueue++;
    Log.write(
        'Added waiting ' +
            waiting.uri.toString() +
            ' ' +
            pStatus.toString() +
            '. Total ' +
            _totalQueue.toString(),
        tag: 'FileSyncList',
        type: eLogType.VERBOSE);
  }

  // does the path exist on either active or waiting
  bool isContains(Uri uri) {
    return getActive(uri) != null || getWaiting(uri) != null;
  }

  bool isContainsWaiting(Uri uri) {
    return getWaiting(uri) != null;
  }

  FileSync getActive(Uri pUri) {
    var i = activeSync.indexWhere((element) => element.uri == pUri);
    if (i >= 0)
      return activeSync[i];
    else
      return null;
  }

  FileSyncData getWaiting(Uri pUri) {
    var current = nextInLine;
    while (current != null) {
      if (current.uri == pUri)
        return current;
      else
        current = current.next;
    }

    return null;
  }

  void removeActive(FileSync file) {
    activeSync.remove(file);
  }

  FileSyncData popWaiting(Uri remove) {
    var current = nextInLine;
    FileSyncData previous;

    while (current != null) {
      if (current.uri == remove) {
        if (previous != null)
          previous.next = current.next;
        else {
          nextInLine = current.next;
          if (nextInLine == lastInLine) lastInLine = null;
        }
        current.next = null;
        _totalQueue--;
        return current;
      } else {
        previous = current;
        current = current.next;
      }
    }
    return null;
  }

  void clearWaiting() {
    nextInLine = null;
    lastInLine = null;
  }

  void updateStatus(eSyncState pStatus, {FileData data}) {
    var waiting = getWaiting(data.uri);
    // is currently waiting?
    if (waiting != null) {
      waiting.status = pStatus;
      waiting.data = data;
    } else {
      var active = getActive(data.uri);
      if (active != null) active.resetStatus(pStatus, data: data);
    }
  }
}
