import { useState } from 'react';

export default function NotificationTester() {
  const [permission, setPermission] = useState(Notification.permission);

  const requestPermission = async () => {
    if (!('Notification' in window)) return alert('Notificaciones no soportadas');
    const p = await Notification.requestPermission();
    setPermission(p);
  };

  const showLocalNotification = async () => {
    if (Notification.permission !== 'granted') return alert('Otorga permiso primero');
    new Notification('Notificación local', {
      body: 'Esta es una notificación creada desde el cliente.',
      icon: '/icons/icon.png',
    });
  };

  const simulatePush = async () => {
    if (!('serviceWorker' in navigator)) return alert('Service Worker no disponible');
    const registration = await navigator.serviceWorker.ready;
    const payload = {
      title: 'Push simulado',
      body: 'Esto viene del Service Worker (simulado).',
      data: { source: 'simulation' }
    };
    registration.active?.postMessage({ type: 'simulate-push', payload });

    try {
      const evt = new CustomEvent('push-fallback', { detail: payload });
      window.dispatchEvent(evt as any);
      console.log('NotificationTester: dispatched local push-fallback event');
    } catch (err) {
      console.error('NotificationTester: error dispatching local event', err);
    }
  };

  return (
    <div style={{ padding: 12, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
      <h3>Notificaciones</h3>
      <p>Permiso actual: <strong>{permission}</strong></p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={requestPermission}>Pedir permiso</button>
        <button onClick={showLocalNotification}>Mostrar notificación local</button>
        <button onClick={simulatePush}>Simular Push (via SW)</button>
      </div>
    </div>
  );
}
