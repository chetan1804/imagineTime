import 'package:imagine_drive/file_sync/fileData.dart';
import 'package:imagine_drive/file_sync/fileSync.dart';
import 'package:imagine_drive/file_sync/records/clientRecords.dart';
import 'package:imagine_drive/file_sync/records/fileSelectRecords.dart';
import 'package:imagine_drive/file_sync/records/fileXRecords.dart';
import 'package:imagine_drive/file_sync/records/firmRecords.dart';
import 'package:imagine_drive/file_sync/records/staffRecords.dart';
import 'package:imagine_drive/file_sync/syncController.dart';
import 'package:imagine_drive/file_sync/userPreferences.dart';
import 'package:imagine_drive/utils/log.dart';
import 'package:sqflite_common/sqlite_api.dart' as sqlapi;
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:sqlite3/sqlite3.dart';

// these classes provides saving and loading of records for client, staff, files, firms etc

// additional definition for serializing and deserializing files
class FileDefinition {
  eSyncState status;
  FileData data;
  String get relativePath => data.relativePath;
  Uri get uri => data.uri;
  FileDefinition(this.status, this.data);

  static FileDefinition fromJson(Map<String, dynamic> json) {
    return FileDefinition(
        eSyncState.values[json['syncStatus']], FileData.fromJson(json));
  }

  static FileDefinition fromRow(Map<String, dynamic> json) {
    return FileDefinition(
        eSyncState.values[json['syncStatus']], FileData.fromJson(json));
  }

  Map toJson() {
    return {'syncStatus': status.index, 'data': data.toJson()};
  }

  Future<Map> toRow() async {
    var json = await data.toJson();
    json['syncStatus'] = status.index;
    return json;
  }
}

class FileRecords {
  static const DATABASE_NAME = 'sync.dat';
  static int _state = 0;
  static sqlapi.Database _database;
  static Future<String> get databaseSource async =>
      await UserPreferences.instance.workingDirectory + '\\' + DATABASE_NAME;
  static bool _isUpdating = false;
  static bool get isUpdating => _isUpdating;
  static sqlapi.Database get database => _database;
  static FirmRecords _firmRec = new FirmRecords();
  static ClientRecords _clientRec = new ClientRecords();
  static StaffRecords _staffRec = new StaffRecords();
  static FileXRecords _fileRec = new FileXRecords();
  static FileSelectRecords _fileSelectRec = new FileSelectRecords();

  static FirmRecords get firm => _firmRec;
  static ClientRecords get client => _clientRec;
  static StaffRecords get staff => _staffRec;
  static FileXRecords get file => _fileRec;
  static FileSelectRecords get syncSelection => _fileSelectRec;

  static Future initialize() async {
    // this is loaded
    if (_state == 2) return Future.value();

    // wait while still loading
    while (_state == 1) {
      await Future.delayed(Duration(milliseconds: 200));
    }

    //Log.write('Start initializing at ' + await databaseSource,
    //    tag: 'FileRecords', type: eLogType.VERBOSE);

    // STEP: open db and create db if not yet exist. and initialize
    if (_database != null) _database.close();

    // fixed issue. when testing during debug
    try {
      sqfliteFfiInit();
    } catch (e) {
      sqlite3.openInMemory().dispose();
    }

    var databaseFactory = databaseFactoryFfi;
    _database = await databaseFactory.openDatabase(await databaseSource);
    _state = 2;
    await _database.execute('create table if not exists sync(' +
        'id int,' +
        'uri varchar(300) primary key,' +
        'oldUri varchar(300) default null,' +
        'status varchar(50), ' +
        'category varchar(50),' +
        'syncStatus tinyint, ' +
        'lastModified int,' +
        'client int default null,' +
        'firm int default null,' +
        'uploadBy int,' +
        'updateAt int,' +
        'available int,' +
        'totalSize int,' +
        'personal int default null'
            ')');
    await _database.execute('create table if not exists client(' +
        'id int primary key,' +
        'name varchar(300),' +
        'firm int,' +
        'updateAt int' +
        ')');
    await _database.execute('create table if not exists firm(' +
        'id int primary key,' +
        'name varchar(300),' +
        'updateAt int' +
        ')');
    // stores data for staff
    await _database.execute('create table if not exists staff(' +
        'id int primary key,' +
        'userid int,' +
        'firm int,' +
        'firstname varchar(300),' +
        'lastname varchar(300),' +
        'updateAt int' +
        ')');
    // stores data for file sync selection
    await _database.execute('create table if not exists selection(' +
        'id int,' +
        'file int,' +
        'ison tinyint(1) default 1,' +
        'uri varchar(300) primary key,' +
        'updateAt int,' +
        'status tinyint default 0' +
        ')');
    // enable wal mode for concurrency
    // await _database.execute('PRAGMA journal_mode=WAL;');
    // await _database.execute('PRAGMA wal_autocheckpoint=0;');
  }

  static Future close() async {
    if (_database == null) return;
    _state = 0;
    await _database.close();
    _database = null;
  }

  static void deleteAllRecords() async {
    //var cacheDirectory =
    //    File.fromUri(Uri.file(FileSyncUtil.cacheDir + '\\records.dat'));
    _database.close();
    await databaseFactoryFfi.deleteDatabase(await databaseSource);
    _state = 0;
    _database = null;
    //await File.fromUri(Uri.file(await databaseSource)).delete();
  }

  static Future commitBatch(sqlapi.Batch batch) async {
    try {
      await startOperation(tag: "Commitbatch");
      await batch.commit(noResult: true, continueOnError: false);
    } catch (e) {
      Log.write(e.message,
          tag: "FileRecords::commitBatch", type: eLogType.ERROR);
    }
    endOperation();
  }

  // use to avoid lock exception
  static Future<void> startOperation({String tag = ""}) async {
    if (tag != "") tag += " is ";
    Log.write(tag + 'Waiting for others to finish before next update...',
        tag: 'FileRecords', type: eLogType.VERBOSE);
    while (_isUpdating) {
      await Future.delayed(Duration(seconds: 1));
    }
    _isUpdating = true;
  }

  static void endOperation() {
    _isUpdating = false;
  }

  static Future<List<Map<String, Object>>> query(String table,
      {bool distinct,
      List<String> columns,
      String where,
      List<Object> whereArgs,
      String groupBy,
      String having,
      String orderBy,
      int limit,
      int offset}) {
    if (_database == null || !_database.isOpen) return Future.value([]);
    return _database.query(table,
        distinct: distinct,
        columns: columns,
        where: where,
        whereArgs: whereArgs,
        groupBy: groupBy,
        having: having,
        orderBy: orderBy,
        limit: limit,
        offset: offset);
  }

  // use to setup directories based from cached data
  static Future setupDir() async {
    Log.write("Setting up directories",
        tag: "FileRecords", type: eLogType.VERBOSE);
    try {
      await initialize();
      do {
        await Future.delayed(Duration(milliseconds: 900));
        Log.write("Setting up directories, waiting.",
            tag: "FileRecords", type: eLogType.VERBOSE);
      } while (!SyncController.mounted);
      //return Future.value();
      await _firmRec.setupAllFirm();
      await _clientRec.setupAllClients();
      await _staffRec.setupStaffs();
    } catch (e, stack) {
      print(stack);
      Log.write(e.toString(),
          tag: "FileRecords::setupDir", type: eLogType.ERROR);
    }
  }
}
