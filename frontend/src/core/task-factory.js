// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Factory Method (GoF) - the only place a task literal is constructed
function baseTask({ id, title, notes = "", completed = false, createdAt, updatedAt, deletedAt = null, syncStatus = "pending" }) {
  return { id, title, notes, completed, createdAt, updatedAt, deletedAt, syncStatus };
}

export const TaskFactory = {
  create({ title, notes = "" }) {
    const now = new Date().toISOString();
    return baseTask({
      id: crypto.randomUUID(),
      title,
      notes,
      createdAt: now,
      updatedAt: now,
      syncStatus: "pending",
    });
  },

  fromServer(dto) {
    return baseTask({
      id: dto.id,
      title: dto.title,
      notes: dto.notes ?? "",
      completed: dto.completed,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt ?? null,
      syncStatus: "synced",
    });
  },

  fromQueueReplay(existing, patch) {
    return baseTask({
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: patch.updatedAt ?? new Date().toISOString(),
      syncStatus: "pending",
    });
  },
};
