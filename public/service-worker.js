// This is the "Offline page" service worker
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');
const CACHE = "pwabuilder-page";
const offlineFallbackPage = "offline.html";

const SHARE_DB_NAME = 'share-target-db';
const SHARE_STORE_NAME = 'shared-files';

function openShareDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SHARE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(SHARE_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveSharedFiles(request) {
  const formData = await request.formData();
  const files = formData.getAll('sharedFiles');
  const title = formData.get('title') || '';
  const text = formData.get('text') || '';
  const db = await openShareDB();
  const tx = db.transaction(SHARE_STORE_NAME, 'readwrite');
  tx.objectStore(SHARE_STORE_NAME).put(
    { files, title, text, timestamp: Date.now() },
    'latest'
  );
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(offlineFallbackPage))
  );
});
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/share-handler') {
    event.respondWith(Response.redirect('/?source=pwa_share', 303));
    event.waitUntil(saveSharedFiles(event.request.clone()));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;
        if (preloadResp) {
          return preloadResp;
        }
        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {
        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});
