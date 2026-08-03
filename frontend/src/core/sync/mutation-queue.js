// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Message Queue (EIP) - durable FIFO outbox in IndexedDB, ordered by
// a monotonic seq assigned in the same transaction as the write
export class MutationQueue {
  constructor(dbPromise) {
    this.dbPromise = dbPromise;
  }

  async nextSeq(tx) {
    const metaStore = tx.objectStore("meta");
    const current = (await metaStore.get("nextSeq"))?.value ?? 0;
    const next = current + 1;
    await metaStore.put({ key: "nextSeq", value: next });
    return next;
  }

  async enqueue(mutation) {
    const db = await this.dbPromise;
    const tx = db.transaction(["outbox", "meta"], "readwrite");
    const seq = await this.nextSeq(tx);
    const record = {
      ...mutation,
      seq,
      attempts: 0,
      lastError: null,
      status: "pending",
      enqueuedAt: new Date().toISOString(),
    };
    await tx.objectStore("outbox").put(record);
    await tx.done;
    return record;
  }

  async listPending() {
    const db = await this.dbPromise;
    const all = await db.getAllFromIndex("outbox", "by-seq");
    return all.filter((m) => m.status !== "inflight-done");
  }

  async markInflight(mutationId) {
    const db = await this.dbPromise;
    const record = await db.get("outbox", mutationId);
    if (!record) return;
    record.status = "inflight";
    await db.put("outbox", record);
  }

  async markFailed(mutationId, error) {
    const db = await this.dbPromise;
    const record = await db.get("outbox", mutationId);
    if (!record) return;
    record.status = "failed";
    record.attempts += 1;
    record.lastError = String(error?.message ?? error);
    await db.put("outbox", record);
    return record;
  }

  async remove(mutationId) {
    const db = await this.dbPromise;
    await db.delete("outbox", mutationId);
  }

  async count() {
    const db = await this.dbPromise;
    return db.count("outbox");
  }
}
