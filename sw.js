/* ============================================================
   sw.js - حاسبة الحصص ديوان الحليب
   استراتيجية: الشبكة أولاً (Network-First)
   - عند توفر الإنترنت: يحمّل النسخة الأحدث دائماً ويحدّث الكاش
   - عند انقطاعه: يخدم آخر نسخة مخزنة (يعمل أوفلاين)
   تحديث: تغيير رقم الإصدار أدناه يجبر الأجهزة على تحديث كاشها
   ============================================================ */
const CACHE_NAME = 'lots-calc-v20260821-v3';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // الشبكة أولاً
  e.respondWith(
    fetch(req)
      .then((res) => {
        try {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        } catch (err) {}
        return res;
      })
      .catch(() =>
        caches.match(req).then((m) => m || caches.match('./index.html'))
      )
  );
});
