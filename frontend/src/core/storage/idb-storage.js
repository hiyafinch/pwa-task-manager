// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Strategy (GoF) - concrete IndexedDB backend via the idb wrapper
export class IdbStorage {
  constructor(dbPromise, storeName = "tasks") {
    this.dbPromise = dbPromise;
    this.storeName = storeName;
  }

  async get(id) {
    const db = await this.dbPromise;
    return db.get(this.storeName, id);
  }

  async put(record) {
    const db = await this.dbPromise;
    await db.put(this.storeName, record);
    return record;
  }

  async delete(id) {
    const db = await this.dbPromise;
    await db.delete(this.storeName, id);
  }

  async list() {
    const db = await this.dbPromise;
    return db.getAll(this.storeName);
  }

  async clear() {
    const db = await this.dbPromise;
    await db.clear(this.storeName);
  }
}
