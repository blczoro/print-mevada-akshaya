// Basic PWA service worker with Web Share Target handling.
// - Caches a small app shell for offline start.
// - Intercepts POST /share-handler, stashes the shared file in a Cache,
//   then redirects to /?source=pwa_share so the client picks it up.

const CACHE = "print-shell-v1";
const CORE = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];
const SHARE_CACHE = "print-share-v1";
const SHARE_KEY = "/__shared_file__";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE && k !== SHARE_CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

async function handleShare(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("sharedFiles").filter((f) => f instanceof File);
    const file = files[0];
    if (file) {
      const cache = await caches.open(SHARE_CACHE);
      const headers = new Headers({
        "Content-Type": file.type || "application/octet-stream",
        "X-Filename": encodeURIComponent(file.name || "shared-document"),
      });
      await cache.put(SHARE_KEY, new Response(await file.arrayBuffer(), { headers }));
    }
  } catch (_) {
    // ignore; client will just see no file
  }
  return Response.redirect("/?source=pwa_share", 303);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method === "POST" && url.pathname === "/share-handler") {
    event.respondWith(handleShare(req));
    return;
  }

  if (req.method !== "GET") return;

  // Network-first for navigations so we don't serve stale HTML.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/").then((r) => r || Response.error())),
    );
    return;
  }

  // Cache-first for same-origin static assets.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          }).catch(() => cached),
      ),
    );
  }
});
