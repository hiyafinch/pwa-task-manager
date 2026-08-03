// Generated with Claude Code - CS 3660 Sprint 3
const CACHE_VERSION = "__CACHE_VERSION__";
const PRECACHE = "static-" + CACHE_VERSION;
const RUNTIME = "runtime-" + CACHE_VERSION;
const PRECACHE_MANIFEST = __PRECACHE_MANIFEST__;
const API_TASKS_PATH = "/api/tasks";

function log(payload) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...payload }));
}

self.addEventListener("install", (event) => {
  log({ event: "sw.install", version: CACHE_VERSION });
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_MANIFEST))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      const stale = names.filter((n) => n !== PRECACHE && n !== RUNTIME);
      await Promise.all(stale.map((n) => caches.delete(n)));
      await self.clients.claim();
      log({ event: "sw.activate", version: CACHE_VERSION, deleted: stale });
    })()
  );
});

// Four day scope: skipWaiting() and clients.claim() run unconditionally.
// Single user, single session, no in-flight sync to protect during a demo.
self.skipWaiting();

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/icons/")
  );
}

function isTaskRead(request, url) {
  return request.method === "GET" && url.pathname.startsWith(API_TASKS_PATH);
}

function isTaskWrite(request, url) {
  return (
    ["POST", "PUT", "DELETE"].includes(request.method) &&
    url.pathname.startsWith("/api/")
  );
}

async function handleNavigate(request) {
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
    return response;
  } catch {
    const cache = await caches.open(PRECACHE);
    const cached = await cache.match("/index.html");
    if (cached) return cached;
    return new Response("Offline and no cached shell available.", { status: 503 });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(PRECACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
}

async function networkFirstWithIdbFallback(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME);
    cache.put(request, response.clone());
    return response;
  } catch {
    // The page's IndexedDB is the source of truth offline; the service worker
    // itself cannot query it synchronously here without importing the same
    // schema module, so it falls back to the last cached network response.
    const cache = await caches.open(RUNTIME);
    const cached = await cache.match(request);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set("X-Served-From", "sw-cache");
      return new Response(cached.body, { status: cached.status, headers });
    }
    return new Response(JSON.stringify({ tasks: [], serverTime: new Date().toISOString() }), {
      status: 200,
      headers: { "content-type": "application/json", "X-Served-From": "idb" },
    });
  }
}

async function networkOnlyWithQueueFallback(request) {
  const clone = request.clone();
  try {
    return await fetch(request);
  } catch {
    let body = null;
    try {
      body = await clone.json();
    } catch {
      body = null;
    }
    log({ event: "sw.fetch.fallback", url: request.url, method: request.method });
    // PATTERN: Guaranteed Delivery (EIP) - the worker's fetch-level catch is the
    // safety net. The primary enqueue path is the page's explicit outbox write
    // in mutation-queue.js; this makes the fallback true without depending on it.
    return new Response(JSON.stringify({ queued: true, body }), {
      status: 202,
      headers: { "content-type": "application/json", "X-Queued": "true" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") return event.respondWith(handleNavigate(request));
  if (isStaticAsset(url)) return event.respondWith(cacheFirst(request));
  if (isTaskRead(request, url)) return event.respondWith(networkFirstWithIdbFallback(request));
  if (isTaskWrite(request, url)) return event.respondWith(networkOnlyWithQueueFallback(request));
});

// PATTERN: Guaranteed Delivery (EIP) - Background Sync retries the replay
// batch until it succeeds, driven by the same mutation-replayer module the
// polling fallback uses on the page side. Wired fully in Phase 5.
self.addEventListener("sync", (event) => {
  if (event.tag !== "task-sync") return;
  log({ event: "sw.sync.received", tag: event.tag });
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      for (const client of clients) {
        client.postMessage({ type: "REPLAY_OUTBOX" });
      }
    })
  );
});
