export interface ServiceWorkerFactoryOptions {
  cacheName: string;
  assets: string[];
}

export function createServiceWorkerSource(options: ServiceWorkerFactoryOptions): string {
  const assetsLiteral = JSON.stringify(options.assets);
  const cache = JSON.stringify(options.cacheName);
  return `const CACHE = ${cache};
const ASSETS = ${assetsLiteral}.map(p => {
  const base = self.location.pathname.endsWith('sw.js')
    ? self.location.pathname.slice(0, -'sw.js'.length)
    : '/';
  return base + p.replace(/^\\//, '');
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res.ok && e.request.url.startsWith(self.location.origin)) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
`;
}
