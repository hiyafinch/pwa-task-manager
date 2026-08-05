# Sprint 3 Presentation Summary
## PWA Task Manager — CS 3660 Web Design 2, UVU Summer 2026
**Student:** Ethan Kidd
**Demo video:** https://youtu.be/vKa7E2ZIUAo

---

## What was built

An offline-first task manager deployed as a Progressive Web App. Users can create, complete, and delete tasks with no network connection. When connectivity returns, the app syncs automatically and resolves conflicts without user intervention.

The central design decision: IndexedDB is the source of truth, not the server. Every read and write hits local storage first. The network is treated as an optional sync channel.

---

## Perfect Framework concern: Offline Operation

Offline operation was the chosen concern for this sprint. Sprints 1 and 2 covered secrets management, persistence, authentication, and scalability. This sprint adds the ability to function without a network at all.

Three components make offline a first-class mode rather than a degraded fallback:

**Durable outbox (Message Queue EIP).** Every mutation is written to an IndexedDB outbox before the UI confirms it. The outbox survives a browser restart. If the user closes the tab mid-edit and reopens it online two hours later, the mutation replays and lands.

**Guaranteed delivery replayer.** The replayer reads the outbox in FIFO order and sends mutations to the backend one at a time. Failures are classified: a 5xx retries up to five times with exponential backoff, a 4xx moves immediately to the dead letter channel. Order is preserved across retries.

**Idempotent server.** The backend assigns a `mutationId` to each write and stores it in an `applied_mutations` table. A replayed mutation returns the same response as the original and never double-applies.

---

## Advanced platform technology: Service Workers

Service workers are the thread the browser runs in the background, separate from the page. This project uses three browser APIs that only exist inside a service worker context:

**Cache API.** On install, the service worker precaches all static assets (HTML, JS, CSS, manifest). The cache key includes the commit SHA, so a new deploy automatically busts the old cache. On fetch, static assets are served cache-first and never hit the network.

**Background Sync API.** When a mutation is enqueued offline, the service worker registers a sync tag (`task-sync`). The browser fires a `sync` event when connectivity returns, even if the page is closed. The sync handler tells the replayer to drain the outbox.

**Fallback for Safari and Firefox.** Background Sync is Chrome-only. `SyncStrategySelector` checks `"sync" in ServiceWorkerRegistration.prototype` at boot. If the API is absent, it falls back to `PollingSyncStrategy`, which drives the same replayer on a 15-second interval and on the `online` event. The logged event `sync.strategy.selected` makes the branch taken visible in DevTools.

---

## CI/CD pipeline

GitHub Actions runs four jobs on every push to main:

1. **Test** — 45 tests across both workspaces using Node's built-in test runner
2. **Build** — Vite builds the frontend and a grep step asserts the service worker's cache version string contains the current commit SHA
3. **Deploy frontend** — Netlify CLI deploys the built dist to production (gated on Test and Build)
4. **Deploy backend** — Render deploy hook triggers a new deployment (gated on Test)

The deploy gate is structural. Both deploy jobs list `needs: [test]` in the workflow YAML, so a failing test suite makes it impossible for a broken build to reach production, not just unlikely.

---

## Design patterns

**GoF patterns (3 minimum, 5 implemented):**

| Pattern | Where |
|---|---|
| Strategy | Storage backends: `IdbStorage` and `MemoryStorage` behind a shared interface, selected by feature detection |
| Strategy (second use) | Sync strategies: `BackgroundSyncStrategy` and `PollingSyncStrategy`, selected by browser capability |
| Observer | `SyncStateStore` notifies `sync-status-banner` when sync state changes |
| Factory Method | `TaskFactory.create()`, `fromServer()`, `fromQueueReplay()` each produce a fully populated task record |
| Repository | `TaskRepository` isolates all SQL from the service layer |

**Enterprise Integration Patterns (2 minimum, 3 implemented):**

| EIP | Where |
|---|---|
| Message Queue | `MutationQueue` — durable FIFO outbox in IndexedDB with monotonic sequence numbers |
| Guaranteed Delivery | `MutationReplayer` + idempotency middleware — mutations survive restarts and network failures |
| Dead Letter Channel | `DeadLetterChannel` — permanently failed mutations move to a separate store with a reason field and a requeue path |

---

## Observability

The backend emits one structured JSON log line per request with `ts`, `level`, `event`, `route`, `status`, `durationMs`, and `requestId`. The frontend sends `X-Request-Id` headers and buffers sync lifecycle events to IndexedDB (capped at 500 entries). A single request ID can be followed from a browser action into the server log, which is the minimum bar for distributed tracing without a tracing backend.

---

## Live system

- Frontend: https://pwataskmanager.netlify.app
- Backend: https://pwa-task-manager-backend.onrender.com
- CI/CD: https://github.com/hiyafinch/pwa-task-manager/actions
- Source: https://github.com/hiyafinch/pwa-task-manager/releases/tag/sprint-3-final

Demo credentials: `demo@example.com` / `Sprint3Demo!`

Note: Render free tier spins down after 15 minutes of inactivity. Hit the health endpoint (`/health`) before demoing to wake the backend.
