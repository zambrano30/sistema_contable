import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    navigate('/')
  }

  return (
    <main className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Sistema contable</h1>
          <p className="user-info">Bienvenido, {user?.email}</p>
        </div>
        <button onClick={handleLogout} disabled={loggingOut} className="btn-logout">
          {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </button>
      </header>

      <nav className="dashboard-nav">
        <button onClick={() => navigate('/products')} className="nav-btn">
          📦 Productos
        </button>
        <button onClick={() => navigate('/clients')} className="nav-btn">
          👥 Clientes
        </button>
        <button onClick={() => navigate('/')} className="nav-btn">
          🏠 Panel Principal
        </button>
      </nav>

      <section className="dashboard-content">
        <h2>Panel de Control</h2>
        <p>Bienvenido al sistema contable. Usa el menú de arriba para navegar entre secciones.</p>

        <div className="dashboard-cards">
          <div className="card">
            <h3>📦 Productos</h3>
            <p>Gestiona tu catálogo de productos.</p>
            <button onClick={() => navigate('/products')} className="btn-primary">
              Ir a Productos
            </button>
          </div>

          <div className="card">
            <h3>👥 Clientes</h3>
            <p>Administra la información de tus clientes.</p>
            <button onClick={() => navigate('/clients')} className="btn-primary">
              Ir a Clientes
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
