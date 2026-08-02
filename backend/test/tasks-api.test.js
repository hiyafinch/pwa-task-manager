// Generated with Claude Code - CS 3660 Sprint 3
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTestApp } from "./helpers/test-app.js";
import http from "node:http";

async function request(app, method, path, { body, headers = {} } = {}) {
  const server = http.createServer(app.callback());
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  await new Promise((resolve) => server.close(resolve));
  return { status: res.status, body: json };
}

async function loginToken(app) {
  const res = await request(app, "POST", "/auth/login", {
    body: { email: "demo@example.com", password: "Sprint3Demo!" },
  });
  return res.body.accessToken;
}

test("GET /api/tasks without a bearer token returns 401", async () => {
  const { app } = buildTestApp();
  const res = await request(app, "GET", "/api/tasks");
  assert.equal(res.status, 401);
});

test("create, then PUT with an older updatedAt keeps server version", async () => {
  const { app } = buildTestApp();
  const token = await loginToken(app);
  const authHeaders = { Authorization: `Bearer ${token}` };
  const task = { id: "t1", title: "original", createdAt: "2026-01-02T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" };
  const created = await request(app, "POST", "/api/tasks", { body: task, headers: { "Idempotency-Key": "k1", ...authHeaders } });
  assert.equal(created.status, 201);

  const older = await request(app, "PUT", "/api/tasks/t1", {
    body: { title: "stale edit", updatedAt: "2026-01-01T00:00:00.000Z" },
    headers: { "Idempotency-Key": "k2", ...authHeaders },
  });
  assert.equal(older.body.resolution, "server_won");
  assert.equal(older.body.task.title, "original");
});

test("PUT with a newer updatedAt wins as client_won", async () => {
  const { app } = buildTestApp();
  const token = await loginToken(app);
  const authHeaders = { Authorization: `Bearer ${token}` };
  const task = { id: "t2", title: "original", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
  await request(app, "POST", "/api/tasks", { body: task, headers: { "Idempotency-Key": "k3", ...authHeaders } });

  const newer = await request(app, "PUT", "/api/tasks/t2", {
    body: { title: "fresh edit", updatedAt: "2026-01-03T00:00:00.000Z" },
    headers: { "Idempotency-Key": "k4", ...authHeaders },
  });
  assert.equal(newer.body.resolution, "client_won");
  assert.equal(newer.body.task.title, "fresh edit");
});

test("delete is a soft delete with a tombstone timestamp", async () => {
  const { app } = buildTestApp();
  const token = await loginToken(app);
  const authHeaders = { Authorization: `Bearer ${token}` };
  const task = { id: "t3", title: "to delete", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
  await request(app, "POST", "/api/tasks", { body: task, headers: { "Idempotency-Key": "k5", ...authHeaders } });

  const deleted = await request(app, "DELETE", "/api/tasks/t3", {
    body: { updatedAt: "2026-01-04T00:00:00.000Z" },
    headers: { "Idempotency-Key": "k6", ...authHeaders },
  });
  assert.ok(deleted.body.task.deletedAt);
});

test("GET /api/tasks?since filters to tasks updated after the given time", async () => {
  const { app } = buildTestApp();
  const token = await loginToken(app);
  const authHeaders = { Authorization: `Bearer ${token}` };
  await request(app, "POST", "/api/tasks", {
    body: { id: "t4", title: "old", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
    headers: { "Idempotency-Key": "k7", ...authHeaders },
  });
  await request(app, "POST", "/api/tasks", {
    body: { id: "t5", title: "new", createdAt: "2026-01-05T00:00:00.000Z", updatedAt: "2026-01-05T00:00:00.000Z" },
    headers: { "Idempotency-Key": "k8", ...authHeaders },
  });

  const res = await request(app, "GET", "/api/tasks?since=2026-01-02T00:00:00.000Z", { headers: authHeaders });
  assert.equal(res.body.tasks.length, 1);
  assert.equal(res.body.tasks[0].id, "t5");
});
