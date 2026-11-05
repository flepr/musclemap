/* MuscleMap — service worker
   Permet d'ouvrir l'app sans réseau (salle de sport en sous-sol…).
   Stratégie « réseau d'abord » : en ligne, on sert toujours la dernière version
   publiée (et on met le cache à jour) ; hors ligne, on sert la copie en cache.
   Les appels Microsoft (connexion, OneDrive) ne passent jamais par le cache. */
const CACHE = 'musclemap-v1';
const ASSETS = ['./', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];
const NAV_TIMEOUT = 5000;   // au-delà, réseau jugé trop lent : on sert le cache

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  const isNav = req.mode === 'navigate';
  // La page est rangée sous une clé unique, quels que soient ses paramètres (?code=… au retour de connexion)
  const key = isNav ? './' : req;

  const network = fetch(req).then(res => {
    if (res.ok && !res.redirected) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(key, copy));
    }
    return res;
  });

  const fromCache = () => caches.match(key, { ignoreSearch: true });

  if (isNav) {
    const timeout = new Promise((resolve, reject) => setTimeout(() => reject(new Error('timeout')), NAV_TIMEOUT));
    e.respondWith(
      Promise.race([network, timeout])
        .catch(() => fromCache().then(r => r || network))
    );
  } else {
    e.respondWith(network.catch(() => fromCache().then(r => r || Promise.reject(new Error('offline')))));
  }
});
