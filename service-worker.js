// Cache the app shell so the converter keeps working offline. All photo
// processing happens on-device via canvas, so nothing else needs a network
// round-trip once the shell is cached.
const CACHE_NAME = 'photo-converter-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/specs.js',
  './js/compliance.js',
  './js/background.js',
  './js/app.js',
  './js/vendor/face-api.min.js',
  './models/selfie_segmentation/selfie_segmentation.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './models/tiny_face_detector_model-weights_manifest.json',
  './models/tiny_face_detector_model-shard1',
  './models/face_landmark_68_tiny_model-weights_manifest.json',
  './models/face_landmark_68_tiny_model-shard1',
];
// The selfie-segmentation WASM runtime + .tflite model (~6MB) are
// intentionally left out of the eager install list — they're same-origin
// requests, so the generic fetch handler below caches them opportunistically
// the first time background removal actually runs, instead of ballooning
// every install with a download most sessions may never need.

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
