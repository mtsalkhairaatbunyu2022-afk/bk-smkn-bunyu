const CACHE_NAME = 'bk-smkn1bunyu-v6';

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
  '/icons/icon-512x512.png',
  '/icons/icon-512x512-maskable.png'
];

// Install Event: Cache essential shell immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core app shell');
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

// Activate Event: Clean up old cache versions immediately & claim clients
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

// Fetch Event: Complete offline strategy (Cache First with Network Fallback & Auto-Cache)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 1. Navigation / HTML requests -> Network first, fallback to cached index.html
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
          // OFFLINE: Serve cached root or index.html
          return caches.match('/')
            .then((res) => res || caches.match('/index.html'))
            .then((res) => res || caches.match(req));
        })
    );
    return;
  }

  // 2. Static assets (JS, CSS, Images, Manifest, Fonts) -> Cache First, Network Fallback with Dynamic Caching
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version immediately. Try to update in background when online.
        fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
          })
          .catch(() => {/* Ignore network errors offline */});
        return cachedResponse;
      }

      // If item is not in cache yet, fetch from network and cache it
      return fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn('[SW] Offline fetch failed for:', req.url, err);
          if (req.headers.get('accept')?.includes('image/')) {
            return caches.match('/icon-192x192.png');
          }
        });
    })
  );
});
