import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../contexts/CompanyContext'
import { signOut } from '../services/authService'
import { Navigate } from 'react-router-dom'

export default function WaitingForCompanyAssignment() {
  const { user } = useAuth()
  const { activeCompany, loading: companyLoading } = useCompany()
  const [checkInterval, setCheckInterval] = useState(null)

  // Si ya tiene empresa asignada, redirigir
  if (activeCompany && !companyLoading) {
    return <Navigate to="/sales" replace />
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  useEffect(() => {
    // Recargar empresas cada 5 segundos para verificar si fue asignada
    const interval = setInterval(() => {
      window.location.reload()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <main className="auth-container">
      <section className="card w-full max-w-lg text-center">
        <div className="mb-6">
          <div className="material-symbols-outlined text-6xl text-blue-500 mb-4 flex justify-center">
            schedule
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Asignación Pendiente
          </h1>
          <p className="text-[var(--text-secondary)] mb-4">
            Tu cuenta ha sido creada exitosamente.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-[var(--text-secondary)]">
            <strong>¡Casi listo!</strong> El administrador debe asignarte a una empresa para que puedas comenzar a trabajar.
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            Esta página se actualizará automáticamente cuando seas asignado.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-[var(--text-secondary)]">Esperando asignación...</span>
        </div>

        <div className="text-xs text-[var(--text-secondary)] mb-6 p-3 bg-gray-100 dark:bg-gray-800 rounded">
          <p>
            <strong>Rol asignado:</strong> {user?.role || 'Vendedor'}
          </p>
          <p className="mt-2">
            <strong>Email:</strong> {user?.email}
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="btn-secondary w-full justify-center"
        >
          <span className="material-symbols-outlined">refresh</span>
          Verificar ahora
        </button>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="btn-secondary w-full justify-center"
          >
            <span className="material-symbols-outlined">logout</span>
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  )
}
