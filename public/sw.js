const CACHE_NAME = 'gym-tracker-v3';
const STATIC_CACHE = 'gym-tracker-static-v3';
const DYNAMIC_CACHE = 'gym-tracker-dynamic-v3';
const IMAGE_CACHE = 'gym-tracker-images-v3';

const IS_LOCALHOST = self.location && (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1');
if (IS_LOCALHOST) {
  console.log('Service Worker: running on localhost — dev mode');

}

const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icons/icon.png',
  '/offline.html',
  '/index.html',
  '/index.css',
  '/App.css',
  '/src/main.tsx'
];

const STATIC_ASSETS = [
  '/manifest.json',
  '/index.html',
  '/index.css',
  '/App.css'
];

const SYNC_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';

self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando v3...');
  if (!IS_LOCALHOST) {
    event.waitUntil(
      Promise.all([
        caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)),
        caches.open(DYNAMIC_CACHE),
        caches.open(IMAGE_CACHE)
      ]).then(() => {
        console.log('Service Worker: Todos los caches inicializados');
        self.skipWaiting(); 
      })
    );
  }
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activado v3');
  if (!IS_LOCALHOST) {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(cacheName)) {
              console.log('Service Worker: Eliminando cache antigua', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => {
        self.clients.claim(); 
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  const isNavigation = request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  if (isNavigation || isAppShell(request) || isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  }
  else if (isImage(request)) {
    event.respondWith(staleWhileRevalidateStrategy(request, IMAGE_CACHE));
  }
  else if (isDynamicContent(request)) {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
  }
  else {
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
  }
});

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
    if (request.destination === 'document') {
      return caches.match('/offline.html') || caches.match('/');
    }
    return new Response('Offline', { status: 503 });
  }
}

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

self.addEventListener('sync', (event) => {
  console.log('SW: Background Sync activado:', event.tag);
  
  if (event.tag === 'sync-body-measurements') {
    event.waitUntil(syncBodyMeasurements());
  }
});

async function syncBodyMeasurements() {
  try {
    console.log('SW: Iniciando sincronización de mediciones...');
    
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
                measurement.synced = true;
                store.put(measurement);
                console.log('SW: Medición sincronizada:', measurement.id);
                
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

self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification click recibido');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    console.log('SW: Notificación cerrada por el usuario');
  } else {
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

self.addEventListener('message', (event) => {
  console.log('SW: Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'simulate-push') {
    const payload = event.data.payload || {};
    const title = payload.title || 'Notificación simulada';
    const options = {
      body: payload.body || 'Mensaje de prueba',
      icon: '/icons/icon.png',
      badge: '/icons/icon.png',
      data: payload.data || { simulated: true }
    };

    event.waitUntil((async () => {
      try {
        await self.registration.showNotification(title, options);
      } catch (err) {
        console.error('SW: Error mostrando notificación simulada:', err);
      }

      try {
        const fallbackMessage = { type: 'push-fallback', title, body: options.body, data: options.data };
        const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        clientList.forEach(client => client.postMessage(fallbackMessage));
        console.log('SW: Enviado mensaje fallback a clientes (simulate-push)', clientList.length);
      } catch (err) {
        console.error('SW: Error enviando fallback a clientes (simulate-push):', err);
      }
    })());
    return;
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});