<!-- Generated with Claude Code - CS 3660 Sprint 3 -->
# Architecture

## Three boundaries

```
+-------------------+       +----------------------+       +-------------------+
|   Page (Lit UI)    | <---> |   Service Worker      | <---> |   Backend (Koa)    |
|                    |       |                       |       |                    |
| repository.js      |       | precache, cache-first |       | task-service.js    |
| TaskFactory        |       | strategies, fetch      |       | conflict-resolver  |
| MutationQueue       |       | routing, sync event    |       | idempotency        |
| MutationReplayer    |       | posts REPLAY_OUTBOX    |       | task-repository    |
|      |              |       |          |             |       |        |           |
|      v              |       |          v             |       |        v           |
|  IndexedDB           |------>|  Cache API + IndexedDB |------>|  SQLite (ephemeral |
|  (source of truth)   |       |  (offline assets +     |       |   on Render free)  |
|                    |       |   runtime GET cache)    |       |                    |
+-------------------+       +----------------------+       +-------------------+
```

The page's IndexedDB is the source of truth for the UI. The server is a sync target the app reconciles with, not the source of truth, which is a deliberate response to Render's free tier having no persistent disk (see the README's Known trade-offs).

## Offline sync flow

1. A user action (create, edit, complete, delete) goes through `TaskFactory` to build or patch a task record with the correct invariants.
2. `repository.save()` writes to IndexedDB immediately. The UI re-renders from IndexedDB, not from a network response, so the write is optimistic and instant regardless of connectivity.
3. The page dispatches a `mutation` event. `main.js` builds a Command object (`mutationId`, `type`, `taskId`, `payload`, `updatedAt`) and calls `MutationQueue.enqueue()`, which assigns a monotonic `seq` inside the same IndexedDB transaction as the meta-store counter update.
4. `SyncStateStore` transitions to `pending` (Observer, fans out to `sync-status-banner.js`).
5. `SyncStrategySelector` has already chosen `BackgroundSyncStrategy` or `PollingSyncStrategy` at boot, based on `"sync" in ServiceWorkerRegistration.prototype`. The chosen strategy's `requestSync()` is called.
   - Background Sync: `registration.sync.register("task-sync")`. The browser owns the retry schedule. When the `sync` event fires in `sw.js`, the worker posts `{type: "REPLAY_OUTBOX"}` to every open client, and the page's `MutationReplayer` does the actual work.
   - Polling: the page calls `MutationReplayer.replayAll()` immediately and again every 15 seconds while online.
6. `MutationReplayer.replayAll()` reads the outbox in `seq` order and POSTs/PUTs/DELETEs each mutation with `mutationId` as the `Idempotency-Key` header. A success dequeues the mutation and reconciles the local record with the server's winning version. A retryable failure (network error, 429, 502-504) stops the run at that mutation, preserving order, and is retried on the next pass. A permanent failure (400, 404, 422) or an exhausted retry budget (5 attempts) moves the mutation to the Dead Letter Channel.
7. `SyncStateStore` transitions through `syncing` to `synced` (all clear) or `pending` (some mutations remain, waiting on a retryable failure).

## Conflict resolution policy

Server-authoritative last-write-wins by ISO 8601 UTC timestamp comparison (`backend/src/services/conflict-resolver.js`). Lexicographic string comparison of ISO 8601 timestamps is chronologically correct, so `incoming.updatedAt > existing.updatedAt` is sufficient with no date parsing. Edge cases, each with a dedicated test:

- No existing record: the incoming write is treated as a create.
- Equal timestamps: the server keeps its own version. Deterministic and defensible in Q&A.
- A tombstone (soft delete) with a later timestamp beats a live update; deleting then editing offline resurrects nothing.
- An update for an id that does not exist and is not a tombstone is treated as a create (upsert), which makes the outbox resilient to a create that was itself dead lettered and later requeued.

The client never keeps a version the server rejected; it always adopts the returned winner (`replayer.js` writes `result.task` back into the local repository on every successful mutation).

## Auth flow

Reduced scope, see README Known trade-offs for the full reasoning. `POST /auth/login` verifies the seeded demo user against a SHA-256 password hash and mints an RS256 JWT with an 8 hour expiry and a `kid` header. `backend/src/middleware/auth.js` verifies the bearer token on every `/api/*` route. `GET /.well-known/jwks.json` publishes the current public key, which is the seam a future key-rotation feature would use without a token invalidation transition.

## Why service workers, concretely

- Cache API: precaches the app shell on install, serves static assets cache-first, and serves navigation requests network-first with a 3 second timeout, falling back to the cached shell.
- Background Sync API: the primary trigger for replaying the outbox when supported.
- The service worker also has its own fetch-level catch for any non-GET `/api/*` request that fails outright, replying `202 Accepted` with `X-Queued: true`. This is a safety net, not the primary enqueue path; the primary path is the explicit outbox write in step 3 above, which is what makes the queue testable independent of the worker.
