const CACHE_NAME = "versiculo-cache-v2";
const urlsToCache = ["/", "/index.html", "/style.css", "/script.js"];

// INSTALL
self.addEventListener("install", (event) => {
  self.skipWaiting(); // ativa imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // remove caches antigos
          }
        }),
      ),
    ),
  );
  self.clients.claim(); // assume controle imediato
});

// FETCH → Stale While Revalidate
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });

      return cachedResponse || fetchPromise;
    }),
  );
});
