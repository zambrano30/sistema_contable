import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <main className="page-container">
      <header className="page-header">
        <div>
          <h1>📊 Dashboard</h1>
          <p className="page-subtitle">Bienvenido de nuevo, {user?.email}</p>
        </div>
      </header>

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
