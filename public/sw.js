
const CACHE_NAME = 'gym-tracker-v3';
const STATIC_CACHE = 'gym-tracker-static-v3';
const DYNAMIC_CACHE = 'gym-tracker-dynamic-v3';
const IMAGE_CACHE = 'gym-tracker-images-v3';

// Evitar que el Service Worker haga caching agresivo en desarrollo (localhost)
const IS_LOCALHOST = self.location && (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1');
if (IS_LOCALHOST) {
  console.log('Service Worker: running on localhost — skipping install and caching (dev mode)');
  // No registrar event listeners en modo desarrollo para evitar servir archivos cacheados
  // Esto permite que Vite HMR funcione correctamente.
  return;
}

// App Shell - archivos críticos para cache-first
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icons/icon.png',
  '/offline.html'
];

// Archivos estáticos para cache-first
const STATIC_ASSETS = [
  '/manifest.json'
];

// Endpoint para sincronización (simulado)
const SYNC_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando v3...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)),
      caches.open(DYNAMIC_CACHE),
      caches.open(IMAGE_CACHE)
    ]).then(() => {
      console.log('Service Worker: Todos los caches inicializados');
      return self.skipWaiting();
    })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activado v3');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Mantener solo los caches actuales
          if (![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(cacheName)) {
            console.log('Service Worker: Eliminando cache antigua', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Estrategias de cacheo avanzadas
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache-first para App Shell y archivos estáticos
  if (isAppShell(request) || isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  }
  // Stale-while-revalidate para imágenes
  else if (isImage(request)) {
    event.respondWith(staleWhileRevalidateStrategy(request, IMAGE_CACHE));
  }
  // Network-first para datos dinámicos
  else if (isDynamicContent(request)) {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
  }
  // Cache-first como fallback
  else {
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
  }
});

// Funciones auxiliares para determinar tipo de recurso
function isAppShell(request) {
  return APP_SHELL.some(url => request.url.includes(url));
}

function isStaticAsset(request) {
  return request.url.includes('.css') || 
         request.url.includes('.js') || 
         request.url.includes('/manifest.json');
}

function isImage(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(request.url);
}

function isDynamicContent(request) {
  return request.url.includes('/api/') || 
         request.method === 'POST' ||
         request.url.includes('jsonplaceholder');
}

// Estrategia Cache-first
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('SW: Cache-first hit:', request.url);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('SW: Cache-first fallback para:', request.url);
    // Servir página offline personalizada para documentos
    if (request.destination === 'document') {
      return caches.match('/offline.html') || caches.match('/');
    }
    return new Response('Offline', { status: 503 });
  }
}

// Estrategia Network-first
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    console.log('SW: Network-first success:', request.url);
    return networkResponse;
  } catch (error) {
    console.log('SW: Network-first fallback a cache:', request.url);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Estrategia Stale-while-revalidate
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse && networkResponse.status === 200) {
      const cache = caches.open(cacheName);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    console.log('SW: Stale-while-revalidate network failed:', request.url);
  });

  console.log('SW: Stale-while-revalidate:', request.url);
  return cachedResponse || fetchPromise;
}

// Background Sync para sincronización de datos
self.addEventListener('sync', (event) => {
  console.log('SW: Background Sync activado:', event.tag);
  
  if (event.tag === 'sync-body-measurements') {
    event.waitUntil(syncBodyMeasurements());
  }
});

// Función para sincronizar mediciones corporales
async function syncBodyMeasurements() {
  try {
    console.log('SW: Iniciando sincronización de mediciones...');
    
    // Obtener datos no sincronizados desde IndexedDB
    const dbRequest = indexedDB.open('GymTrackerDB', 1);
    
    return new Promise((resolve, reject) => {
      dbRequest.onsuccess = async (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['bodyCompositions'], 'readwrite');
        const store = transaction.objectStore('bodyCompositions');
        const index = store.index('synced');
        const unsyncedRequest = index.getAll(false);
        
        unsyncedRequest.onsuccess = async () => {
          const unsyncedData = unsyncedRequest.result;
          console.log('SW: Datos sin sincronizar encontrados:', unsyncedData.length);
          
          if (unsyncedData.length === 0) {
            resolve();
            return;
          }

          // Enviar cada medición al servidor
          for (const measurement of unsyncedData) {
            try {
              const response = await fetch(SYNC_ENDPOINT, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'body_measurement',
                  data: measurement,
                  timestamp: new Date().toISOString()
                })
              });

              if (response.ok) {
                // Marcar como sincronizado en IndexedDB
                measurement.synced = true;
                store.put(measurement);
                console.log('SW: Medición sincronizada:', measurement.id);
                
                // Enviar notificación de éxito
                self.registration.showNotification('📊 Datos sincronizados', {
                  body: `Medición del ${new Date(measurement.date).toLocaleDateString()} enviada correctamente`,
                  icon: '/icons/icon.png',
                  tag: 'sync-success'
                });
              }
            } catch (error) {
              console.error('SW: Error sincronizando medición:', error);
            }
          }
          resolve();
        };
        
        unsyncedRequest.onerror = () => reject(unsyncedRequest.error);
      };
      
      dbRequest.onerror = () => reject(dbRequest.error);
    });
  } catch (error) {
    console.error('SW: Error en Background Sync:', error);
    throw error;
  }
}

// Manejo de notificaciones push
self.addEventListener('push', (event) => {
  console.log('SW: Push notification recibida');
  
  const options = {
    body: 'Tienes nuevas actualizaciones en Gym Tracker Pro',
    icon: '/icons/icon.png',
    badge: '/icons/icon.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver ahora',
        icon: '/icons/icon.png'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || '💪 Gym Tracker Pro';
  }

  event.waitUntil(
    self.registration.showNotification('💪 Gym Tracker Pro', options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification click recibido');

  event.notification.close();

  if (event.action === 'explore') {
    // Abrir la aplicación
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Solo cerrar la notificación
    console.log('SW: Notificación cerrada por el usuario');
  } else {
    // Clic general en la notificación
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Mensaje desde el cliente principal
self.addEventListener('message', (event) => {
  console.log('SW: Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});