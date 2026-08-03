<!-- Generated with Claude Code - CS 3660 Sprint 3 -->
# Demo script

There is no live demo. This is a screen-recorded walkthrough submitted as an unlisted YouTube video, same format as Sprint 1. Retakes are allowed. The reflection (`sprints/sprint-3-reflection.md`) is due 24 hours after the link is submitted to Canvas.

## Before you hit record

1. `curl <backend-url>/health` to wake the Render dyno if it has spun down.
2. Open the deployed Netlify URL, hard reload, confirm the service worker is Activated in DevTools, Application, Service Workers.
3. Seed 3 tasks so the list is not empty on camera.
4. Open four tabs: the app, DevTools on the Application panel, the GitHub Actions run list, and the Render log stream.
5. Zoom the browser to 125 percent for recording clarity.
6. DevTools, Application, Storage, Clear site data, then a normal reload, to rebuild the cache from scratch before recording. Do this once, not mid-take.

## Run of show (about 20 minutes)

| Time | Segment | What to say and click |
|---|---|---|
| 0:00-1:30 | Framing | Name the concern: offline operation. Name the platform technology: service workers, Cache API, Background Sync API. Thesis: the network is an enhancement, not a requirement |
| 1:30-3:00 | Architecture | Walk `docs/architecture.md`'s diagram. Point at the three boundaries and where the source of truth lives (IndexedDB) |
| 3:00-5:30 | Online happy path | Create, edit, complete, delete a task. Show the Network tab. Show the service worker's registered scope and its cache-version string matching the deployed commit SHA |
| 5:30-11:00 | **The offline act, the centerpiece** | Check Offline in DevTools. Create three tasks, edit one, delete one. Point at the banner state changes (name Observer). Open the `outbox` store in IndexedDB and show the queued Command objects with `seq` and `mutationId`. Close the tab entirely. Reopen it while still offline; show the shell loading from cache with the data intact. Uncheck Offline. Narrate the flush: banner goes Syncing, outbox drains, Render logs scroll. Refresh from the server and show everything landed |
| 11:00-13:00 | Conflict resolution | With the app offline, edit a task. In a terminal, `curl` a PUT for the same task with a newer timestamp. Go online. Show `resolution: "server_won"` in the response and the local record reconciling. Repeat with an older server timestamp for `client_won` |
| 13:00-14:30 | Dead letter channel | Point a mutation at a bad path (or use the `VITE_FORCE_POLLING_SYNC`-style config seam) to force a permanent failure. Show it exhaust the retry budget, land in the dead letter panel with its reason, then requeue it and watch it succeed |
| 14:30-16:00 | Fallback strategy | Open the same URL in Firefox, or on an iPhone in Safari. Show `sync.strategy.selected` in the console choosing polling. Say: this is the Background Sync support gap, mitigated at runtime by the Strategy pattern |
| 16:00-18:00 | CI/CD | Show a green Actions run on `main`. Open a deliberately failing PR run and point at `deploy-frontend` skipped because `needs: test` failed. Say the words "deploy gate." Show the cache-version assertion step in the `build` job |
| 18:00-19:30 | Patterns and observability | Open `docs/patterns.md`, jump to two files with marker comments. Show the Render log stream with a `requestId` traced from a browser action to a server line |
| 19:30-20:00 | Close | Restate the concern, the technology, the pipeline. One sentence on what is next: multi-user conflict resolution via CRDTs or vector clocks |

## Q&A ammunition

1. **Why last-write-wins instead of CRDTs?** Single-user scope, timestamps are sufficient. CRDTs are the multi-user answer, and here is what would change.
2. **What if two mutations for the same task queue up offline?** They replay in `seq` order; the second carries a later timestamp, and the server converges to the last one.
3. **What happens if the sync event fires twice?** Idempotency keys plus the `applied_mutations` table. The receiver is idempotent, so a duplicate replay is free.
4. **Why not intercept every mutation in the service worker?** Optimistic UI needs the local write to happen in the page, and a page-side queue is testable. The worker still catches failed writes as a safety net.
5. **Clock skew between client and server?** A real limitation. The server stamps `serverTime` on every response, and the client could correct for drift. Not implemented, single-user scope, and here is where it would go.
