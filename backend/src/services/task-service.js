// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Facade (GoF, bonus, carried over from Sprint 1) - orchestrates repo + resolver + logs
export class TaskService {
  constructor(repository, resolver, logger) {
    this.repository = repository;
    this.resolver = resolver;
    this.logger = logger ?? console;
  }

  create(userId, task) {
    const existing = this.repository.findById(userId, task.id);
    const { winner, resolution } = this.resolver.resolve(task, existing);
    const saved = this.repository.upsert(userId, winner);
    this.logger.info?.({ event: "conflict.resolved", resolution, taskId: task.id });
    return { task: saved, resolution };
  }

  update(userId, id, patch) {
    const existing = this.repository.findById(userId, id);
    const incoming = { ...existing, ...patch, id };
    const { winner, resolution } = this.resolver.resolve(incoming, existing);
    const saved = this.repository.upsert(userId, winner);
    this.logger.info?.({ event: "conflict.resolved", resolution, taskId: id });
    return { task: saved, resolution };
  }

  delete(userId, id, updatedAt) {
    const existing = this.repository.findById(userId, id);
    const incoming = existing
      ? { ...existing, deletedAt: updatedAt, updatedAt }
      : { id, title: "", notes: "", completed: false, createdAt: updatedAt, updatedAt, deletedAt: updatedAt };
    const { winner, resolution } = this.resolver.resolve(incoming, existing);
    const saved = this.repository.upsert(userId, winner);
    this.logger.info?.({ event: "conflict.resolved", resolution, taskId: id });
    return { task: saved, resolution };
  }

  listSince(userId, since) {
    return this.repository.listSince(userId, since);
  }
}
