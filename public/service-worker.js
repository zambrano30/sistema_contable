const CACHE_NAME = 'sistema-contable-v1';
const RUNTIME_CACHE = 'sistema-contable-runtime-v1';

// URLs que SIEMPRE queremos cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Limpiando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Network First, Fall back to Cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // No cachear requests a APIs externas críticas en GET fallidas
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          if (request.method === 'GET') {
            return caches.match(request);
          }
          return new Response('Offline - No hay respuesta en caché', { status: 503 });
        })
    );
    return;
  }

  // Para APIs locales y archivos estáticos
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          // Servir del caché primero
          if (response) {
            // Actualizar caché en background
            fetch(request)
              .then(freshResponse => {
                if (freshResponse && freshResponse.status === 200) {
                  caches.open(RUNTIME_CACHE).then(cache => {
                    cache.put(request, freshResponse.clone());
                  });
                }
              })
              .catch(() => {});
            return response;
          }

          // Si no está en caché, intentar red
          return fetch(request)
            .then(response => {
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }

              // Cachear respuesta exitosa
              const responseToCache = response.clone();
              caches.open(RUNTIME_CACHE).then(cache => {
                cache.put(request, responseToCache);
              });

              return response;
            })
            .catch(() => {
              // Offline y no en caché
              return caches.match('/index.html');
            });
        })
    );
  } else {
    // Para POST, PUT, DELETE, etc - intentar network primero
    event.respondWith(
      fetch(request)
        .then(response => {
          // Notificar al cliente que la solicitud fue exitosa
          if (response.ok) {
            event.waitUntil(
              self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                  client.postMessage({
                    type: 'SYNC_SUCCESS',
                    url: request.url
                  });
                });
              })
            );
          }
          return response;
        })
        .catch(() => {
          // Offline - guardar para sincronizar después
          event.waitUntil(
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'OFFLINE_REQUEST',
                  method: request.method,
                  url: request.url,
                  body: request.body
                });
              });
            })
          );
          return new Response(JSON.stringify({ 
            status: 'pending', 
            message: 'Sincronizaremos cuando haya conexión' 
          }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  }
});

// Sincronización en background (si el navegador lo soporta)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_NOW' });
        });
      })
    );
  }
});

// Mensajes desde el cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});
