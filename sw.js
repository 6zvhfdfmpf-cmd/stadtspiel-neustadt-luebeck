const CACHE = "stadtspiel-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./lehrkraefte.html",
  "./css/styles.css",
  "./js/data.js",
  "./js/engine.js",
  "./js/qr.js",
  "./js/export.js",
  "./js/audio.js",
  "./js/game.js",
  "./favicon.svg",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request))
  );
});
