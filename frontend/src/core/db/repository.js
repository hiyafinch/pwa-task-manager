// Generated with Claude Code - CS 3660 Sprint 3
// Reads and writes tasks over a StorageStrategy. The UI never touches the
// strategy directly, which keeps the Strategy swap in main.js a one-line change.
export class TaskLocalRepository {
  constructor(storage) {
    this.storage = storage;
  }

  async list() {
    const all = await this.storage.list();
    return all
      .filter((t) => !t.deletedAt)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async get(id) {
    return this.storage.get(id);
  }

  async save(task) {
    return this.storage.put(task);
  }

  async remove(id) {
    return this.storage.delete(id);
  }

  async replaceAll(tasks) {
    await this.storage.clear();
    for (const task of tasks) {
      await this.storage.put(task);
    }
  }
}
