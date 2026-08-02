// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Strategy (GoF) - swappable local storage backends
/**
 * @typedef {Object} StorageStrategy
 * @property {(id: string) => Promise<object|undefined>} get
 * @property {(record: object) => Promise<object>} put
 * @property {(id: string) => Promise<void>} delete
 * @property {() => Promise<object[]>} list
 * @property {() => Promise<void>} clear
 */

/**
 * Every concrete strategy (IdbStorage, MemoryStorage) must implement this
 * shape. The contract test suite in test/storage-strategy.contract.test.js
 * runs identically against both, which is what makes this pattern real
 * rather than decorative.
 */
export class StorageStrategy {
  async get(_id) {
    throw new Error("not implemented");
  }
  async put(_record) {
    throw new Error("not implemented");
  }
  async delete(_id) {
    throw new Error("not implemented");
  }
  async list() {
    throw new Error("not implemented");
  }
  async clear() {
    throw new Error("not implemented");
  }
}
