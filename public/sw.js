
const CACHE_NAME = 'gym-tracker-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Forzar activación inmediata
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando cache antigua', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control inmediatamente
      return self.clients.claim();
    })
  );
});

// Interceptar peticiones (Fetch)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en cache, devolver del cache
        if (response) {
          console.log('SW: Sirviendo desde cache:', event.request.url);
          return response;
        }
        // Si no, hacer petición a la red y cachear
        console.log('SW: Descargando desde red:', event.request.url);
        return fetch(event.request).then((response) => {
          // Solo cachear respuestas exitosas
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clonar respuesta para cachear
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        }).catch(() => {
          // Si falla la red, intentar servir página offline básica
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});