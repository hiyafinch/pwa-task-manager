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

test("login with the seeded demo user returns an access token", async () => {
  const { app } = buildTestApp();
  const res = await request(app, "POST", "/auth/login", {
    body: { email: "demo@example.com", password: "Sprint3Demo!" },
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.accessToken);
  assert.equal(res.body.expiresIn, 28800);
});

test("login with a wrong password returns 401", async () => {
  const { app } = buildTestApp();
  const res = await request(app, "POST", "/auth/login", {
    body: { email: "demo@example.com", password: "wrong" },
  });
  assert.equal(res.status, 401);
});

test("a valid bearer token grants access to /api/tasks", async () => {
  const { app } = buildTestApp();
  const login = await request(app, "POST", "/auth/login", {
    body: { email: "demo@example.com", password: "Sprint3Demo!" },
  });
  const res = await request(app, "GET", "/api/tasks", {
    headers: { Authorization: `Bearer ${login.body.accessToken}` },
  });
  assert.equal(res.status, 200);
});

test("GET /.well-known/jwks.json returns the current public key", async () => {
  const { app } = buildTestApp();
  const res = await request(app, "GET", "/.well-known/jwks.json");
  assert.equal(res.status, 200);
  assert.equal(res.body.keys.length, 1);
  assert.equal(res.body.keys[0].kid, "test-key");
});
