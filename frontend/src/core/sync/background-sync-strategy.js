// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Strategy (GoF) concrete - Background Sync API. The browser owns the
// retry schedule; this strategy only registers the tag and reacts to online.
import { config } from "../config.js";

export class BackgroundSyncStrategy {
  constructor(registration) {
    this.registration = registration;
  }

  async requestSync() {
    try {
      await this.registration.sync.register(config.syncTag);
    } catch (err) {
      console.log(JSON.stringify({ event: "sync.register.failed", message: err.message }));
    }
  }

  onConnectivityChange(callback) {
    window.addEventListener("online", () => callback(true));
    window.addEventListener("offline", () => callback(false));
  }
}
