/* 오프라인 캐시 — 뷰어도 자립형 HTML 한 장이라 그것만 담으면 된다.
   ⚠ 게임(prototype/sw.js)과 **캐시 이름이 달라야** 한다. 같은 이름이면
      한쪽이 activate 될 때 다른 쪽 캐시를 지워 버린다(scope 는 달라도 캐시 저장소는 공유다).
   ⚠ 새 판을 올릴 때마다 CACHE 이름을 바꿔야 갱신된다. */
const CACHE = 'ten-cards-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest',
               './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('ten-cards-') && k !== CACHE)
                              .map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* 네트워크 우선, 실패하면 캐시 */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
