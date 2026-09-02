/* 오프라인 캐시 — 엘리멘츠 대전은 **자립형 페이지 + 카드 데이터 한 장**이다.
   ⚠ 게임(prototype/sw.js)·카드 뷰어(cards/sw.js)와 **캐시 이름이 달라야** 한다.
      scope 는 달라도 캐시 저장소는 출처 하나를 공유해서, 이름이 겹치면
      한쪽이 activate 될 때 다른 쪽 캐시를 지워 버린다.
   ⚠ 새 판을 올릴 때마다 CACHE 이름을 바꿔야 갱신된다
      (배포 때 tools/build_pages.py 가 내용 해시를 뒤에 붙여 준다). */
const CACHE = 'ten-etg-v1';
const SHELL = ['./', './index.html', './data.js', './manifest.webmanifest',
               './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  /* ⚠ 옛 캐시를 지울 때 **내 접두사만** 본다. `k !== CACHE` 로 전부 지우면
     같이 깔린 게임·뷰어 앱의 오프라인 캐시가 날아간다. */
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('ten-etg-') && k !== CACHE)
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
