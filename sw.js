const CACHE_NAME = 'eyebuddy-cache-v390';
const urlsToCache = [
  './',
  './index.html?v=363',
  './styles.css?v=363',
  './js/app.js?v=363',
  './fonts/fredoka.woff2',
  './music/Stereogram%20music.mp4',
  './manifest.json',
  './app_icon.png',
  './stage 1/stage 1A.png',
  './stage 1/stage 1B.png',
  './stage 1/stage 1C.png',
  './stage 1/Stage 1D.png',
  './stage 1/Stage 1E.png',
  './stage 2/stage 2A.png',
  './stage 2/stage 2B.png',
  './stage 2/stage 2C.png',
  './stage 2/stage 2D.png',
  './stage 2/stage 2E.png',
  './stage 3/stage 3A.png',
  './stage 3/stage 3B.png',
  './stage 3/Stage 3C.png',
  './stage 3/stage 3D.png',
  './stage 3/stage 3E.png',
  './Orthoptics%20Village.png',
  './Orthoptics%20Town.png',
  './Orthoptics%20City.png',
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
