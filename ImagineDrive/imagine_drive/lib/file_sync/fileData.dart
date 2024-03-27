import 'dart:io';
import 'package:imagine_drive/file_sync/fileRecords.dart';
import 'package:imagine_drive/file_sync/staffData.dart';
import 'package:imagine_drive/utils/constants.dart';
import 'package:imagine_drive/utils/log.dart';

import 'fileSyncUtil.dart';
import 'localFileDirectory.dart';
import 'syncController.dart';

enum eParentType {
  UNKNOWN,
  GENERAL, // file is part of general files
  STAFF, // file is part of staff files
  CLIENT, // file is part of client files
}

// thi class represents file information
class FileData {
  Uri _uri; // local uri file
  int id;
  DateTime lastModified; // always in utc
  DateTime updateAt; // the last update time
  int available; // currently available bytes
  int totalSize; // size in bytes
  StaffData _staff;
  int staffId =
      -1; // id of staff user who uploaded this file for personal use. -1 if this is not a personal file
  String relativePath;
  String category; // category of file. this can be a "document", "folder"  etc
  int _client = -1;
  int _firm = -1;
  String status;
  int uploadBy; // who uploaded this file
  String _filename;
  String _clientName = '';
  int _init = 0;
  eParentType _parentType; // which parent this is file is under
  String oldRelativePath = ""; // old relative path of this file

  Future<int> get client async {
    if (_client != null && _client >= 0) return _client;
    await _parse();
    return _client;
  }

  Future<int> get firm async {
    await _parse();
    return _firm;
  }

  Future<eParentType> get parentType async {
    if (_parentType != null) return _parentType;
    await _parse();
    return _parentType;
  }

  bool get isDirectory => category == 'folder';
  double get availablePercent => available / totalSize;
  String get fileName {
    if (_filename == null) _filename = relativePath.split('\\').last;
    return _filename;
  }

  // return the path of parent directory
  String get relativeParentPath {
    var lastI = relativePath.lastIndexOf('\\');
    if (lastI < 0) {
      Log.write(relativePath + ": Error in retriving parent path",
          tag: "FileData", type: eLogType.WARNING);
      return "";
    }
    return relativePath.substring(0, lastI);
  }

  /// return true if this file is valid. false if not
  /// not valid if this file is not part of any firm
  Future<String> get clientName async {
    await _parse();
    return _clientName;
  }

  Uri get uri {
    if (_uri == null) _uri = mirroredUri;
    return _uri;
  }

  // the genuine path to hd
  Uri get mirroredUri {
    return Uri.file(SyncController.mirrorPath + "data\\" + relativePath);
  }

  Uri get mirroredUriDir {
    return Uri.directory(SyncController.mirrorPath + "data\\" + relativePath);
  }

  // staff who owned this data
  Future<StaffData> get staff async {
    if (_staff != null) return _staff;
    await _parse();
    return _staff;
  }

  FileData(
    Uri pUri,
    this.lastModified,
    this.available,
    this.totalSize, {
    this.relativePath,
    this.category = "document",
    int client = -1,
    this.uploadBy,
    this.updateAt,
    this.status = 'visible',
    this.id,
    this.staffId = -1,
    int firm = -1,
    this.oldRelativePath = "",
    String newFilename = "",
  }) {
    _client = client;
    _firm = firm;
    _uri = pUri;
    if (relativePath == null) relativePath = "";
    if (_firm == null) _firm = -1;
    if (newFilename != "" && newFilename != null) rename(newFilename);
    // recalculate the local path
    // if (pUri == null) {
    //   _toLocalPath();
    // }
  }

  bool operator ==(other) => relativePath == other.relativePath;

  File loadFile() {
    return File.fromUri(uri);
  }

  File loadFileMirrored() {
    return File.fromUri(mirroredUri);
  }

  void rename(String newFilename) {
    var newpath = relativeParentPath + "\\" + newFilename;
    oldRelativePath = relativePath;
    relativePath = newpath;
  }

