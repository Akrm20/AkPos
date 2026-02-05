const CACHE_NAME = 'akpos-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './DbPos.js',
  './Pos.js',
  './Sale.js',
  './Inv.js',
  './Itm.js',
  './Inti.js',
  './CuSu.js'
];

// تثبيت الـ Service Worker وتخزين الملفات
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// تفعيل الـ Service Worker وحذف التخزين القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// استراتيجية العرض: البحث في التخزين المؤقت أولاً، ثم الشبكة
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
