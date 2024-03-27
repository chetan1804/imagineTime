import 'package:imagine_drive/file_sync/remoteFileDirectory.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:socket_io/socket_io.dart';

/*
  Class that handles local request coming from COM libraries
 */
class ShellComHandler {
  static const PORT = 3100;
  static void initialize() {
    var server = new Server();
    server.listen(PORT);
    server.on('connection', (client) {
      Log.write('DLL start listening at ' + PORT.toString(),
          tag: 'ShellComHandler');
      client.on('shareLink', onRequestShareLink);
      client.on('error', (er) {
        print(er);
      });
      client.on('disconnect', (ds) {
        print(ds);
      });
    });
    server.on('disconnect', (client) => Log.write('DLL Disconnected'));
    server.on('error', (client) {
      Log.write('Com server error ', tag: 'ShellComHandler');
    });
  }

  static void onRequestShareLink(dynamic val) async {
    var path = val[0];
    var callback = val[1];
    Log.write('REquesting for link ' + path, tag: 'ShellComHandler');

    String link = "";
    try {
      link = await RemoteFileDirectory.retrieveShareLink(uri: path);
    } catch (e) {
      Log.write('Failed to retrieve link',
          tag: 'ShellComHandler', type: eLogType.ERROR);
    }

    callback(link);
  }
}
