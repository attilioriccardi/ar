// Tiene in memoria la pagina, così funziona anche senza connessione.
// Se modifichi la pagina, cambia il numero di versione qui sotto.
const CACHE = 'capodanno-2027-v1';
const BASE = ['./', './index.html', './manifest.webmanifest', './icona-180.png', './icona-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))));
  self.clients.claim();
});
// Prima la copia salvata (subito, anche con wifi scarso), poi aggiornamento in sottofondo.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const salvata = await c.match(e.request, { ignoreSearch: true });
    const rete = fetch(e.request).then(r => {
      if (r.ok || r.type === 'opaque') c.put(e.request, r.clone());
      return r;
    }).catch(() => salvata);
    return salvata || rete;
  }));
});
