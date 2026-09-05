<<<<<<< HEAD
const CACHE_NAME = 'parenting-prefiller-v18';
=======
const CACHE_NAME = 'parenting-prefiller-v17';
>>>>>>> d12267bfdae4b7e6f2ccb3cbb624b417d5f6c769
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './data/announcements.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force immediate activation of the new Service Worker
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key)) // Clear all old caches
      );
    }).then(() => {
      return caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS));
    }).then(() => {
      return self.clients.claim(); // Force immediate control of all open clients/tabs
    })
  );
});

// Network-First strategy: Fetch freshest version online, fallback to cache when offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request).then((cachedResponse) => {
          return cachedResponse || (e.request.mode === 'navigate' ? caches.match('./index.html') : null);
        });
      })
  );
});
