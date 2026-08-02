// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Repository (GoF, bonus) - all task SQL lives only here
export class TaskRepository {
  constructor(db) {
    this.db = db;
  }

  findById(userId, id) {
    const row = this.db
      .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
      .get(id, userId);
    return row ? toTask(row) : null;
  }

  listSince(userId, since) {
    const rows = since
      ? this.db
          .prepare("SELECT * FROM tasks WHERE user_id = ? AND updated_at > ? ORDER BY updated_at ASC")
          .all(userId, since)
      : this.db
          .prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY updated_at ASC")
          .all(userId);
    return rows.map(toTask);
  }

  upsert(userId, task) {
    this.db
      .prepare(
        `INSERT INTO tasks (id, user_id, title, notes, completed, created_at, updated_at, deleted_at)
         VALUES (@id, @userId, @title, @notes, @completed, @createdAt, @updatedAt, @deletedAt)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           notes = excluded.notes,
           completed = excluded.completed,
           updated_at = excluded.updated_at,
           deleted_at = excluded.deleted_at`
      )
      .run({
        id: task.id,
        userId,
        title: task.title,
        notes: task.notes ?? "",
        completed: task.completed ? 1 : 0,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        deletedAt: task.deletedAt ?? null,
      });
    return this.findById(userId, task.id);
  }

  findMutation(mutationId, userId) {
    return this.db
      .prepare("SELECT * FROM applied_mutations WHERE mutation_id = ? AND user_id = ?")
      .get(mutationId, userId);
  }

  recordMutation(mutationId, userId, taskId, responseBody) {
    this.db
      .prepare(
        "INSERT INTO applied_mutations (mutation_id, user_id, task_id, response_json, applied_at) VALUES (?, ?, ?, ?, ?)"
      )
      .run(mutationId, userId, taskId, JSON.stringify(responseBody), new Date().toISOString());
  }
}

function toTask(row) {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    completed: !!row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}
