/* Focus Deck service worker
 * - Versioned app-shell caching
 * - Navigation: network-first, fallback to cached app shell only for navigation requests
 * - Assets: cache-first for same-origin static assets, never substitute HTML for failed assets
 * - Updates: activate cleans old app caches; clients reload on controller change (handled by app if desired)
 */
const CACHE_VERSION = 'focus-deck-v2-2026-11-15';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.allSettled(APP_SHELL.map((url) => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Navigation requests: network-first, fallback to app shell only
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_VERSION);
        cache.put('/index.html', fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        const cache = await caches.open(CACHE_VERSION);
        const cached = await cache.match('/index.html') || await cache.match('/');
        if (cached) return cached;
        return new Response('Offline', { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  // Only handle same-origin requests; let cross-origin (APIs/CDNs) go to network
  if (!sameOrigin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(req);
    if (cached) {
      // stale-while-revalidate for static assets
      event.waitUntil(fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      }).catch(() => {}));
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch {
      // Do NOT return HTML for failed asset requests
      return new Response('', { status: 504, statusText: 'Gateway Timeout' });
    }
  })());
});
