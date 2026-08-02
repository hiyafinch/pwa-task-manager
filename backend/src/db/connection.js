// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Singleton (GoF) - one better-sqlite3 handle shared by the process
import Database from "better-sqlite3";

let instance = null;

export function getConnection() {
  if (instance) return instance;
  const path = process.env.DATABASE_PATH ?? "./data.sqlite";
  instance = new Database(path);
  instance.pragma("journal_mode = WAL");
  return instance;
}

export function resetConnectionForTests() {
  if (instance) {
    instance.close();
    instance = null;
  }
}
