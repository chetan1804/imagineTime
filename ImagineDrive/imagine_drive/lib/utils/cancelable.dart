class Cancellable {
  bool cancelled = false;

  void cancel() {
    cancelled = true;
  }
}
