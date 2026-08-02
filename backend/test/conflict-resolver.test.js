// Generated with Claude Code - CS 3660 Sprint 3
import { test } from "node:test";
import assert from "node:assert/strict";
import { lastWriteWins } from "../src/services/conflict-resolver.js";

test("no existing record: incoming wins as created", () => {
  const result = lastWriteWins.resolve({ id: "1", updatedAt: "2026-01-01T00:00:00.000Z" }, null);
  assert.equal(result.resolution, "created");
});

test("incoming newer than existing: client_won", () => {
  const existing = { id: "1", updatedAt: "2026-01-01T00:00:00.000Z" };
  const incoming = { id: "1", updatedAt: "2026-01-02T00:00:00.000Z" };
  const result = lastWriteWins.resolve(incoming, existing);
  assert.equal(result.resolution, "client_won");
  assert.deepEqual(result.winner, incoming);
});

test("incoming older than existing: server_won", () => {
  const existing = { id: "1", updatedAt: "2026-01-02T00:00:00.000Z" };
  const incoming = { id: "1", updatedAt: "2026-01-01T00:00:00.000Z" };
  const result = lastWriteWins.resolve(incoming, existing);
  assert.equal(result.resolution, "server_won");
  assert.deepEqual(result.winner, existing);
});

test("equal timestamps: server keeps its own version", () => {
  const ts = "2026-01-01T00:00:00.000Z";
  const existing = { id: "1", updatedAt: ts, title: "server" };
  const incoming = { id: "1", updatedAt: ts, title: "client" };
  const result = lastWriteWins.resolve(incoming, existing);
  assert.equal(result.resolution, "server_won");
  assert.equal(result.winner.title, "server");
});

test("tombstone with later timestamp beats a live update", () => {
  const existing = { id: "1", updatedAt: "2026-01-01T00:00:00.000Z", deletedAt: null };
  const incoming = { id: "1", updatedAt: "2026-01-02T00:00:00.000Z", deletedAt: "2026-01-02T00:00:00.000Z" };
  const result = lastWriteWins.resolve(incoming, existing);
  assert.equal(result.resolution, "client_won");
  assert.ok(result.winner.deletedAt);
});

test("update for a missing id behaves as a create (upsert)", () => {
  const incoming = { id: "does-not-exist", updatedAt: "2026-01-01T00:00:00.000Z" };
  const result = lastWriteWins.resolve(incoming, null);
  assert.equal(result.resolution, "created");
});

test("100 shuffled mutations converge to the max timestamp regardless of order", () => {
  const base = Date.parse("2026-01-01T00:00:00.000Z");
  const mutations = Array.from({ length: 100 }, (_, i) => ({
    id: "1",
    updatedAt: new Date(base + i * 1000).toISOString(),
    seq: i,
  }));
  for (let i = mutations.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mutations[i], mutations[j]] = [mutations[j], mutations[i]];
  }
  let existing = null;
  for (const m of mutations) {
    const result = lastWriteWins.resolve(m, existing);
    existing = result.winner;
  }
  const maxTimestamp = mutations.reduce((max, m) => (m.updatedAt > max ? m.updatedAt : max), mutations[0].updatedAt);
  assert.equal(existing.updatedAt, maxTimestamp);
});
