// غيّر رقم النسخة عند كل تحديث للتطبيق حتى يتم تحميل النسخة الجديدة فورًا
const CACHE_NAME = 'quota-calc-v3'; // Incremented version to force update
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// عند التثبيت: خزّن الملفات الأساسية وفعّل النسخة الجديدة فورًا (بدون انتظار)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

// عند التفعيل: احذف أي نسخ كاش قديمة وتولَّ التحكم في الصفحة فورًا
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// استراتيجية: الكاش أولاً (العمل أوفلاين كلياً كأولوية)، ثم الشبكة إذا لم يكن الملف في الكاش.
// إذا طلبنا تحديثاً، يمكننا الاعتماد على تخطي الكاش.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Return cached response if we have it (OFFLINE FIRST)
      if (cachedResponse) {
        // Optionally fetch in background to update cache for next time (Stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse);
          });
        }).catch(() => {}); // ignore network errors in background
        return cachedResponse;
      }
      
      // 2. If not in cache, try network
      return fetch(event.request).then((networkResponse) => {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return networkResponse;
      }).catch(() => {
        // 3. If offline and not in cache, fallback to index.html (useful for PWA routing)
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
