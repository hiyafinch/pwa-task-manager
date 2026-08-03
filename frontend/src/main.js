// Generated with Claude Code - CS 3660 Sprint 3
import "./components/task-app.js";
import { openTaskDb } from "./core/db/schema.js";
import { IdbStorage } from "./core/storage/idb-storage.js";
import { MemoryStorage } from "./core/storage/memory-storage.js";
import { TaskLocalRepository } from "./core/db/repository.js";
import { ApiClient } from "./core/api-client.js";
import { config } from "./core/config.js";

// PATTERN: Strategy (GoF) - runtime selection between IndexedDB and an
// in-memory fallback. Chosen once, at boot, by feature detection.
function selectStorage() {
  if (typeof indexedDB !== "undefined") {
    return new IdbStorage(openTaskDb());
  }
  return new MemoryStorage();
}

const storage = selectStorage();
const repository = new TaskLocalRepository(storage);
const apiClient = new ApiClient({ apiBase: config.apiBase });

const app = document.querySelector("task-app");
app.repository = repository;

// Naive push, no queue yet. Phase 5 replaces this listener with the outbox
// and mutation replayer; the local-first write already happened in task-app.
app.addEventListener("mutation", async (event) => {
  try {
    if (event.detail.type === "create") {
      await apiClient.createTask(event.detail.payload, event.detail.taskId);
    } else if (event.detail.type === "update") {
      await apiClient.updateTask(event.detail.taskId, event.detail.payload, crypto.randomUUID());
    } else if (event.detail.type === "delete") {
      await apiClient.deleteTask(event.detail.taskId, event.detail.payload.updatedAt, crypto.randomUUID());
    }
  } catch (err) {
    console.log(JSON.stringify({ event: "sync.mutation.failed.naive", message: err.message }));
  }
});

console.log(JSON.stringify({ event: "app.boot", ts: new Date().toISOString() }));

// Service worker registration. skipWaiting() and clients.claim() run
// unconditionally inside sw.js, see the four day scope note there.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { type: "module" });
      console.log(JSON.stringify({ event: "sw.registered", scope: registration.scope }));
    } catch (err) {
      console.log(JSON.stringify({ event: "sw.registration.failed", message: err.message }));
    }
  });
}
