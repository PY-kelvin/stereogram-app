const CACHE_NAME = 'eyebuddy-cache-v503';
const urlsToCache = [
  './',
  './index.html?v=503',
  './styles.css?v=503',
  './js/app.js?v=503',
  './fonts/fredoka.woff2',
  './music/Stereogram%20music.mp4',
  './manifest.json',
  './app_icon_v2.png',
  './New%20stage%201/1a.png',
  './New%20stage%201/1b.png',
  './New%20stage%201/2a.png',
  './New%20stage%201/2b.png',
  './New%20stage%201/3a.png',
  './New%20stage%201/3b.png',
  './New%20stage%201/4a.png',
  './New%20stage%201/4b.png',
  './New%20stage%201/5a.png',
  './New%20stage%201/5b.png',
  './stage%201/stage%201A.png',
  './stage%201/stage%201B.png',
  './stage%201/stage%201C.png',
  './stage%201/Stage%201D.png',
  './stage%201/Stage%201E.png',
  './stage%202/stage%202A.png',
  './stage%202/stage%202B.png',
  './stage%202/stage%202C.png',
  './stage%202/stage%202D.png',
  './stage%202/stage%202E.png',
  './stage%203/stage%203A.png',
  './stage%203/stage%203B.png',
  './stage%203/Stage%203C.png',
  './stage%203/stage%203D.png',
  './stage%203/stage%203E.png',
  './Orthoptics%20Street.png',
  './Eye%20Town.jpeg',
  './Squint%20Quay1.png',
  './avatar_cat.png',
  './avatar_cow.png',
  './avatar_hamster.png',
  './avatar_puppy.png',
  './avatar_penguin.png',
  './avatar_capybara.png',
  './avatar_dino.png',
  './avatar_otter.png',
  './avatar_sheep.png',
  './avatar_duck.png',
  './avatar_koala.png',
  './avatar_babyshark.png',
  './farm_node_v2.png',
  './city_node_v2.png',
  './calibrate_node_v2.png',
  './calibrate_node_v3.png',
  './calibrate_node_v4.png',
  './clock_bg.png',
  './reward_horse.png',
  './reward_cow.png',
  './reward_chicken.png',
  './reward_duck.png',
  './reward_hamster.png',
  './reward_capybara.png',
  './reward_squirrel.png',
  './reward_penguin.png',
  './reward_farmers.png'
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
    caches.match(event.request, { ignoreSearch: true })
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
    }).then(() => self.clients.claim())
  );
});
