import { self } from "$app/service-worker";
import { assets, immutable, prerendered } from "$app/manifest";
import { version } from "$app/env";
const cacheName = `hearth-shell-${version}`;
const paths = [...immutable, ...assets, ...prerendered].map(
  (file) => new URL(file.path, self.registration.scope).href,
);
const shell = new URL("./", self.registration.scope).href;
const allowed = new Set([...paths, shell]);
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll([...allowed])),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("hearth-shell-") && key !== cacheName)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") void self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  )
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          return (
            (await (await caches.open(cacheName)).match(shell)) ??
            Response.error()
          );
        }
      })(),
    );
  } else if (allowed.has(request.url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(cacheName);
        return (await cache.match(request)) ?? fetch(request);
      })(),
    );
  }
});
