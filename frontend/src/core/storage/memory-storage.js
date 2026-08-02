// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Strategy (GoF) - concrete in-memory backend, used by tests and as a
// fallback when indexedDB is unavailable
export class MemoryStorage {
  constructor() {
    this.map = new Map();
  }

  async get(id) {
    return this.map.get(id);
  }

  async put(record) {
    this.map.set(record.id, record);
    return record;
  }

  async delete(id) {
    this.map.delete(id);
  }

  async list() {
    return Array.from(this.map.values());
  }

  async clear() {
    this.map.clear();
  }
}
