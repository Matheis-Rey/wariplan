const CACHE = 'wariplan-v8';
const FILES = [
  './',
  'index.html',
  'manifest.json',
  'wariplan-icon.png'
];
const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.93.0';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await Promise.all(
        FILES.map((file) =>
          cache.add(file).catch(() => {
            console.log('Fichier non mis en cache :', file);
          })
        )
      );
      try {
        await cache.add(LIB);
      } catch (err) {
        console.log('Librairie Supabase non mise en cache (OK)');
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (url.href === LIB) {
    e.respondWith(
      caches.match(e.request).then((r) => r || fetch(e.request))
    );
    return;
  }
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r && r.ok) {
          const copie = r.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, copie));
        }
        return r;
      })
      .catch(async () => {
        return caches.match(e.request, { ignoreSearch: true });
      })
  );
});
