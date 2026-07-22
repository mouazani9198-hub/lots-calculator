// غيّر رقم النسخة عند كل تحديث للتطبيق حتى يتم تحميل النسخة الجديدة فورًا
const CACHE_NAME = 'quota-calc-v1';
const FILES_TO_CACHE = [
  './quota-calculator.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
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

// استراتيجية: الشبكة أولاً، والكاش كخطة بديلة (بدون إنترنت)
// هذا يمنع مشكلة "كاش قديم يحجب التحديثات" التي ظهرت سابقًا في تطبيق المستودع
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
