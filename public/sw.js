// ─────────────────────────────────────────────
// CHOLO BONDHU — Service Worker (PWA Offline)
// ─────────────────────────────────────────────

const CACHE_NAME = "cholo-bondhu-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/favicon.ico",
  "/favicon-32.png",
  "/icon-192.png",
  "/brand/app-icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("[SW] Cache addAll failed:", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip chrome-extension, non-http, and POST/PUT requests
  if (!event.request.url.startsWith("http") || event.request.method !== "GET") {
    return;
  }

  // Handle map tile requests: cache-first if tile, or network-first with cache fallback
  if (url.hostname.includes("tile.openstreetmap.org") || url.hostname.includes("basemaps.cartocdn.com")) {
    event.respondWith(
      caches.open("cholo-bondhu-tiles-sw").then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse || new Response("", { status: 408 }));
        });
      })
    );
    return;
  }

  // General static assets: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (url.pathname.startsWith("/_next/static/") || url.pathname.endsWith(".png") || url.pathname.endsWith(".svg"))
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
