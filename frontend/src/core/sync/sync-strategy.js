// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Strategy (GoF), second use - requestSync() and onConnectivityChange()
// are the whole interface. Selecting the wrong one means data loss, not just a
// different output format, which is what makes this Strategy use load-bearing.
export class SyncStrategy {
  requestSync(_replayer) {
    throw new Error("not implemented");
  }
  onConnectivityChange(_callback) {
    throw new Error("not implemented");
  }
  stop() {}
}
