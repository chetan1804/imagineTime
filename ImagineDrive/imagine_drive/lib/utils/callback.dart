class Callback<T> {
  List<Function(T)> callbacks = List.empty(growable: true);

  void call(T val) {
    for (var i = 0; i < callbacks.length; i++) {
      callbacks[i](val);
    }
  }

  void add(Function(T) pCall, {bool avoidDuplicate = true}) {
    if (pCall == null) return;
    if (avoidDuplicate && callbacks.contains(pCall)) return;
    callbacks.add(pCall);
  }

  void remove(Function(T) pCall) {
    if (pCall == null) return;
    callbacks.remove(pCall);
  }

  void clear() {
    callbacks.clear();
  }
}
