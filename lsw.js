const cacheName = "lector-v0.23";
const files = [
  "/lector/",
  "/lector/?source=pwa",
  "/lector/lector.js",
  "/lector/favicon.ico",
  "/lector/manifest.json",
  "/lector/lector-192.png",
  "/lector/lector-512.png",
  "https://szentiras.hu/api/books/KNB",
];

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.open(cacheName)
      .then(cache =>
        cache.match(event.request)
          .then(async response => {
            if (response) return response;
            const realResponse = await fetch(event.request);
            if (event.request.url.startsWith("https://szentiras.hu/") && realResponse.ok) {
              await cache.put(event.request, realResponse.clone());
            }
            return realResponse;
          })
  ));
});

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(files);
    })
  );
});

self.addEventListener("message", event => {
  const msg = event.data;
  if (msg["action"] === "hi") {
    const dash = cacheName.indexOf("-");
    event.source.postMessage({"action": "greetings", "version": cacheName.substring(dash + 1)});
  }
});
