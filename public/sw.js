// Étape 9 — Service worker basique AIR ZEN Flow.
// Objectif v1 : installabilité PWA + cache léger des assets statiques.
// Pas de mode hors-ligne complet (les données vivent dans Firestore).
const CACHE = "airzen-flow-v1";
const ASSETS_PRECACHES = ["/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS_PRECACHES)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Purge les caches des versions précédentes.
  event.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Assets statiques versionnés : cache d'abord (ils ne changent jamais).
  const estStatique =
    url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");

  if (estStatique) {
    event.respondWith(
      caches.match(event.request).then(
        (reponse) =>
          reponse ??
          fetch(event.request).then((fraiche) => {
            const clone = fraiche.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
            return fraiche;
          }),
      ),
    );
  }
  // Tout le reste (pages, API, Firestore) : réseau normal, sans interception.
});
