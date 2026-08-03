<!-- Generated with Claude Code - CS 3660 Sprint 3 -->
# Pattern implementation guide

Every pattern below has a `// PATTERN:` marker comment on the line above the relevant class or factory in its source file, so it is greppable.

## GoF patterns

| Pattern | File | What it looks like | Why it is not decoration |
|---|---|---|---|
| Strategy | `frontend/src/core/storage/storage-strategy.js`, `idb-storage.js`, `memory-storage.js` | An interface of `get`, `put`, `delete`, `list`, `clear`. Two concrete classes, selected at runtime by feature detection in `main.js` | `frontend/test/storage-strategy.contract.test.js` runs the identical suite against both. The tests would not exist without the pattern being real |
| Strategy (second use) | `frontend/src/core/sync/sync-strategy.js`, `background-sync-strategy.js`, `polling-sync-strategy.js`, `sync-strategy-selector.js` | `requestSync()` and `onConnectivityChange()`. The selector checks `"sync" in ServiceWorkerRegistration.prototype` | Choosing wrong here means data loss, not a different output format. Firefox and Safari take the polling branch |
| Observer | `frontend/src/core/sync-state-store.js`, subscribed by `components/sync-status-banner.js` | `subscribe(fn)` returns an unsubscribe function, `setState()` fans out to all listeners | Two independent parts of the UI react to one state change with no coupling between them. The service worker also posts messages that feed the same store |
| Factory Method | `frontend/src/core/task-factory.js` | `create({title})`, `fromServer(dto)`, `fromQueueReplay(existing, patch)`. Each returns a fully populated record with `id`, `createdAt`, `updatedAt`, `syncStatus` | Three creation paths, one set of invariants. No task literal exists anywhere else in the codebase |
| Repository (bonus) | `backend/src/db/task-repository.js` | All SQL lives in one module, the service layer never sees a query | Lets tests run against `:memory:` SQLite |
| Facade (bonus, carried over from Sprint 1) | `backend/src/services/task-service.js` | One entry point over the repository, the conflict resolver, and the logger | Deliberately reused rather than re-invented |
| Command (bonus) | The outbox mutation record itself, `frontend/src/core/sync/mutation-queue.js` | A request captured as a serializable object with everything needed to execute it later | It survives a browser restart, which is the strongest possible demonstration of the pattern |
| Singleton (bonus) | `backend/src/db/connection.js` | One `better-sqlite3` handle shared by the process | Avoids opening a new file handle per request |

## Enterprise Integration Patterns

| EIP | File | Implementation | Demo moment |
|---|---|---|---|
| Message Queue | `frontend/src/core/sync/mutation-queue.js` | Durable FIFO in IndexedDB ordered by a monotonic `seq` assigned in the same transaction as the enqueue | Watch the `outbox` store fill up in DevTools while offline |
| Guaranteed Delivery | `frontend/src/core/sync/mutation-replayer.js` + `backend/src/middleware/idempotency.js` | The queue is durable across restarts, retries are budgeted at 5 attempts, and the receiver deduplicates by `mutationId` | Queue mutations offline, close the browser entirely, reopen online, watch them land |
| Dead Letter Channel | `frontend/src/core/sync/dead-letter-channel.js` + `components/dead-letter-panel.js` | Mutations that exhaust retries or fail permanently (400/404/422) move to a separate IndexedDB store with a reason, plus a requeue path | Force a permanent failure, show the record and its reason in the panel, requeue it |
| Idempotent Receiver (bonus) | `backend/src/middleware/idempotency.js` + `applied_mutations` table | Replays return the original response and never double-apply | `curl` the same `POST /api/tasks` twice with the same `Idempotency-Key` |
| Message Translator (bonus) | `frontend/src/core/task-factory.js` `fromServer()` and `core/api-client.js` | The wire DTO and the local record are different shapes; `syncStatus` never crosses the wire | One line in the walkthrough |

## Repeated patterns, and what is new here

Strategy and Factory Method appeared in Sprint 1. Observer appeared in Sprint 2. What is new in Sprint 3: these patterns now span a process boundary and survive a restart. Sprint 1 used Strategy to swap LLM adapters at construction time; here Strategy is selected at runtime from browser capability detection, and choosing wrong means data loss rather than a different output format.
