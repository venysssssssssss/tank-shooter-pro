const CACHE_NAME = 'cyber-arcade-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './src/main.js',
  './src/Tank.js',
  './src/Ufo.js',
  './src/Bullet.js',
  './src/PowerUp.js',
  './src/ParticleSystem.js',
  './src/AudioManager.js',
  './src/CameraController.js',
  './src/InputManager.js',
  './src/ObjectPool.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
