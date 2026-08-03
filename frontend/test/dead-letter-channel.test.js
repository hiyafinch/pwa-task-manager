// Generated with Claude Code - CS 3660 Sprint 3
import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { openTaskDb } from "../src/core/db/schema.js";
import { MutationQueue } from "../src/core/sync/mutation-queue.js";
import { DeadLetterChannel } from "../src/core/sync/dead-letter-channel.js";

function fresh() {
  const dbPromise = openTaskDb(`dlq-test-${Math.random()}`);
  return { queue: new MutationQueue(dbPromise), deadLetter: new DeadLetterChannel(dbPromise, { warn() {} }) };
}

test("send moves a mutation from outbox to deadLetter with a reason", async () => {
  const { queue, deadLetter } = fresh();
  const mutation = await queue.enqueue({ mutationId: "a", type: "create", taskId: "1", payload: {} });
  await deadLetter.send(mutation, "max_attempts_exceeded");
  assert.equal(await queue.count(), 0);
  const entries = await deadLetter.list();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].reason, "max_attempts_exceeded");
});

test("requeue moves a dead lettered mutation back to the outbox with attempts reset", async () => {
  const { queue, deadLetter } = fresh();
  const mutation = await queue.enqueue({ mutationId: "a", type: "create", taskId: "1", payload: {} });
  await queue.markFailed("a", new Error("boom"));
  const failed = { ...mutation, attempts: 1, status: "failed", lastError: "boom" };
  await deadLetter.send(failed, "max_attempts_exceeded");

  const requeued = await deadLetter.requeue("a");
  assert.equal(requeued.attempts, 0);
  assert.equal(requeued.status, "pending");

  const pending = await queue.listPending();
  assert.equal(pending.length, 1);
  assert.equal(pending[0].mutationId, "a");
});
