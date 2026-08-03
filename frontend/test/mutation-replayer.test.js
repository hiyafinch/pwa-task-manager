// Generated with Claude Code - CS 3660 Sprint 3
import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { openTaskDb } from "../src/core/db/schema.js";
import { MutationQueue } from "../src/core/sync/mutation-queue.js";
import { DeadLetterChannel } from "../src/core/sync/dead-letter-channel.js";
import { MutationReplayer } from "../src/core/sync/mutation-replayer.js";
import { SyncStateStore } from "../src/core/sync-state-store.js";

function fresh(applyMutation) {
  const dbPromise = openTaskDb(`replayer-test-${Math.random()}`);
  const queue = new MutationQueue(dbPromise);
  const deadLetter = new DeadLetterChannel(dbPromise, { warn() {} });
  const syncState = new SyncStateStore();
  const apiClient = { applyMutation };
  const replayer = new MutationReplayer({ queue, deadLetter, apiClient, syncState, repository: null, logger: { info() {} } });
  return { queue, deadLetter, syncState, replayer };
}

test("a successful mutation is dequeued and the state store reflects synced", async () => {
  const { queue, replayer, syncState } = fresh(async () => ({ task: { id: "1" }, resolution: "created" }));
  await queue.enqueue({ mutationId: "a", type: "create", taskId: "1", payload: { updatedAt: "x" } });
  const result = await replayer.replayAll();
  assert.equal(result.synced, 1);
  assert.equal(await queue.count(), 0);
  assert.equal(syncState.getState().status, "synced");
});

test("a permanent failure (404) goes straight to the dead letter channel", async () => {
  const { queue, deadLetter, replayer } = fresh(async () => {
    const err = new Error("not found");
    err.status = 404;
    throw err;
  });
  await queue.enqueue({ mutationId: "a", type: "update", taskId: "1", payload: { updatedAt: "x" } });
  const result = await replayer.replayAll();
  assert.equal(result.deadLettered, 1);
  assert.equal(await queue.count(), 0);
  assert.equal((await deadLetter.list()).length, 1);
});

test("a retryable failure stops the run, preserving order of later mutations", async () => {
  let calls = 0;
  const { queue, replayer } = fresh(async () => {
    calls += 1;
    const err = new Error("service unavailable");
    err.status = 503;
    throw err;
  });
  await queue.enqueue({ mutationId: "a", type: "create", taskId: "1", payload: { updatedAt: "x" } });
  await queue.enqueue({ mutationId: "b", type: "create", taskId: "2", payload: { updatedAt: "y" } });
  await replayer.replayAll();
  assert.equal(calls, 1); // stopped after the first failure, did not attempt "b"
  const pending = await queue.listPending();
  assert.equal(pending.length, 2);
});

test("a mutation that exhausts MAX_ATTEMPTS (5) is dead lettered", async () => {
  const { queue, deadLetter, replayer } = fresh(async () => {
    const err = new Error("service unavailable");
    err.status = 503;
    throw err;
  });
  await queue.enqueue({ mutationId: "a", type: "create", taskId: "1", payload: { updatedAt: "x" } });
  for (let i = 0; i < 5; i++) {
    await replayer.replayAll();
  }
  assert.equal(await queue.count(), 0);
  const entries = await deadLetter.list();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].reason, "max_attempts_exceeded");
});
