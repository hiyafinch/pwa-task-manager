// Generated with Claude Code - CS 3660 Sprint 3
import Database from "better-sqlite3";
import { createApp } from "../../src/app.js";

export function buildTestApp() {
  const db = new Database(":memory:");
  const app = createApp({ db });
  return { app, db };
}
