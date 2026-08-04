/* 오프라인 캐시 — 프로토타입은 자립형 HTML 한 장이라 그것만 담으면 된다.
   ⚠ 새 판을 올릴 때마다 CACHE 이름을 바꿔야 갱신된다(안 바꾸면 옛 화면이 계속 뜬다). */
const CACHE = 'ten-v50';
const SHELL = ['./', './index.html', './manifest.webmanifest',
               './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  /* ⚠ 옛 캐시를 지울 때 **내 접두사만** 본다. 예전에는 `k !== CACHE` 로 전부 지워서,
     카드 뷰어 앱(ten-cards-*)을 같이 깔면 게임을 열 때마다 뷰어의 오프라인 캐시가 날아갔다.
     서비스워커의 scope 는 달라도 캐시 저장소는 출처(origin) 하나를 공유한다. */
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('ten-v') && k !== CACHE)
                              .map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* 네트워크 우선, 실패하면 캐시 — 갱신을 놓치지 않으면서 오프라인도 된다 */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
