// Tiene la pagina disponibile anche senza connessione.
// Se modifichi index.html, cambia il numero di versione qui sotto.
const CACHE = "karaoke-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.mode === "navigate") {
    // Pagina: prima la rete (per gli aggiornamenti), se manca la connessione la copia salvata
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("./index.html", c)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // Icone e font: prima la copia salvata
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r;
  })));
});
