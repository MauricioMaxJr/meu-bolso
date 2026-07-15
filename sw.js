/* Meu Bolso — service worker: app shell offline (cache-first) */
const VERSAO = "meubolso-v6.1";
const ARQUIVOS = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./icons.js",
  "./fonts/InterVariable.woff2",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", ev => {
  ev.respondWith(
    caches.match(ev.request, { ignoreSearch: true }).then(hit =>
      hit || fetch(ev.request).then(res => {
        if (ev.request.method === "GET" && res.ok && new URL(ev.request.url).origin === location.origin) {
          const clone = res.clone();
          caches.open(VERSAO).then(c => c.put(ev.request, clone));
        }
        return res;
      })
    )
  );
});
