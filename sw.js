/* Service Worker — تخزين مؤقت للعمل أوفلاين (cache-first مع تعبئة من الشبكة) */
const CACHE = 'onil-lots-v11'; // رُفع الرقم لإبطال التخزين المؤقت القديم بعد إصلاح التذييل
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        try {
          const copy = res.clone();
          if (res.ok && new URL(e.request.url).origin === self.location.origin)
            caches.open(CACHE).then(c => c.put(e.request, copy));
        } catch (err) {}
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
