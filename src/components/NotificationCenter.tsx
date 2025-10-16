import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type InAppNotification = {
  id: string
  title: string
  body?: string
  timestamp: number
}

export default function NotificationCenter() {
  const [items, setItems] = useState<InAppNotification[]>([])
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setMounted(true)

    const handler = (e: any) => {
      console.log('NotificationCenter: event received', e);
      const data = e.detail || e.data || {};
      console.log('NotificationCenter: normalized data', data);
      const id = 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
      const item: InAppNotification = {
        id,
        title: data.title || 'Notificación',
        body: data.body || '',
        timestamp: Date.now()
      }
      setItems(prev => [item, ...prev])
      setTimeout(() => setVisible(true), 16)

      setTimeout(() => {
        dismiss(id)
      }, 8000)
    }

    window.addEventListener('push-fallback', handler as EventListener)
    window.addEventListener('in-app-notification', handler as EventListener)

    if (navigator.serviceWorker) {
      try {
        navigator.serviceWorker.addEventListener('message', (evt: any) => {
          try {
            if (evt && evt.data && evt.data.type === 'push-fallback') {
              console.log('NotificationCenter: received SW message', evt.data);
              handler({ detail: evt.data });
            }
          } catch (err) {
            console.error('NotificationCenter: error handling SW message', err);
          }
        });
      } catch (err) {
        console.warn('NotificationCenter: serviceWorker listener not available', err);
      }
    }

    return () => {
      window.removeEventListener('push-fallback', handler as EventListener)
      window.removeEventListener('in-app-notification', handler as EventListener)
    }
  }, [])

  const dismiss = (id: string) => {
    setVisible(false)
    setTimeout(() => {
      setItems(prev => prev.filter(p => p.id !== id))
    }, 320)
  }

  if (items.length === 0) return null

  const first = items[0]
  console.log('NotificationCenter: rendering item', first)

  const backdropDynamic: React.CSSProperties = {
    ...backdropStyle,
    opacity: visible ? 1 : 0,
    transition: 'opacity 260ms ease'
  }

  const modalDynamic: React.CSSProperties = {
    ...modalStyle,
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)',
    transition: 'opacity 280ms cubic-bezier(.2,.9,.2,1), transform 320ms cubic-bezier(.2,.9,.2,1)'
  }

  const modal = (
    <div style={backdropDynamic}>
      <div style={modalDynamic} role="dialog" aria-live="polite">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 18 }}>{first.title}</strong>
          <button onClick={() => dismiss(first.id)} style={closeBtnStyle}>✕</button>
        </div>
        {first.body && <div style={{ marginTop: 10 }}>{first.body}</div>}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => dismiss(first.id)} style={actionBtnStyle}>Cerrar</button>
        </div>
      </div>
    </div>
  )

  if (!mounted || typeof document === 'undefined') {
    return modal
  }

  return createPortal(modal, document.body)
}


const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#fff',
  cursor: 'pointer'
}

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2147483647,
  pointerEvents: 'auto'
}

const modalStyle: React.CSSProperties = {
  background: '#0f1724',
  color: '#fff',
  padding: 20,
  borderRadius: 14,
  boxShadow: '0 20px 60px rgba(2,6,23,0.8)',
  width: 'min(90vw, 520px)',
  pointerEvents: 'auto',
  border: '1px solid rgba(255,255,255,0.06)'
}

const actionBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg,#3b82f6,#6366f1)',
  color: '#fff',
  border: 'none',
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer'
}
