// Generated with Claude Code - CS 3660 Sprint 3
// Structured JSON logs to the console plus a buffered copy in the IndexedDB
// logs store, capped at the most recent 500 entries. Shipping these to
// POST /api/logs is cut for the four day scope (plan Section 0.1.2); the
// store is demoable directly in DevTools, Application, IndexedDB.
const MAX_ENTRIES = 500;

export class Logger {
  constructor(dbPromise = null) {
    this.dbPromise = dbPromise;
  }

  async write(level, payload) {
    const line = { ts: new Date().toISOString(), level, ...payload };
    console.log(JSON.stringify(line));
    if (!this.dbPromise) return;
    try {
      const db = await this.dbPromise;
      await db.add("logs", line);
      const count = await db.count("logs");
      if (count > MAX_ENTRIES) {
        const keys = await db.getAllKeys("logs");
        const toTrim = keys.slice(0, count - MAX_ENTRIES);
        const tx = db.transaction("logs", "readwrite");
        await Promise.all(toTrim.map((key) => tx.store.delete(key)));
        await tx.done;
      }
    } catch {
      // Logging must never throw and break the caller.
    }
  }

  info(payload) {
    return this.write("info", payload);
  }

  warn(payload) {
    return this.write("warn", payload);
  }

  error(payload) {
    return this.write("error", payload);
  }
}
