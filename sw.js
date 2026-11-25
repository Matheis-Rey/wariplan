const CACHE = 'wariplan-v6';
const FILES = [
  './',
  'index.html',
  'manifest.json',
  'wariplan-icon.png'
];
const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.93.0';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES).then(() => c.add(LIB).catch(() => {})))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Bibliothèque Supabase : servie depuis le cache pour fonctionner hors connexion
  if (url.href === LIB) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
    return;
  }
  // Tout ce qui n'est pas sur ce site (données Supabase, Wave...) passe directement par le réseau
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) {
          const copie = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copie));
        }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
