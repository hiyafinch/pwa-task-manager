// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Dead Letter Channel (EIP) - mutations that exhaust retries or fail
// permanently move here with a reason, plus a requeue path
export class DeadLetterChannel {
  constructor(dbPromise, logger = console) {
    this.dbPromise = dbPromise;
    this.logger = logger;
  }

  async send(mutation, reason) {
    const db = await this.dbPromise;
    const record = { ...mutation, failedAt: new Date().toISOString(), reason };
    const tx = db.transaction(["outbox", "deadLetter"], "readwrite");
    await Promise.all([
      tx.objectStore("deadLetter").put(record),
      tx.objectStore("outbox").delete(mutation.mutationId),
      tx.done,
    ]);
    const payload = { event: "sync.deadlettered", mutationId: mutation.mutationId, reason };
    if (typeof this.logger.warn === "function") {
      this.logger.warn(payload);
    } else {
      console.warn(JSON.stringify(payload));
    }
  }

  async requeue(mutationId) {
    const db = await this.dbPromise;
    const record = await db.get("deadLetter", mutationId);
    if (!record) return null;
    const { failedAt, reason, ...mutation } = record;
    mutation.attempts = 0;
    mutation.status = "pending";
    mutation.lastError = null;
    const tx = db.transaction(["outbox", "deadLetter"], "readwrite");
    await Promise.all([
      tx.objectStore("outbox").put(mutation),
      tx.objectStore("deadLetter").delete(mutationId),
      tx.done,
    ]);
    return mutation;
  }

  async list() {
    const db = await this.dbPromise;
    return db.getAllFromIndex("deadLetter", "by-failedAt");
  }
}
