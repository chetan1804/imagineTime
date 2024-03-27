import 'package:sqflite_common/sqlite_api.dart' as sqlapi;

class ToggleInterface {
  bool _isOn = true;
  bool _cancelled = false;
  bool get cancelled => _cancelled;
  bool get isDirty => _isOn != _isOnInit;
  bool _isOnInit = true;

  bool get isOn => _isOn;
  set isOn(bool value) => _isOn = value;

  ToggleInterface(bool isOn) {
    _isOn = isOn;
    _isOnInit = isOn;
  }

  Future cancel() {
    _cancelled = true;
  }

  Future batchCommit(sqlapi.Batch batch) {}
}
