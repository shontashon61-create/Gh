// ЭХО КУБОВ — офлайн-кэш.
// После первого открытия по ссылке игра запускается с домашнего экрана без интернета.

const CACHE = 'echo-cubes-v1';
const ASSETS = ['./', './index.html', './icon.png', './icon-512.png', './manifest.webmanifest'];

self.addEventListener('install', function (e) {
  e.waitUntil((async function () {
    const c = await caches.open(CACHE);
    for (const url of ASSETS) {
      try { await c.add(url); } catch (err) { /* отсутствующий файл не ломает установку */ }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    const keys = await caches.keys();
    await Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith((async function () {
    const hit = await caches.match(e.request);
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
      }
      return res;
    } catch (err) {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
      throw err;
    }
  })());
});
