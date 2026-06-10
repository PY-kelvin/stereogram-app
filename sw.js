const CACHE_NAME = 'myeyegym-cache-v44';
const urlsToCache = [
  './',
  './index.html?v=44',
  './styles.css?v=44',
  './js/app.js?v=44',
  './manifest.json',
  './avatar_cat.png',
  './avatar_cow.png',
  './avatar_hamster.png',
  './avatar_puppy.png'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Return from cache if found
        }
        return fetch(event.request); // Otherwise fetch from network
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Ensure the new service worker takes control immediately
});
