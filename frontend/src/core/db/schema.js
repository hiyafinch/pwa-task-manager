// Generated with Claude Code - CS 3660 Sprint 3
import { openDB } from "idb";

export const DB_NAME = "pwa-task-manager";
export const DB_VERSION = 1;

export function upgradeTaskDb(db) {
  const tasks = db.createObjectStore("tasks", { keyPath: "id" });
  tasks.createIndex("by-updatedAt", "updatedAt");
  tasks.createIndex("by-syncStatus", "syncStatus");

  const outbox = db.createObjectStore("outbox", { keyPath: "mutationId" });
  outbox.createIndex("by-seq", "seq", { unique: true });
  outbox.createIndex("by-status", "status");

  const dlq = db.createObjectStore("deadLetter", { keyPath: "mutationId" });
  dlq.createIndex("by-failedAt", "failedAt");

  db.createObjectStore("meta", { keyPath: "key" });

  const logs = db.createObjectStore("logs", { keyPath: "id", autoIncrement: true });
  logs.createIndex("by-ts", "ts");
}

export function openTaskDb(name = DB_NAME) {
  return openDB(name, DB_VERSION, { upgrade: upgradeTaskDb });
}
