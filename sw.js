/*
 * Service Worker - Gestão Financeira Pro
 * Estratégia: Cache-first para assets estáticos, Network-first para dados dinâmicos.
 */
const CACHE_VERSION = 'ffpro-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/themes.css',
  './js/app.js',
  './js/utils/format.js',
  './js/utils/date.js',
  './js/utils/dom.js',
  './js/db/database.js',
  './js/db/repository.js',
  './js/modules/state.js',
  './js/modules/router.js',
  './js/modules/dashboard.js',
  './js/modules/entries.js',
  './js/modules/accounts.js',
  './js/modules/installments.js',
  './js/modules/closing.js',
  './js/modules/backup.js',
  './js/modules/charts.js',
  './js/modules/notifications.js',
  './js/modules/budgetGoals.js',
  './js/modules/calendar.js',
  './js/modules/search.js',
  './js/modules/export.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key.startsWith('ffpro-') && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isCDN = url.origin !== self.location.origin;

  if (isCDN) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch (err) {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientsArr) => {
      const hadWindow = clientsArr.some((client) => {
        if (client.url.includes('index.html')) { client.focus(); return true; }
        return false;
      });
      if (!hadWindow) self.clients.openWindow('./index.html');
    })
  );
});
