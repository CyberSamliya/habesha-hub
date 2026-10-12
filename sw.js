const CACHE = 'habesha-hub-shell-v1';
const SHELL = ['/habesha-hub/', '/habesha-hub/index.html', '/habesha-hub/styles.css', '/habesha-hub/manifest.webmanifest', '/habesha-hub/assets/icon.svg'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('habesha-hub-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => { const request = event.request; if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return; if (request.mode === 'navigate') { event.respondWith(fetch(request).catch(() => caches.match('/habesha-hub/index.html'))); return; } event.respondWith(fetch(request).catch(() => caches.match(request))); });
