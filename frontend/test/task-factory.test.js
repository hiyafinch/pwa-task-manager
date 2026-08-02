// Generated with Claude Code - CS 3660 Sprint 3
import { test } from "node:test";
import assert from "node:assert/strict";
import { TaskFactory } from "../src/core/task-factory.js";

test("create() produces a fully populated pending task", () => {
  const task = TaskFactory.create({ title: "Buy milk" });
  assert.ok(task.id);
  assert.equal(task.title, "Buy milk");
  assert.equal(task.completed, false);
  assert.equal(task.deletedAt, null);
  assert.equal(task.syncStatus, "pending");
  assert.equal(task.createdAt, task.updatedAt);
});

test("fromServer() marks the record as synced and keeps server timestamps", () => {
  const dto = { id: "1", title: "x", notes: "n", completed: true, createdAt: "a", updatedAt: "b", deletedAt: null };
  const task = TaskFactory.fromServer(dto);
  assert.equal(task.syncStatus, "synced");
  assert.equal(task.updatedAt, "b");
});

test("fromQueueReplay() patches an existing record and marks it pending again", () => {
  const existing = TaskFactory.create({ title: "x" });
  const patched = TaskFactory.fromQueueReplay(existing, { completed: true });
  assert.equal(patched.id, existing.id);
  assert.equal(patched.completed, true);
  assert.equal(patched.syncStatus, "pending");
});
