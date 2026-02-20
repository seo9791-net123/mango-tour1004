
const CACHE_NAME = 'mango-tour-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Firebase 및 Google API 요청은 캐시하지 않고 네트워크로 직접 보냄
  if (
    event.request.url.includes('googleapis.com') || 
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('firebaseapp.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
