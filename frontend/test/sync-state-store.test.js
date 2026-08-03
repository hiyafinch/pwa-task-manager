// Generated with Claude Code - CS 3660 Sprint 3
import { test } from "node:test";
import assert from "node:assert/strict";
import { SyncStateStore } from "../src/core/sync-state-store.js";

test("subscribers are notified on setState", () => {
  const store = new SyncStateStore();
  const seen = [];
  store.subscribe((state) => seen.push(state.status));
  store.setState({ status: "syncing" });
  store.setState({ status: "synced" });
  assert.deepEqual(seen, ["syncing", "synced"]);
});

test("unsubscribe stops further notifications", () => {
  const store = new SyncStateStore();
  const seen = [];
  const unsubscribe = store.subscribe((state) => seen.push(state.status));
  store.setState({ status: "syncing" });
  unsubscribe();
  store.setState({ status: "synced" });
  assert.deepEqual(seen, ["syncing"]);
});

test("two independent subscribers both receive the same transition", () => {
  const store = new SyncStateStore();
  const a = [];
  const b = [];
  store.subscribe((s) => a.push(s.status));
  store.subscribe((s) => b.push(s.status));
  store.setState({ status: "offline" });
  assert.deepEqual(a, ["offline"]);
  assert.deepEqual(b, ["offline"]);
});
