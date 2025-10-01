import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>💪 Gym Tracker Pro</h1>
        <nav className="app-nav">
          <button className="nav-btn active">
            🏠 Inicio
          </button>
          <button className="nav-btn">
            📋 Rutinas
          </button>
          <button className="nav-btn">
            💪 Ejercicios
          </button>
          <button className="nav-btn">
            📊 Progreso
          </button>
        </nav>
      </header>

      <main className="app-main">
        <div className="home-screen">
          <h2>🏋️‍♂️ Bienvenido a Gym Tracker Pro</h2>
          <div className="quick-actions">
            <div className="action-card">
              <div className="card-icon">🎯</div>
              <h3>Nueva Rutina</h3>
              <p>Crea rutinas personalizadas y alcanza tus objetivos</p>
              <button>
                <span>Crear Rutina</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
            <div className="action-card">
              <div className="card-icon">🔥</div>
              <h3>Ejercicios</h3>
              <p>Explora nuestra biblioteca de ejercicios profesionales</p>
              <button>
                <span>Explorar</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
            <div className="action-card">
              <div className="card-icon">📈</div>
              <h3>Mi Progreso</h3>
              <p>Analiza tu evolución con estadísticas detalladas</p>
              <button>
                <span>Ver Stats</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>⚡ Gym Tracker Pro PWA © 2025 | Powered by React + Vite</p>
      </footer>
    </div>
  )
}

export default App