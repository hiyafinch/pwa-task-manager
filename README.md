# PWA Task Manager (CS 3660 Sprint 3)

## What this is

An offline-first task manager built as a Progressive Web App. You can create, edit, complete, and delete tasks with no network connection, and the app converges with the server automatically once you are back online. Built by Ethan Kidd for CS 3660 Web Design 2, UVU, Summer 2026.

## Perfect Framework concern targeted: Offline Operation

The application treats the network as an enhancement, not a requirement. The browser's IndexedDB is the local source of truth for the UI: every read and write goes through it first, and the server is a sync target the app reconciles with when a connection exists. Three pieces make this concrete rather than aspirational: a durable outbox (`frontend/src/core/sync/mutation-queue.js`) that survives a browser restart, a replay loop with budgeted retries (`frontend/src/core/sync/mutation-replayer.js`), and a server that can accept mutations out of order, twice, or late, and still converge (`backend/src/services/conflict-resolver.js`, `backend/src/middleware/idempotency.js`).

| Claim | File |
|---|---|
| Reads and writes hit IndexedDB before the network | `frontend/src/core/db/repository.js`, `frontend/src/main.js` |
| Mutations are durable across a restart | `frontend/src/core/sync/mutation-queue.js` |
| Retries are budgeted and ordered | `frontend/src/core/sync/mutation-replayer.js` |
| The server deduplicates replayed writes | `backend/src/middleware/idempotency.js` |
| The server resolves conflicts deterministically | `backend/src/services/conflict-resolver.js` |

Secondary concern: **CI/CD**. See the CI/CD pipeline section below.

## Advanced web platform technology: Service Workers

API surface used, listed explicitly:

- Cache API (`caches.open`, `cache.addAll`, `cache.match`) in `frontend/public/sw.js`
- Background Sync API (`registration.sync.register`, the `sync` event) in `frontend/src/core/sync/background-sync-strategy.js` and `frontend/public/sw.js`
- IndexedDB via `idb` in `frontend/src/core/db/schema.js` and the storage strategies
- Web App Manifest and install prompt via `frontend/public/manifest.webmanifest`

**Fallback story.** Background Sync is not supported in Firefox or Safari. `SyncStrategySelector` (`frontend/src/core/sync/sync-strategy-selector.js`) detects `"sync" in ServiceWorkerRegistration.prototype` at boot and falls back to `PollingSyncStrategy`, which listens for the `online` event and polls on a 15 second interval, driving the identical `MutationReplayer`. The selection is logged as `sync.strategy.selected` so it is provable without a debugger. A `VITE_FORCE_POLLING_SYNC` build flag forces the fallback in any browser for local testing.

## Live URLs

- Frontend: fill in after connecting Netlify (see `sprint3-blockers.md` in the planning folder)
- Backend: fill in after connecting Render
- Health endpoint: `<backend-url>/health`
- GitHub Actions: https://github.com/hiyafinch/pwa-task-manager/actions

## Demo access

```
Email: demo@example.com
Password: Sprint3Demo!
```

A demo user with these credentials is seeded on every backend boot, so the app is reachable without the author present. Set real values via `SEED_USER_EMAIL` and `SEED_USER_PASSWORD` in Render if you want different credentials.

## CI/CD pipeline

```
push to main
  -> test (backend + frontend, node --test)
       -> build (vite build, then asserts dist/sw.js carries the commit SHA)
            -> deploy-frontend (Netlify)  \
            -> deploy-backend (Render)     >  both need: [test]
```

The deploy gate is the `needs:` key in `.github/workflows/ci.yml`. Both deploy jobs declare `needs: [test]` (the frontend deploy also needs `build`), so a red test suite makes deployment structurally impossible rather than merely discouraged. The `build` job's grep step enforces that a build shipping a stale cache-version string fails before it can reach production.

## Design patterns in this codebase

See `docs/patterns.md` for the full table with file paths and one-line descriptions. At least three GoF patterns (Strategy used twice, Observer, Factory Method) and two EIPs (Message Queue, Guaranteed Delivery, Dead Letter Channel) are implemented, each with a `// PATTERN:` marker comment above the relevant class.

## Architecture

See `docs/architecture.md` for the full data flow diagram, conflict resolution policy, and auth flow.

