import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('APP ENTRY: main.tsx executing');
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registro del Service Worker con notificaciones
if ('serviceWorker' in navigator) {
  // En desarrollo, desregistrar cualquier SW anterior para evitar servir módulos cacheados
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  window.addEventListener('load', async () => {
    try {
      if (isLocalhost) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) {
          console.log('Unregistering service worker (dev):', r);
          await r.unregister();
        }
        // Also try to clear SW-controlled clients by reloading once
        if (navigator.serviceWorker.controller) {
          console.log('Reloading to clear service worker-controlled cache');
          window.location.reload();
          return;
        }
      }

      // Solo (re)registrar el SW en producción o cuando no haya conflicto
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registrado con éxito:', registration);

      // Solicitar permisos de notificación
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('Permisos de notificación:', permission);

        if (permission === 'granted') {
          setTimeout(() => {
            new Notification('💪 ¡Bienvenido a Gym Tracker Pro!', {
              body: 'Tu app está lista para funcionar offline. ¡Empieza a registrar tus entrenamientos!',
              icon: '/icons/icon.png',
              tag: 'welcome'
            });
          }, 3000);
        }
      }

      // Programar recordatorios de entrenamiento
      if ('Notification' in window && Notification.permission === 'granted') {
        setTrainingReminders();
      }

    } catch (registrationError) {
      console.log('SW falló al registrarse:', registrationError);
    }
  });
}

// Función para programar recordatorios de entrenamiento
function setTrainingReminders() {
  // Recordatorio diario a las 6:00 PM
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(18, 0, 0, 0);
  
  // Si ya pasó la hora de hoy, programar para mañana
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  const timeUntilReminder = reminderTime.getTime() - now.getTime();
  
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('🏋️‍♂️ ¡Hora de entrenar!', {
        body: '¿Ya registraste tu entrenamiento de hoy? ¡Dale que puedes!',
        icon: '/icons/icon.png',
        tag: 'daily-reminder'
      });
      
      // Programar el siguiente recordatorio (24 horas después)
      setInterval(() => {
        new Notification('🏋️‍♂️ ¡Hora de entrenar!', {
          body: '¿Ya registraste tu entrenamiento de hoy? ¡Dale que puedes!',
          icon: '/icons/icon.png',
          tag: 'daily-reminder'
        });
      }, 24 * 60 * 60 * 1000); // 24 horas
    }
  }, timeUntilReminder);
}

// Detectar conexión online/offline
window.addEventListener('online', () => {
  console.log('Conexión restaurada');
  if (Notification.permission === 'granted') {
    new Notification('🌐 Conexión restaurada', {
      body: 'Sincronizando datos guardados...',
      icon: '/icons/icon.png',
      tag: 'connection-restored'
    });
  }
});

window.addEventListener('offline', () => {
  console.log('Conexión perdida - Modo offline');
  if (Notification.permission === 'granted') {
    new Notification('📡 Modo offline activado', {
      body: 'Tus datos se guardarán localmente y se sincronizarán cuando regrese la conexión',
      icon: '/icons/icon.png',
      tag: 'offline-mode'
    });
  }
});