  // use to initialize local path
  // void _toLocalPath() async {
  //   if (_client == null || await client < 0) {
  //     // this is a general file. insert it to general folder
  //     // staff file
  //     if (await staff == null) {
  //       Log.write("Staff with userid " + this.staffId.toString() + " not found",
  //           tag: "FileData", type: eLogType.ERROR);
  //       return;
  //     }
  //   }
  // }

  void updateFromJson(Map<String, dynamic> json) {
    if (json.containsKey('lastModified')) {
      var lastModifiedTemp = json['lastModified'];
      if (lastModifiedTemp.runtimeType == double)
        lastModifiedTemp = lastModifiedTemp.toInt();
      lastModified =
          DateTime.fromMillisecondsSinceEpoch(lastModifiedTemp, isUtc: true);
    }
    if (json.containsKey('updateAt')) {
      var updateAtTemp = json['updateAt'];
      if (updateAtTemp.runtimeType == double)
        updateAtTemp = updateAtTemp.toInt();
      updateAt = DateTime.fromMillisecondsSinceEpoch(updateAtTemp, isUtc: true);
    }
    if (json.containsKey('available')) available = json['available'];
    if (json.containsKey('totalSize')) totalSize = json['totalSize'];
    if (json.containsKey('uploadBy')) uploadBy = json['uploadBy'];
    if (json.containsKey('status')) status = json['status'];
  }

  Future<FileData> copy() async {
    return FileData(uri, lastModified, available, totalSize,
        relativePath: relativePath,
        category: category,
        client: await client,
        uploadBy: uploadBy,
        updateAt: updateAt,
        status: status,
        id: id);
  }

  /// check if this file is fully uploaded to server
  bool get isFullyDownloaded => totalSize > 0 && totalSize == available;

  // use to retrieve the client and firm base from local path
  Future _parse() async {
    if (_init == 2) return;
    if (_init == 1) {
      do {
        await Future.delayed(Duration(milliseconds: 200));
      } while (_init == 1);
      return;
    }
    _init = 1;
    _client = -1;
    var splitArray = relativePath.split('\\');
    if (splitArray.length <= 1) {
      Log.write(relativePath + ' invalid file.',
          tag: 'LocalFileDirectory', type: eLogType.WARNING);
      _init = 2;
      return;
    }
    var tmpFirmName = splitArray.first;
    _filename = splitArray.last;
    _parentType = eParentType.UNKNOWN;

    // look for the firm
    if (_firm < 0) {
      var firmData = await FileRecords.firm.retrieveFirmByName(tmpFirmName);
      if (firmData != null)
        _firm = firmData.id;
      else {
        Log.write(relativePath + ' Failed retriving firm',
            tag: 'LocalFileDirectory', type: eLogType.ERROR);
        _init = 2;
        return;
      }
    }
    var parentdir = splitArray[1];
    switch (parentdir) {
      case GENERAL_DIR:
        _parentType = eParentType.GENERAL;
        break;
      case STAFF_DIR:
        if (splitArray.length <= 3) break;
        var staffname = splitArray[2];
        // look for specific staff who own this
        _staff = await FileRecords.staff.retrieveStaffByname(staffname, _firm);
        if (_staff != null) {
          staffId = _staff.id;
          _parentType = eParentType.STAFF;
        } else {
          Log.write(relativePath + ' expected a staff but not found.',
              tag: 'FileData', type: eLogType.WARNING);
        }
        break;
      default: //client
        _clientName = parentdir;
        var clientData;
        if (_client != null && _client >= 0)
          clientData = await FileRecords.client.getClientFromId(_client);
        else
          clientData =
              await FileRecords.client.getClientFromName(_clientName, _firm);
        if (clientData != null) {
          _client = clientData.id;
          _parentType = eParentType.CLIENT;
        } else {
          Log.write(relativePath + ' Failed retriving client.',
              tag: 'LocalFileDirectory', type: eLogType.ERROR);
          _init = 2;
          return;
        }
    }

    _init = 2;
  }

