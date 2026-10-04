// Shafin Blade Fighter 3D — Service Worker v3
// Full offline caching of all game assets for PWA install

const CACHE = 'sbf3d-v3';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/main.js',
  './js/engine/Game.js',
  './js/engine/Input.js',
  './js/engine/Sound.js',
  './js/engine/Physics.js',
  './js/engine/ThreeEngine.js',
  './js/engine/three.min.js',
  './js/effects/Particle.js',
  './js/effects/Camera.js',
  './js/entities/Fighter3D.js',
  './js/entities/Shafin3D.js',
  './js/entities/Nafis3D.js',
  './js/entities/Tamim3D.js',
  './js/entities/Hamza3D.js',
  './js/entities/Aavon3D.js',
  './js/entities/AI.js',
  './js/scenes/TitleScene.js',
  './js/scenes/SelectScene.js',
  './js/scenes/VersusScene.js',
  './js/scenes/FightScene.js',
  './js/scenes/VictoryScene.js',
  './assets/images/shafin_avatar.png',
  './assets/images/nafis_avatar.png',
  './assets/images/tamim_avatar.png',
  './assets/images/hamza_avatar.png',
  './assets/images/aavon_avatar.png',
  './assets/images/shafin_card.png',
  './assets/images/nafis_card.png',
  './assets/images/tamim_card.png',
  './assets/images/hamza_card.png',
  './assets/images/aavon_card.png',
  './assets/images/arena_cyber_city.jpg',
  './assets/images/title_banner.jpg',
  './assets/images/vs_badge.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

// ── Install: cache everything ─────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(
        CORE_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Cache miss:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clear old caches ────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for game assets, network-first for pages
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET, chrome-extension, and download requests
  if (event.request.method !== 'GET') return;
  if (url.pathname.includes('download-game')) return;
  if (url.protocol === 'chrome-extension:') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache valid responses
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: serve index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ── Background Sync: notify clients of SW updates ────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});