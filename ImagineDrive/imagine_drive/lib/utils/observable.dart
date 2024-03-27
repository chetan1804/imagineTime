import 'callback.dart';

class Observable<T> {
  Callback<T> _onValueChanged;
  Callback<T> get onValueChanged {
    if (_onValueChanged == null) _onValueChanged = new Callback<T>();
    return _onValueChanged;
  }

  T _value;

  Observable({T initValue}) {
    _value = initValue;
  }

  T get value => _value;
  set value(T pVal) {
    _value = pVal;
    onValueChanged(_value);
  }

  void listen(Function(T) call) {
    onValueChanged.add(call);
  }

  void unlisten(Function(T) call) {
    onValueChanged.remove(call);
  }
}
