/* MuscleMap Admin — service worker (portée : /musclemap/admin/ uniquement).
   Réseau d'abord ; hors ligne, la dernière version de la page s'affiche (sans données).
   Les appels à Supabase et à Microsoft ne passent jamais par le cache. */
const CACHE = 'musclemap-admin-v1';
const ASSETS = [
  './', './admin.css', './admin.js', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png',
  '../js/vendor/supabase-auth.js', '../js/data.js',
  '../fonts/barlow-latin-400-normal.woff2', '../fonts/barlow-latin-600-normal.woff2', '../fonts/barlow-latin-700-normal.woff2',
  '../fonts/barlow-condensed-latin-700-normal.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('musclemap-admin-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const key = req.mode === 'navigate' ? './' : req;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.match(key, { ignoreSearch: true }).then(r => r || Promise.reject(new Error('offline'))))
  );
});
