// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Observer (GoF) - subject with subscribe and notify. sync-status-banner
// and task-list both react to state changes with no coupling between them.
export class SyncStateStore {
  constructor() {
    this.state = { status: "idle", pendingCount: 0, lastSyncAt: null };
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(patch) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener(this.state);
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
