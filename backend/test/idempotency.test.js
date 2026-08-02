// Generated with Claude Code - CS 3660 Sprint 3
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTestApp } from "./helpers/test-app.js";

async function request(app, method, path, { body, headers = {} } = {}) {
  const callback = app.callback();
  const http = await import("node:http");
  const server = http.createServer(callback);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  await new Promise((resolve) => server.close(resolve));
  return { status: res.status, headers: res.headers, body: json };
}

test("missing Idempotency-Key on a write returns 400", async () => {
  const { app } = buildTestApp();
  const res = await request(app, "POST", "/api/tasks", { body: { id: "a", title: "x" } });
  assert.equal(res.status, 400);
});

test("replaying the same POST with the same Idempotency-Key does not create a duplicate", async () => {
  const { app, db } = buildTestApp();
  const task = { id: "task-1", title: "Buy milk", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
  const headers = { "Idempotency-Key": "mut-1" };

  const first = await request(app, "POST", "/api/tasks", { body: task, headers });
  assert.equal(first.status, 201);

  const second = await request(app, "POST", "/api/tasks", { body: task, headers });
  assert.equal(second.status, 201);
  assert.equal(second.headers.get("idempotent-replay"), "true");
  assert.deepEqual(second.body, first.body);

  const count = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE id = ?").get("task-1").c;
  assert.equal(count, 1);
});
