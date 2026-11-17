// The Hustle — offline shell. Lets the app open with zero cell service once it has
// been loaded online at least once. Live data is NOT cached here (the app saves
// rounds on the phone itself); this only caches the app's code, fonts and images.
const CACHE = 'hustle-shell-v23';
const PRECACHE = [
  './', './index.html', './support.js', './manifest.json',
  './assets/course-photo.jpg', './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png',
  './icons/wagering-white.png', './icons/history-white.png'
];
const CDN = [
  'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(PRECACHE.map(u => c.add(u).catch(() => {})));
    await Promise.all(CDN.map(u => fetch(new Request(u, {mode:'cors'})).then(r => r.ok && c.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache live round data or course lookups — the app handles those itself.
  if (url.hostname.includes('the-hustle-feed')) return;

  const isStatic = url.hostname === 'unpkg.com' || url.hostname.includes('fonts.g');
  if (isStatic) {
    // Versioned CDN files + fonts never change: cache first.
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // App files: network first (so updates show up right away — no stale-cache
  // problem), falling back to the saved copy when there's no signal.
  e.respondWith((async () => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(req, {signal: ctrl.signal, cache: 'no-store'});
      clearTimeout(t);
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    } catch (err) {
      const hit = await caches.match(req, {ignoreSearch: true});
      if (hit) return hit;
      if (req.mode === 'navigate') return (await caches.match('./index.html')) || (await caches.match('./'));
      throw err;
    }
  })());
});
