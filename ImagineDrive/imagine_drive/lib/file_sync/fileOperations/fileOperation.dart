import 'package:imagine_drive/utils/cancelable.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:imagine_drive/utils/observable.dart';

import '../fileSync.dart';

/*
    fileOperation.dart 
    Base class for file operations such as for downloading, uploading and deleting
 */
abstract class FileOperation {
  FileSync fileSync;
  Observable<double> progress = Observable(initValue: 0);
  bool _retryLater = false;
  bool _running = false;
  Cancellable cancellable = Cancellable();

  /// true if this was cancelled and okay to resume
  bool get retryLater => _retryLater;

  /// true if wwas closed permanently
  bool get running => _running;

  bool get cancelled => cancellable.cancelled;

  FileOperation(this.fileSync);

  Future start() async {
    if (_running) return;

    _retryLater = false;
    _running = true;
    cancellable.cancelled = false;
    try {
      await onStarted();
    } catch (e, stack) {
      return Future.error(e, stack);
    } finally {
      _running = false;
    }
  }

  Future onStarted();

  /// cancel this operation and can resume later
  Future cancel({String reason = '', bool retryLater = true}) async {
    if (cancelled) {
      Log.write('Already cancelled ' + fileSync.relativePath,
          tag: runtimeType.toString());
      return;
    }
    cancellable.cancel();
    _retryLater = retryLater;
    Log.writeFast(
        () =>
            'Cancelling ' +
            fileSync.relativePath +
            ' ' +
            reason +
            '. Retry ' +
            retryLater.toString(),
        tag: runtimeType.toString());
    return Future.value();
  }

  /// close this operation forever.
  /// @waitUntilComplete: true dont force cancel. false to wait for operation to complete
  Future close(
      {bool waitUntilComplete = true,
      bool retryLater = false,
      String reason = 'Force close this operation.'}) async {
    if (!waitUntilComplete) {
      await cancel(
          reason: reason + ' Retry = ' + retryLater.toString(),
          retryLater: retryLater);
    } else {
      Log.write(reason + ' Retry = ' + retryLater.toString(),
          tag: runtimeType.toString(), type: eLogType.VERBOSE);
      _retryLater = retryLater;
    }

    if (_running) {
      do {
        await Future.delayed(Duration(milliseconds: 500));
      } while (_running);
    }
    Log.write(fileSync.relativePath + ' Closed.',
        tag: runtimeType.toString(), type: eLogType.VERBOSE);
  }

  void reset() {}
}
