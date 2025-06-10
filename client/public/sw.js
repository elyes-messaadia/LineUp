const CACHE_NAME = 'lineup-cache-v1';
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
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
  // Ignorer les requêtes chrome-extension
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Ne pas intercepter les requêtes vers l'API
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('localhost:5000') || 
      event.request.url.includes('lineup-backend')) {
    return;
  }

  // Gérer spécialement les routes React SPA
  const url = new URL(event.request.url);
  const isReactRoute = url.pathname.startsWith('/dashboard/') || 
                       url.pathname.startsWith('/queue') ||
                       url.pathname.startsWith('/login') ||
                       url.pathname.startsWith('/register');

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Pour les routes React qui retournent 404, servir index.html
        if (isReactRoute && (!response || response.status === 404)) {
          return caches.match('/index.html').then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return fetch('/index.html');
          });
        }

        // Vérifier si la réponse est valide
        if (!response || response.status === 404 || response.type !== 'basic') {
          return response;
        }

        // Ne pas mettre en cache les réponses non GET
        if (event.request.method !== 'GET') {
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
            
            // Pour les routes React, servir index.html du cache
            if (isReactRoute) {
              return caches.match('/index.html').then(cachedResponse => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                // Si pas d'index.html en cache, retourner la page hors-ligne
                return caches.match(OFFLINE_URL);
              });
            }
            
            // Si pas en cache, retourner la page hors-ligne
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            return new Response('Resource not available offline', {
              status: 408,
              statusText: 'Request timed out.'
            });
          });
      })
  );
});

// 🔔 Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('📱 Notification push reçue:', event.data?.text());
  
  let notificationData = {
    title: 'LineUp',
    body: 'Vous avez une nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'lineup-notification',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (error) {
      console.error('❌ Erreur lors du parsing de la notification:', error);
      notificationData.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Voir',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// 🖱️ Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Clic sur la notification:', event.notification.tag);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Action par défaut ou action 'view'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focus
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Sinon ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        const targetUrl = event.notification.data?.url || '/';
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 🔕 Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notification fermée:', event.notification.tag);
  
  // Optionnel: envoyer des statistiques d'engagement
  if (event.notification.data?.trackClose) {
    // Ici on pourrait envoyer une requête analytics
    console.log('📊 Tracking fermeture notification');
  }
}); 