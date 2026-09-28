const CACHE_NAME = 'bk-smkn1bunyu-v7';

// Core shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-konselor.svg',
  '/favicon.ico',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install Event: Cache essential shell immediately & skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core app shell for offline PWA');
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((response) => {
              if (response && response.status === 200) {
                return cache.put(url, response);
              }
            })
            .catch((err) => console.warn('[SW] Precache asset skipped:', url, err))
        )
      );
    })
  );
});

// Activate Event: Claim all clients & clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Complete offline strategy (Cache First with Stale-While-Revalidate & Auto-Cache)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 1. Navigation / HTML requests -> Try Network, fallback to cached index.html immediately when offline
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone1 = networkResponse.clone();
            const clone2 = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/', clone1);
              cache.put('/index.html', clone2);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // OFFLINE: Return cached index.html or root
          return caches.match('/')
            .then((res) => res || caches.match('/index.html'))
            .then((res) => res || caches.match(req));
        })
    );
    return;
  }

  // 2. Static assets (JS, CSS, Images, Fonts, Manifest, Web Workers)
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version immediately for instant offline response
        // In background, if online, update cache asynchronously
        fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
          })
          .catch(() => {/* Ignore network errors when offline */});
        return cachedResponse;
      }

      // If not in cache yet, fetch from network and auto-cache
      return fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn('[SW] Offline fetch fallback for:', req.url, err);
          if (req.headers.get('accept')?.includes('image/')) {
            return caches.match('/icon-192x192.png');
          }
        });
    })
  );
});
