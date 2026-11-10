const CACHE = 'kids-v3';
const FILES = ['./', './index.html', './kids.css', './kids.js', '/style.css', '/site-nav.css', '/level.js', '/favicon.png',
  '/fonts/eb-garamond-latin-400-normal.woff2', '/fonts/eb-garamond-latin-400-italic.woff2', '/fonts/eb-garamond-latin-600-normal.woff2'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(keys => Promise.all(keys.filter(k => k.startsWith('kids-') && k !== CACHE).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
