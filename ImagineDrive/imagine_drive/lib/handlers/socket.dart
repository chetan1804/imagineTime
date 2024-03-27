import 'dart:developer';

import 'package:imagine_drive/file_sync/fileSyncUtil.dart';
import 'package:imagine_drive/handlers/shellComHandler.dart';
import 'package:imagine_drive/utils/cancelable.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:imagine_drive/utils/observable.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

enum eConnectionStatus {
  CONNECTED,
  DISCONNECTED,
  CONNECTING,
}

class Socket {
  static IO.Socket _socketIO;
  static Observable<bool> connected = new Observable<bool>(initValue: false);
  static Observable<eConnectionStatus> connectionStatus =
      new Observable<eConnectionStatus>(
          initValue: eConnectionStatus.DISCONNECTED);
  static bool _disconnectedManually = false;
  static bool _reconnecting = false;

  static void connect() {
    _disconnectedManually = false;
    if (_socketIO != null) {
      if (!_socketIO.connected) {
        connectionStatus.value = eConnectionStatus.CONNECTING;
        _socketIO = _socketIO.connect();
      }
      return;
    }
    ShellComHandler.initialize();
    connectionStatus.value = eConnectionStatus.CONNECTING;
    _socketIO = IO.io(
        FILESYNC_SERVER,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .enableReconnection()
            .build());
    _socketIO.onConnect(onConnected);
    _socketIO.onReconnect((data) => null);
    _socketIO.onDisconnect(onDisconnected);
    _socketIO.onError(onError);
  }

  // callback when connected to socket
  static void onConnected(dynamic data) {
    print('connected');
    connected.value = true;
    connectionStatus.value = eConnectionStatus.CONNECTED;
  }

  static void transmitData(String event, dynamic data) {
    _socketIO.emit(event, data);
  }

  static void transmitDataAck(String event, dynamic data, Function pCallback,
      {bool binary = false}) {
    _socketIO.emitWithAck(event, data, ack: pCallback, binary: binary);
  }

  /// use to transmit data to remote with timeout
  /// @timeout: time to wait for response in milliseconds
  static Future transmitDataAckTimeout(String event, Map<String, dynamic> data,
      {bool binary = false,
      int retry = 0,
      Cancellable cancel,
      int timeout = 5000,
      String tag = 'Socket.transmit'}) {
    //print('Create request ' + event + ' ' + data.toString() + '');
    var task = () async {
      return FileSyncUtil.retry((retries) async {
        // test the connection
        if (!_socketIO.connected) return Future.error('connection timeouts');

        bool hasResult = false;
        dynamic response;
        Socket.transmitDataAck(event, data, (_response) {
          hasResult = true;
          response = _response;
          //print('Response ' + event);
        });

        var elapsed = Timeline.now;
        // wait until timeout and the result returned
        while (!hasResult && Timeline.now - elapsed < timeout * 1000) {
          if (cancel != null && cancel.cancelled) break;
          await Future.delayed(Duration(milliseconds: 1));
        }

        if (!hasResult)
          return Future.error("socket request timeout " + event);
        else
          return Future.value(response);
      }, retry: retry, cancelToken: cancel, name: tag, waiting: timeout + 1000);
    };
    return Future.microtask(task);
  }

  static void registerEvent(String event, Function(dynamic) pCallback) {
    _socketIO.on(event, pCallback);
  }

  static void unregisterEvent(String event, Function(dynamic) pCallback) {
    _socketIO.off(event, pCallback);
  }

  static void disconnect() {
    _disconnectedManually = true;
    _socketIO.disconnect();
  }

  static void reconnect() async {
    if (_reconnecting) return;
    _reconnecting = true;
    while (!_socketIO.connected) {
      Log.write('Trying to reconnect', tag: 'Socket');
      await Future.delayed(Duration(seconds: 5));
      connect();
    }
    _reconnecting = false;
  }

  static void onDisconnected(dynamic data) {
    connected.value = false;
    connectionStatus.value = eConnectionStatus.DISCONNECTED;
    Log.write('Disconnected', tag: 'Socket');
    if (!_disconnectedManually) reconnect();
  }

  static void onError(err) {
    Log.write('Error ' + err.toString(), tag: 'Socket', type: eLogType.ERROR);
  }
}
