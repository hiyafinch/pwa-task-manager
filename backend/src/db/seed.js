// Generated with Claude Code - CS 3660 Sprint 3
import { createHash } from "node:crypto";

// Fixed id so the Phase 1 auth stub (ctx.state.user = { id: "demo-user" }) and the
// real JWT "sub" claim minted in Phase 2 both resolve to the same seeded row.
export const DEMO_USER_ID = "demo-user";

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

export function seedDemoUser(db) {
  const email = process.env.SEED_USER_EMAIL ?? "demo@example.com";
  const password = process.env.SEED_USER_PASSWORD ?? "Sprint3Demo!";
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return existing.id;

  const id = DEMO_USER_ID;
  db.prepare(
    "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)"
  ).run(id, email, hashPassword(password), new Date().toISOString());
  console.log(JSON.stringify({ event: "seed.user", email }));
  return id;
}

export { hashPassword };
