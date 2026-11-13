// Self-unregistering cleanup Service Worker (No caching)
// 기존 모바일/PC 브라우저에 남아있는 서비스 워커와 캐시 스토리지를 즉시 모두 삭제하고 스스로 해제합니다.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch (e) {
        // ignore cache deletion errors
      }

      try {
        await self.clients.claim();
        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clientsList) {
          client.postMessage({ type: 'SW_CLEANED_UP' });
        }
      } catch (e) {
        // ignore client message errors
      }

      try {
        await self.registration.unregister();
      } catch (e) {
        // ignore unregister errors
      }
    })()
  );
});

// 네트워크 요청은 캐시를 거치지 않고 항상 최신 원본 서버로 직접 통과시킵니다.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request));
});
