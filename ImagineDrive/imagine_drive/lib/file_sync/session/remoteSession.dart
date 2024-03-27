import 'package:imagine_drive/handlers/socket.dart';
import 'package:imagine_drive/utils/cancelable.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:imagine_drive/utils/observable.dart';

enum eSessionState {
  IDLE,
  STARTING,
  STARTED,
  FINISHING,
  FINISHED,
  ERROR,
  // this current streaming was cancelled
  CANCELLED,
  // this current streaming was outdated and server requested to stop this
  OUTDATED,
  // file was failed to be streamed
  FAILED,
  TIMEOUT,
  UNKNOWN,
}

/*
  remoteSession.dart
  This class handles the current streaming session from server
 */
class RemoteSession {
  static const CODE_FILE_NOT_EXIST = 404;
  static const CODE_OUTDATED = 500;
  static const CODE_TIMEOUT = 501;
  static const CODE_FAILED = 502;
  static const CODE_SUCCESS = 200;
  // this is the session id
  String id;
  Cancellable _cancel;
  bool _isFinished = false;
  eSessionState _finishedState = eSessionState.UNKNOWN;
  String _uri;
  // callback when data was recieved
  Function(dynamic) onDataRecieved;
  Function(dynamic) onError;
  Function(dynamic) onRemoteReady;
  Function(dynamic) onOutdated;
  Function(String, dynamic) onRecievedEvent;
  Function(eSessionState) onFinished;

  bool get isFinished => _isFinished;
  eSessionState get finishedState => _finishedState;

  //callback when
  Observable<eSessionState> status =
      new Observable(initValue: eSessionState.IDLE);

  RemoteSession(this.id, {String uri}) {
    _uri = uri;
    // exclusive for this streaming
    Socket.registerEvent(id, _onListen);
    // shared streaming
    Socket.registerEvent(uri, _onListen);
    _cancel = Cancellable();
    Socket.connected.listen(_onReconnected);
    _ready();
  }

  void _ready() {
    transmit('ready');
  }

  Future start({dynamic data}) async {
    status.value = eSessionState.STARTING;
    try {
      var response = await transmit('start', data: data);
      status.value = eSessionState.STARTED;
      return response;
    } catch (e) {
      return Future.error(e);
    }
  }

  // closes all connections
  void close() {
    _cancel.cancel();
    Socket.unregisterEvent(id, _onListen);
    Socket.unregisterEvent(_uri, _onListen);
    Socket.connected.unlisten(_onReconnected);
  }

  // send a finish event and close this
  Future finish() async {
    if (_isFinished) return Future.value();
    try {
      status.value = eSessionState.FINISHING;
      var res = await transmit('finish', retry: 1, timeout: 1000);
      status.value = eSessionState.FINISHED;
      _isFinished = true;
      close();
      return res;
    } catch (e) {
      close();
      return Future.error(e);
    }
  }

  void cancel() {
    status.value = eSessionState.CANCELLED;
    _cancel.cancel();
  }

  Future upload(Map<String, dynamic> data) {
    return transmit('upload', data: data, retry: 4);
  }

  // this stream is outdated
  Future markAsOutdated() async {
    status.value = eSessionState.OUTDATED;
    return transmit('outdated');
  }

  // transmit data to remote
  Future transmit(String action,
      {Map<String, dynamic> data, int retry = 5, int timeout = 5000}) {
    try {
      if (data == null) data = new Map<String, dynamic>();
      data['action'] = action;
      return Socket.transmitDataAckTimeout(id, data,
          cancel: _cancel,
          retry: retry,
          timeout: timeout,
          tag: 'Session::transmit::' + action);
    } catch (e) {
      status.value = eSessionState.ERROR;
      return Future.error('Failed transmit ' + e.toString());
    }
  }

  // callback when recieved an action from server
  void _onListen(dynamic data) {
    var callback;
    if (data[1] != null) {
      callback = data[1];
      data = data[0];
    }
    switch (data['action']) {
      case 'data':
        if (onDataRecieved != null) onDataRecieved(data);
        break;
      case 'error':
        if (onError != null) onError(data);
        break;
      case 'ready':
        if (onRemoteReady != null) onRemoteReady(data);
        break;
      case 'outdated':
        if (onOutdated != null) onOutdated(data);
        break;
      case 'finished':
        Log.write(id + ' finished ' + data.toString(),
            tag: 'Session', type: eLogType.VERBOSE);
        _isFinished = true;
        _finishedState = eSessionState.UNKNOWN;
        switch (data['code']) {
          case CODE_FAILED:
            _finishedState = eSessionState.FAILED;
            break;
          case CODE_TIMEOUT:
            _finishedState = eSessionState.TIMEOUT;
            break;
          case CODE_OUTDATED:
            _finishedState = eSessionState.OUTDATED;
            break;
          case CODE_SUCCESS:
            _finishedState = eSessionState.FINISHED;
            break;
          default:
        }
        if (onFinished != null) onFinished(_finishedState);
        break;
      default:
        if (onRecievedEvent != null) onRecievedEvent(data['action'], data);
        break;
    }
    if (callback != null) {
      callback('');
    }
  }

  void _onReconnected(bool connected) async {
    if (connected) {
      try {
        await _resumeSession();
      } catch (e) {
        if (onError != null) onError('Failed to resume');
      }
    }
  }

  Future _resumeSession() async {
    return Socket.transmitDataAckTimeout(
      'session-reconnected',
      {'sessionId': id},
      retry: 5,
      cancel: _cancel,
      tag: "Session::_resumeSession",
    );
  }
}
