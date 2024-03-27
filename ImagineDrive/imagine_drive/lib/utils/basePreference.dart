import 'dart:convert';
import 'dart:developer';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:imagine_drive/utils/log.dart';

/*
  BasePreference.dart
  Base class for serializing dictionary
*/
class BasePreference {
  static const DELAY_SAVE_TIME = 3; // seconds
  static const MICROTOSECONDS = 1000000;
  Map<String, dynamic> _dictionary;
  File file;
  bool _saveCancelled = false;
  bool _saving = false;

  Map<String, dynamic> get dictionary => _dictionary;

  BasePreference({@required String path}) {
    var uri = Uri.file(path);
    file = File.fromUri(uri);
  }

  Future initialize() async {
    if (await file.exists()) {
      var json = file.readAsStringSync();
      try {
        _dictionary = jsonDecode(json);
        return;
      } catch (e) {}
    }
    _dictionary = Map<String, dynamic>();
  }

  String getString(String key) {
    return _dictionary[key];
  }

  int getInt(String key, {int defaultV}) {
    if (_dictionary.containsKey(key))
      return _dictionary[key];
    else
      return defaultV;
  }

  double getDouble(String key) {
    return _dictionary[key];
  }

  dynamic getObject(String key, {dynamic defaultValue}) {
    var val = _dictionary[key];
    if (val != null)
      return val;
    else
      return defaultValue;
  }

  void setString(String key, String value) {
    _dictionary[key] = value;
    _delaySaveAll();
  }

  bool hasKey(String key) {
    return _dictionary.containsKey(key);
  }

  void setInt(String key, int value) {
    _dictionary[key] = value;
    _delaySaveAll();
  }

  void setDouble(String key, double value) {
    _dictionary[key] = value;
    _delaySaveAll();
  }

  void setObject(String key, dynamic value) {
    _dictionary[key] = value;
    _delaySaveAll();
  }

  void clearAll() {
    _delaySaveAll();
  }

  Future _delaySaveAll() async {
    // wait for other cancel saving
    _saveCancelled = true;
    while (_saving) {
      await Future.delayed(Duration(seconds: 1));
    }

    _saving = true;
    _saveCancelled = false;
    var elapsed = Timeline.now;
    // delay saving. others might also update the file.
    // also check if saving was cancelled
    while (Timeline.now - elapsed < DELAY_SAVE_TIME * MICROTOSECONDS &&
        !_saveCancelled) {
      await Future.delayed(Duration(milliseconds: 200));
    }
    if (!_saveCancelled) await saveAll();
    _saving = false;
  }

  Future saveAll() async {
    if (file == null) return;
    Log.write('Preference saved',
        tag: 'BasePreference', type: eLogType.VERBOSE);
    _saveCancelled = true; // cancel any further saving requests
    return file.writeAsString(jsonEncode(_dictionary));
  }

  void close() {
    file = null;
  }
}
