// Habesha Hub app service worker.
// App shell is cached on install; directory data is network-first so listings stay fresh,
// with the last good copy served when the phone is offline.
const VERSION = "202611181506";
const SHELL = `hh-shell-${VERSION}`;
const RUNTIME = "hh-runtime";
const SHELL_FILES = [
  "./",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "/directory-data.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("hh-shell-") && k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(request);
  const fresh = fetch(request).then(res => {
    if (res.ok || res.type === "opaque") cache.put(request, res.clone());
    return res;
  }).catch(() => hit);
  return hit || fresh;
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (req.mode === "navigate" && url.origin === location.origin && url.pathname.startsWith("/app")) {
    event.respondWith(networkFirst(new Request("./", { credentials: "same-origin" }), SHELL));
    return;
  }
  if (url.origin === location.origin && url.pathname === "/directory-data.js") {
    event.respondWith(networkFirst(req, SHELL));
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" ||
      (url.origin === location.origin && url.pathname.startsWith("/app/"))) {
    event.respondWith(staleWhileRevalidate(req));
  }
});
