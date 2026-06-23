const CACHE_NAME = 'myeyegym-cache-v337';
const urlsToCache = [
  './',
  './index.html',
  './styles.css?v=337',
  './js/app.js?v=337',
  './fonts/fredoka.woff2',
  './manifest.json',
  './app_icon.png',
  './orthoptics_village_bg.png',
  './orthoptics_town_bg.png',
  './orthoptics_city_bg.png',
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
    }).then(() => self.clients.claim())
  );
});
