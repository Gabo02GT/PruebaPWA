import { useState, useEffect } from 'react'
import './App.css'
import BodyCalculator from './components/BodyCalculator'
import NewRoutine from './screens/NewRoutine'
import Progress from './screens/Progress'
import Diet from './screens/Diet'
import NotificationCenter from './components/NotificationCenter'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [currentSection, setCurrentSection] = useState('home')
  const [showCalculator, setShowCalculator] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setIsLoading(false), 500) 
          return 100
        }
        return prev + 2
      })
    }, 80) 


    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <div className="gym-logo">
            <span className="logo-icon">💪</span>
            <h1>Gym Tracker Pro</h1>
            <p>Tu compañero de entrenamiento definitivo</p>
          </div>
          
          <div className="loading-container">
            <div className="loading-bar">
              <div 
                className="loading-progress" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="loading-text">{loadingProgress}% Cargando...</p>
          </div>
          
          <div className="splash-features">
            <div className="feature-item">🎯 Rutinas personalizadas</div>
            <div className="feature-item">📊 Seguimiento de progreso</div>
            <div className="feature-item">🔥 Motivación diaria</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1>💪 Gym Tracker Pro</h1>
          {!isOnline && (
            <div className="offline-indicator">
              🔴 Offline
            </div>
          )}
        </div>
        <nav className="app-nav">
          <button
            className={`nav-btn ${currentSection === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentSection('home')}
          >
            🏠 Inicio
          </button>
          <button 
            className={`nav-btn ${currentSection === 'routines' ? 'active' : ''}`}
            onClick={() => setCurrentSection('routines')}
          >
            📋 Rutinas
          </button>
          {/* Ejercicios removed - use Rutinas instead */}
          <button 
            className={`nav-btn ${currentSection === 'diet' ? 'active' : ''}`}
            onClick={() => setCurrentSection('diet')}
          >
            🍎 Dieta
          </button>
          <button 
            className={`nav-btn ${currentSection === 'progress' ? 'active' : ''}`}
            onClick={() => setCurrentSection('progress')}
          >
            📈 Progreso
          </button>
        </nav>
      </header>

  <main className="app-main">
    <NotificationCenter />
    {currentSection === 'home' && (
      <div className="home-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h2>🏋️‍♂️ Transforma tu entrenamiento</h2>
            <p>La PWA más completa para tracking de gimnasio. Diseñada por atletas, para atletas.</p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">500K+</span>
                <span className="stat-label">Ejercicios registrados</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Usuarios activos</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">99%</span>
                <span className="stat-label">Disponibilidad offline</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h3>🚀 Acciones Rápidas</h3>
          <div className="quick-actions">
            <div className="action-card">
              <div className="card-icon">🎯</div>
              <h4>Nueva Rutina</h4>
              <p>Crea rutinas personalizadas y alcanza tus objetivos</p>
              <button className="action-btn" onClick={() => setCurrentSection('routines')}>
                <span>Crear Rutina</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
            <div className="action-card">
              <div className="card-icon">🔥</div>
              <h4>Rutinas</h4>
              <p>Explora y gestiona tus rutinas y ejercicios relacionados</p>
              <button className="action-btn" onClick={() => setCurrentSection('routines')}>
                <span>Explorar</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
            <div className="action-card">
              <div className="card-icon">📈</div>
              <h4>Mi Progreso</h4>
              <p>Analiza tu evolución con estadísticas detalladas</p>
              <button className="action-btn" onClick={() => setCurrentSection('progress')}>
                <span>Ver Stats</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
            <div className="action-card">
              <div className="card-icon">📊</div>
              <h4>Calculadora Corporal</h4>
              <p>Calcula tu IMC, % grasa corporal y obtén recomendaciones</p>
              <button className="action-btn" onClick={() => setShowCalculator(true)}>
                <span>Calcular</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>
        </section>

        {/* Installation Guide */}
        <section className="installation-section">
          <div className="install-container">
            <h3>📱 ¿Cómo instalar Gym Tracker Pro?</h3>
            <p className="install-subtitle">Convierte esta web en una app nativa en tu dispositivo</p>
            <div className="install-steps">
              <div className="install-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>🌐 Abre en tu navegador</h4>
                  <p>Visita la app desde <strong>Chrome, Edge o Safari</strong></p>
                </div>
              </div>
              <div className="install-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>⬇️ Busca el botón "Instalar"</h4>
                  <p>Aparecerá en la barra de direcciones o menú del navegador</p>
                </div>
              </div>
              <div className="install-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>🎉 ¡Listo para usar!</h4>
                  <p>La app se instalará como una aplicación nativa</p>
                </div>
              </div>
            </div>
            <div className="install-benefits">
              <h4>✨ Beneficios de instalar:</h4>
              <ul>
                <li>🚀 <strong>Acceso rápido</strong> - Ícono en tu pantalla de inicio</li>
                <li>📱 <strong>Experiencia nativa</strong> - Se ve y funciona como una app</li>
                <li>🔄 <strong>Funciona offline</strong> - Usa la app sin conexión a internet</li>
                <li>🔔 <strong>Notificaciones</strong> - Recordatorios de entrenamiento</li>
                <li>💾 <strong>Menos espacio</strong> - Más liviana que apps tradicionales</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Training Features */}
        <section className="features-section">
          <h3>💪 Características Premium</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h4>Sistema de Logros</h4>
              <p>Desbloquea medallas y compite contigo mismo</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h4>Planificador Semanal</h4>
              <p>Organiza tus entrenamientos de forma inteligente</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎵</div>
              <h4>Playlist Motivacional</h4>
              <p>Música perfecta para cada tipo de ejercicio</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h4>Comparte Progreso</h4>
              <p>Conecta con amigos y mantente motivado</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h4>IA Personal Trainer</h4>
              <p>Recomendaciones personalizadas basadas en IA</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h4>Progreso Visual</h4>
              <p>Fotos de antes/después con comparaciones</p>
            </div>
          </div>
        </section>

        {/* Motivational Section */}
        <section className="motivation-section">
          <div className="motivation-content">
            <h3>🔥 Frase del Día</h3>
            <blockquote className="daily-quote">"El dolor que sientes hoy será la fortaleza que sentirás mañana"</blockquote>
            <div className="motivation-stats">
              <div className="motivation-item"><span className="motivation-number">21</span><span className="motivation-label">días para formar un hábito</span></div>
              <div className="motivation-item"><span className="motivation-number">365</span><span className="motivation-label">días para transformarte</span></div>
            </div>
          </div>
        </section>
      </div>
    )}

    {/* Conditional Screens */}
    <section className="screens-container">
  {currentSection === 'routines' && <NewRoutine />}
      {currentSection === 'diet' && <Diet />}
      {currentSection === 'progress' && <Progress />}
    </section>
  </main>

      <footer className="app-footer">
        <p>💪 Gym Tracker Pro</p>
      </footer>

      {/* NotificationTester removed for production/demo */}

      {/* Calculadora de Composición Corporal */}
      {showCalculator && (
        <BodyCalculator onClose={() => setShowCalculator(false)} />
      )}
    </div>
  )
}

export default App