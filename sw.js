const CACHE_NAME = 'whitenoise';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: precache all app assets, skip waiting to activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: claim all clients so the new SW takes over immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch: cache-first with stale-while-revalidate background update.
// Serves cached version instantly, fetches fresh copy in background
// and updates the cache. Next visit always gets the latest.
// No manual cache versioning needed — updates are automatic.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Always try to update cache in background (even if we have a cached copy)
      const networkUpdate = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // offline fallback

      // Return cached version immediately if available, otherwise wait for network
      return cached || networkUpdate;
    })
  );
});
