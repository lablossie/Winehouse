// sw.js — network-first met cache-fallback, zodat de app offline bruikbaar
// blijft met de laatst bekende data. VERHOOG CACHE_NAME BIJ ELKE DEPLOY
// (valkuil #7) — anders blijven mobiele gebruikers een oude versie zien.
const CACHE_NAME = 'wijnkelder-cache-v1';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/app.js',
  '/js/state.js',
  '/js/auth.js',
  '/js/model.js',
  '/js/utils.js',
  '/js/csv.js',
  '/js/render/chrome.js',
  '/js/render/voorraad.js',
  '/js/render/overigeTabs.js',
  '/js/render/itemCard.js',
  '/js/render/gauge.js',
  '/js/render/addEditModal.js',
  '/js/render/detailModal.js',
  '/js/render/photoImportModal.js',
  '/js/render/pairingModal.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((namen) => Promise.all(
      namen.filter((naam) => naam !== CACHE_NAME).map((naam) => caches.delete(naam)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nooit API-routes uit de cache serveren — anders zien gezinsleden
  // verouderde voorraadgegevens na elkaars wijzigingen (valkuil #8).
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const kopie = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, kopie)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html'))),
  );
});
