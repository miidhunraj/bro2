/* Broccoli Club service worker — bump VERSION on every deploy */
const VERSION = 'bc-v8';

const CORE = [
  './',
  './index.html',
  './menu.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './offline.html',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
  './icons/favicon.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => Promise.all(CORE.map(u => cache.add(u).catch(() => null))))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let CDN / unsplash / supabase pass through

  const isDoc  = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  const isCode = /\.(?:js|css)$/.test(url.pathname);

  // App shell + code: network first, cache as fallback
  if (isDoc || isCode) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
          const cache = await caches.open(VERSION);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || (isDoc ? caches.match('./index.html') : Response.error());
      }
    })());
    return;
  }

  // Everything else (images, icons, fonts): cache first
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) {
        const cache = await caches.open(VERSION);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch {
      return cached || Response.error();
    }
  })());
});
