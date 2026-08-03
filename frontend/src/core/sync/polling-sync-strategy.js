// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Strategy (GoF) concrete - used when Background Sync is unsupported
// (Firefox, Safari). Polls navigator.onLine and retries the identical replayer.
import { config } from "../config.js";

export class PollingSyncStrategy {
  constructor() {
    this.timer = null;
  }

  requestSync(replayer) {
    replayer.replayAll();
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (navigator.onLine) replayer.replayAll();
    }, config.pollIntervalMs);
  }

  onConnectivityChange(callback) {
    window.addEventListener("online", () => callback(true));
    window.addEventListener("offline", () => callback(false));
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
