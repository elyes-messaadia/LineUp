const CACHE_NAME = 'lineup-cache-v1';
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icon.png',
  '/assets/notify.mp3'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes avec stratégie "Network First"
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes vers l'API
  if (event.request.url.includes('/api/') || event.request.url.includes('lineup-backend')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Vérifier si la réponse est valide
        if (!response || response.status === 404 || response.type !== 'basic') {
          return response;
        }

        // Cloner la réponse
        const responseToCache = response.clone();

        // Mettre en cache la réponse valide
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // En cas d'erreur réseau, essayer le cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Si pas en cache, retourner la page hors-ligne
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            return new Response('', {
              status: 408,
              statusText: 'Request timed out.'
            });
          });
      })
  );
}); 