  String toString() {
    return _toString(relativePath) +
        " ID " +
        _toString(id) +
        " was parsed to firm=" +
        _toString(_firm) +
        ", client=" +
        _toString(_client) +
        ", stafff=" +
        _toString(staffId) +
        ", size " +
        _toString(available) +
        "/" +
        _toString(totalSize) +
        ", updateAt= " +
        _toString(updateAt);
  }

  String _toString(dynamic object) {
    if (object != null)
      return object.toString();
    else
      return "";
  }

  static FileData fromJson(Map<String, dynamic> json) {
    var updateAt = json['updateAt'];
    if (updateAt.runtimeType == double) updateAt = updateAt.toInt();
    var lastModified = json['lastModified'];
    if (lastModified == null) lastModified = 0;
    if (lastModified.runtimeType == double) lastModified = lastModified.toInt();
    var staffId = -1;
    var personal = json['personal'];
    if (personal != "" && personal != null) {
      if (personal.runtimeType == String) {
        staffId = int.parse(personal);
      } else
        staffId = personal;
    }
    var _oldRelativePath = json['oldUri'];
    if (_oldRelativePath == null) _oldRelativePath = "";
    var newfname = json['filename'];
    try {
      var client = json['client'];

      return new FileData(
        null,
        DateTime.fromMillisecondsSinceEpoch(lastModified, isUtc: true),
        json['available'],
        json['totalSize'],
        relativePath: json['uri'],
        client: client,
        uploadBy: json['uploadBy'],
        status: json['status'],
        id: json['id'],
        firm: json['firm'],
        staffId: staffId,
        updateAt: DateTime.fromMillisecondsSinceEpoch(updateAt, isUtc: true),
        category: json['category'],
        oldRelativePath: _oldRelativePath,
        newFilename: newfname,
      );
    } catch (e, stackTrace) {
      print(stackTrace);
      Log.write(
          'Failed to parse file, invalid data. ' +
              e.toString() +
              "..." +
              json.toString(),
          tag: 'FileData',
          type: eLogType.ERROR);
      return null;
    }
  }

  Future<Map> toJson() async {
    return {
      'id': id,
      'uri': relativePath,
      'oldUri': oldRelativePath,
      'lastModified': lastModified.millisecondsSinceEpoch,
      'available': available,
      'totalSize': totalSize,
      'client': await client != null && await client >= 0 ? _client : null,
      'uploadBy': uploadBy,
      'firm': await firm >= 0 ? _firm : null,
      'status': status,
      'personal': staffId >= 0 ? staffId : null,
      'updateAt': updateAt.millisecondsSinceEpoch,
      'category': category,
    };
  }

  /// create file date base from fikesystem
  /// @overrideUpdateAt: true if set the updateAt to now
  static Future<FileData> fromFileSystem(FileSystemEntity file,
      {bool overrideUpdateAt = false}) async {
    var stat = await file.stat();
    var relativeP = FileSyncUtil.getRelativePath(file.path);
    var isDirectory = file is Directory;
    var category = "";
    if (isDirectory) category = "folder";
    var modified = stat.modified.toUtc();
    var updateAt = stat.accessed.toUtc();
    if (overrideUpdateAt) updateAt = DateTime.now().toUtc();
    var status = 'visible';
    var result = new FileData(file.uri, modified, stat.size, stat.size,
        relativePath: relativeP,
        category: category,
        status: status,
        updateAt: updateAt);
    return result;
  }

  // create file data from a valid path
  static Future<FileData> fromLocalPath(String path,
      {bool overrideUpdateAt = false}) {
    return fromLocalUri(Uri.file(path), overrideUpdateAt: overrideUpdateAt);
  }

  static Future<FileData> fromLocalUri(Uri uri,
      {bool overrideUpdateAt = false}) async {
    return FileData.fromFileSystem(
        await LocalFileDirectory.fileSystemFromUri(uri),
        overrideUpdateAt: overrideUpdateAt);
  }
}
