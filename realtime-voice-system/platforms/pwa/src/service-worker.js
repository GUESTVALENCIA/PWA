/**
 * Service Worker - Progressive Web App
 * Caching strategy: Cache-first para assets, Network-first para API
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `realtime-voice-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/js/app.js',
  '/css/styles.css',
  '/public/icon-192.png',
  '/public/icon-512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('❌ Cache installation failed:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log(`🗑️ Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip ws:// and wss:// (WebSocket)
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Cache-first for app assets
  if (url.origin === self.location.origin && (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  )) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }

          return fetch(request)
            .then((response) => {
              // Clone response for caching
              const clonedResponse = response.clone();

              if (response.status === 200) {
                caches.open(CACHE_NAME)
                  .then((cache) => cache.put(request, clonedResponse))
                  .catch(() => {}); // Silently fail on cache error
              }

              return response;
            })
            .catch(() => {
              // Fallback for offline
              if (request.destination === 'image') {
                return new Response(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ddd" width="100" height="100"/></svg>',
                  { headers: { 'Content-Type': 'image/svg+xml' } }
                );
              }
              return new Response('Offline');
            });
        })
    );
    return;
  }

  // Network-first for API calls (WebSocket no pasa por aquí)
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, clonedResponse))
              .catch(() => {});
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((response) => response || new Response('Offline'));
        })
    );
    return;
  }

  // Default strategy
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME)
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch(() => {
        event.ports[0].postMessage({ success: false });
      });
  }
});

// Background sync (opcional - para futuras features)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-calls') {
    event.waitUntil(
      // Sincronizar llamadas pendientes
      Promise.resolve()
    );
  }
});

// Push notifications (opcional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nueva notificación',
    icon: '/public/icon-192.png',
    badge: '/public/icon-72.png',
    tag: 'realtime-voice-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Llamadas Enterprise', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Si hay cliente abierto, enfócalo
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].url === '/' && 'focus' in clientList[i]) {
            return clientList[i].focus();
          }
        }
        // Si no, abre uno nuevo
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

console.log('📱 Service Worker loaded');
