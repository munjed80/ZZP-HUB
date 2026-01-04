self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("zzp-hub-static-v1").then((cache) =>
      cache.addAll(["/", "/manifest.webmanifest", "/favicon.svg"]).catch(() => undefined),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("zzp-hub-") && key !== "zzp-hub-static-v1")
          .map((key) => caches.delete(key)),
      ),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const responseClone = response.clone();
        caches.open("zzp-hub-static-v1").then((cache) => cache.put(event.request, responseClone)).catch(() => undefined);
        return response;
      });
    }),
  );
});