## Observability

Every backend request emits one JSON line to stdout with `ts`, `level`, `event`, `route`, `status`, `durationMs`, and `requestId` (`backend/src/middleware/request-logger.js`). The frontend generates a `requestId`-equivalent trace by sending `X-Request-Id`; the backend echoes whatever it receives, so a single id can be followed from a browser action into the server log. Frontend sync lifecycle events (`sync.enqueued`, `sync.mutation.succeeded`, `sync.mutation.failed`, `sync.deadlettered`, `sync.completed`, `sync.strategy.selected`) are logged to the console and buffered in the IndexedDB `logs` store, capped at the most recent 500 entries. Shipping those logs to the server (`POST /api/logs`) and a `/metrics` endpoint are cut for the four day build window; see Known trade-offs.

Never logged: task titles, tokens, or passwords.

## Running locally

Prerequisites: Node 22, npm.

```
npm install
cp .env.example backend/.env   # fill in JWT keys, see below
npm run dev:backend            # http://localhost:3000
npm run dev:frontend           # http://localhost:5173, proxies /api to :3000
```

Generate an RS256 key pair for `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` with:

```
node -e "const {generateKeyPairSync}=require('crypto');const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});console.log(privateKey);console.log(publicKey);"
```

Log in with the seeded demo user (see Demo access above).

## Testing

```
npm test              # both workspaces
npm run test:backend  # Node's built-in test runner, node --test
npm run test:frontend # same, with fake-indexeddb for IndexedDB-backed tests
```

45 tests total. The storage contract test (`frontend/test/storage-strategy.contract.test.js`) runs the identical assertion suite against both `MemoryStorage` and `IdbStorage`, which is the proof that the Strategy pattern is real rather than decorative: if either implementation drifted from the shared contract, this suite would catch it.

## Known trade-offs and limitations

- **Single-user scope.** Conflict resolution is last-write-wins by ISO 8601 timestamp. This is sufficient for one user across multiple devices or tabs but not for concurrent multi-user editing; a CRDT or vector-clock scheme would be the next step.
- **Clock skew is not corrected.** The server stamps `serverTime` on every response; the client could use it to estimate and correct drift. Not implemented.
- **Render free tier has no persistent disk.** The SQLite file is wiped on every deploy and every spin-down. Migrations and the demo user seed run on every boot, so a cold start is a working system, not a broken one. If demo data needs to survive a redeploy, swap in Render's paid persistent disk or a free Postgres instance.
- **Reduced auth.** One RS256 signing key, an 8 hour access token, and no refresh cookie. Sprint 2 already covered the full JWT lifecycle, so this sprint spends no time re-earning that; the JWKS endpoint (`GET /.well-known/jwks.json`) still exists and is why a rotation-safe verification path would be cheap to add later.
- **Cut for time (see plan Section 0.1.2):** `/metrics` endpoint, frontend log shipping to the server, an update-available button (the service worker calls `skipWaiting()` unconditionally instead), a `notes` field on tasks, and a dedicated `offline.html` (the app falls back to the precached `index.html` instead). The dead letter panel's requeue button was on the cut list too but was cheap enough to keep once `dead-letter-channel.js` existed; the component is at `frontend/src/components/dead-letter-panel.js`.
- **Icons are a placeholder SVG,** not custom artwork, chosen because this build session could not transmit binary PNG data through its tooling. Swap `frontend/public/icons/icon.svg` for real artwork before a real submission if desired; the manifest already points at it.

## Sprint history

- **Sprint 1** introduced Strategy (swappable LLM adapters chosen at construction time) and Factory Method.
- **Sprint 2** introduced Observer and a full JWT auth lifecycle.
- **Sprint 3 (this sprint)** reuses Strategy and Factory Method but makes the stakes different: Strategy here is selected at runtime from browser capability detection, and choosing wrong means data loss, not a different output format. Observer now spans a process boundary (the service worker posts messages that feed the same store the page's Observer pattern already used). The new material is the offline sync engine itself: the outbox, the guaranteed-delivery replayer, the dead letter channel, and a server built to be idempotent and conflict-aware.

## AI assistance

Generated with Claude Code. Every generated source file carries the citation comment `// Generated with Claude Code - CS 3660 Sprint 3` on line 1.
