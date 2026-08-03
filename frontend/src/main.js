// Generated with Claude Code - CS 3660 Sprint 3
import "./components/task-app.js";
import { openTaskDb } from "./core/db/schema.js";
import { IdbStorage } from "./core/storage/idb-storage.js";
import { MemoryStorage } from "./core/storage/memory-storage.js";
import { TaskLocalRepository } from "./core/db/repository.js";
import { ApiClient } from "./core/api-client.js";
import { config } from "./core/config.js";
import { MutationQueue } from "./core/sync/mutation-queue.js";
import { DeadLetterChannel } from "./core/sync/dead-letter-channel.js";
import { MutationReplayer } from "./core/sync/mutation-replayer.js";
import { SyncStrategySelector } from "./core/sync/sync-strategy-selector.js";
import { SyncStateStore } from "./core/sync-state-store.js";
import { Logger } from "./core/logger.js";

// PATTERN: Strategy (GoF) - runtime selection between IndexedDB and an
// in-memory fallback. Chosen once, at boot, by feature detection.
const hasIndexedDb = typeof indexedDB !== "undefined";
const dbPromise = hasIndexedDb ? openTaskDb() : null;
const storage = hasIndexedDb ? new IdbStorage(dbPromise) : new MemoryStorage();

const repository = new TaskLocalRepository(storage);
const apiClient = new ApiClient({ apiBase: config.apiBase, getToken: () => localStorage.getItem("accessToken") });
const syncState = new SyncStateStore();
const logger = new Logger(dbPromise);
const queue = hasIndexedDb ? new MutationQueue(dbPromise) : null;
const deadLetter = hasIndexedDb ? new DeadLetterChannel(dbPromise, logger) : null;
const replayer = queue
  ? new MutationReplayer({ queue, deadLetter, apiClient, syncState, repository, logger })
  : null;

let syncStrategy = null;

async function bootSyncStrategy() {
  if (!("serviceWorker" in navigator) || !replayer) return;
  const registrationPromise = navigator.serviceWorker.ready;
  syncStrategy = await SyncStrategySelector.select(registrationPromise);
  syncStrategy.onConnectivityChange((online) => {
    syncState.setState({ status: online ? "pending" : "offline" });
    if (online) syncStrategy.requestSync(replayer);
  });
  if (navigator.onLine) syncStrategy.requestSync(replayer);
}

const app = document.querySelector("task-app");
app.repository = repository;
app.syncStateStore = syncState;
app.deadLetterChannel = deadLetter;

app.addEventListener("mutation", async (event) => {
  if (!queue) return; // MemoryStorage fallback: no durable queue, naive push only
  const mutation = {
    mutationId: crypto.randomUUID(),
    type: event.detail.type,
    taskId: event.detail.taskId,
    payload: event.detail.payload,
    updatedAt: event.detail.payload.updatedAt,
  };
  await queue.enqueue(mutation);
  syncState.setState({ status: navigator.onLine ? "pending" : "offline", pendingCount: await queue.count() });
  if (navigator.onLine && syncStrategy) syncStrategy.requestSync(replayer);
});

app.addEventListener("requeued", () => {
  if (navigator.onLine && syncStrategy) syncStrategy.requestSync(replayer);
});

console.log(JSON.stringify({ event: "app.boot", ts: new Date().toISOString() }));

// Service worker registration. skipWaiting() and clients.claim() run
// unconditionally inside sw.js, see the four day scope note there.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { type: "module" });
      console.log(JSON.stringify({ event: "sw.registered", scope: registration.scope }));
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "REPLAY_OUTBOX" && replayer) replayer.replayAll();
      });
      await bootSyncStrategy();
    } catch (err) {
      console.log(JSON.stringify({ event: "sw.registration.failed", message: err.message }));
    }
  });
}
