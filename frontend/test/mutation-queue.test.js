// Generated with Claude Code - CS 3660 Sprint 3
import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { openTaskDb } from "../src/core/db/schema.js";
import { MutationQueue } from "../src/core/sync/mutation-queue.js";

function freshQueue() {
  const dbPromise = openTaskDb(`queue-test-${Math.random()}`);
  return new MutationQueue(dbPromise);
}

test("enqueue assigns a monotonic seq", async () => {
  const queue = freshQueue();
  const a = await queue.enqueue({ mutationId: "a", type: "create", taskId: "1", payload: {} });
  const b = await queue.enqueue({ mutationId: "b", type: "create", taskId: "2", payload: {} });
  assert.equal(b.seq, a.seq + 1);
});

test("listPending returns mutations ordered by seq", async () => {
  const queue = freshQueue();
  await queue.enqueue({ mutationId: "a", type: "create", taskId: "1", payload: {} });
  await queue.enqueue({ mutationId: "b", type: "create", taskId: "2", payload: {} });
  await queue.enqueue({ mutationId: "c", type: "create", taskId: "3", payload: {} });
  const pending = await queue.listPending();
  assert.deepEqual(pending.map((m) => m.mutationId), ["a", "b", "c"]);
});

test("remove deletes a mutation from the outbox", async () => {
  const queue = freshQueue();
  await queue.enqueue({ mutationId: "a", type: "create", taskId: "1", payload: {} });
  await queue.remove("a");
  assert.equal(await queue.count(), 0);
});

test("markFailed increments attempts and records the error", async () => {
  const queue = freshQueue();
  await queue.enqueue({ mutationId: "a", type: "create", taskId: "1", payload: {} });
  const failed = await queue.markFailed("a", new Error("network down"));
  assert.equal(failed.attempts, 1);
  assert.equal(failed.status, "failed");
  assert.equal(failed.lastError, "network down");
});
