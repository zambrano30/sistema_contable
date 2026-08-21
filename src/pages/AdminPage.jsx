import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createCookUser, getCookUsers } from '../services/userService'

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isDemo = !!localStorage.getItem('demo_user')

  const [cookUsers, setCookUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [cookName, setCookName] = useState('')
  const [cookEmail, setCookEmail] = useState('')
  const [cookPassword, setCookPassword] = useState('')
  const [cookPasswordConfirm, setCookPasswordConfirm] = useState('')
  const [creatingCook, setCreatingCook] = useState(false)

  // Verificar que sea admin
  useEffect(() => {
    if (user && user.role !== 'Administrador') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  useEffect(() => {
    loadCookUsers()
  }, [])

  const loadCookUsers = async () => {
    setLoading(true)

    if (isDemo) {
      // En demo, cargar de localStorage
      const demoCooks = JSON.parse(localStorage.getItem('demo_cooks') || '[]')
      setCookUsers(demoCooks)
    } else {
      // En producción, cargar de Supabase
      const result = await getCookUsers()
      if (result.ok) {
        setCookUsers(result.data)
      } else {
        setError(result.error)
      }
    }

    setLoading(false)
  }

  const handleCreateCook = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validaciones
    if (!cookName.trim()) {
      setError('El nombre del cocinero es obligatorio')
      return
    }

    if (!cookEmail.trim()) {
      setError('El email es obligatorio')
      return
    }

    if (!cookPassword) {
      setError('La contraseña es obligatoria')
      return
    }

    if (cookPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (cookPassword !== cookPasswordConfirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Verificar que el email no exista
    const emailExists = cookUsers.some(c => c.email === cookEmail)
    if (emailExists) {
      setError('Este email ya está registrado como cocinero')
      return
    }

    setCreatingCook(true)

    if (isDemo) {
      // Crear en localStorage (demo)
      const newCook = {
        id: Date.now(),
        email: cookEmail,
        full_name: cookName,
        role: 'cocinero',
        password: cookPassword, // ⚠️ SOLO EN DEMO, NUNCA EN PRODUCCIÓN
        created_at: new Date().toISOString()
      }

      const demoCooks = JSON.parse(localStorage.getItem('demo_cooks') || '[]')
      demoCooks.push(newCook)
      localStorage.setItem('demo_cooks', JSON.stringify(demoCooks))

      setSuccess(`✅ Cocinero "${cookName}" creado exitosamente\nEmail: ${cookEmail}\nContraseña: ${cookPassword}`)
      resetForm()
      loadCookUsers()
    } else {
      // Crear en Supabase (producción)
      const result = await createCookUser(cookEmail, cookPassword, cookName)

      if (result.ok) {
        setSuccess(`✅ Cocinero "${cookName}" creado exitosamente\nEmail: ${cookEmail}`)
        resetForm()
        loadCookUsers()
      } else {
        setError(`Error creando cocinero: ${result.error}`)
      }
    }

    setCreatingCook(false)
  }

  const resetForm = () => {
    setCookName('')
    setCookEmail('')
    setCookPassword('')
    setCookPasswordConfirm('')
    setShowForm(false)
  }

  if (loading) return <div className="page-container"><p>Cargando...</p></div>

  if (user?.role !== 'Administrador') {
    return (
      <div className="page-container">
        <div className="card bg-red-900 border border-red-700 p-6 text-center">
          <p className="text-red-200">❌ Acceso denegado. Solo administradores pueden acceder aquí.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div>
          <span className="text-[0.75rem] font-bold text-[var(--accent-orange-light)] uppercase tracking-wider">
            Lumina Ledger • Administración
          </span>
          <h1 className="mt-1">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">admin_panel_settings</span>
            <span>Gestión de Usuarios</span>
          </h1>
        </div>
      </header>

      {/* Info Banner */}
      <div className="card bg-blue-900 border border-blue-700 p-4 mb-6">
        <p className="text-blue-200 text-sm">
          <strong>ℹ️ Modo:</strong> {isDemo ? '👾 Demo (localStorage)' : '🔒 Producción (Supabase)'}
        </p>
        {!isDemo && (
          <p className="text-blue-100 text-sm mt-2">
            Los cocineros se crean directamente. Ellos pueden login inmediatamente con el email y contraseña que establezca.
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="card bg-red-900 border border-red-700 p-4 mb-6">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="card bg-green-900 border border-green-700 p-4 mb-6">
          <p className="text-green-200">{success}</p>
          {!isDemo && (
            <div className="mt-4 p-3 bg-green-800 rounded text-sm text-green-100">
              <p className="font-bold">✅ Cocinero creado y listo para login</p>
              <p className="mt-2 text-xs">El cocinero puede usar el email y contraseña que acabas de establecer para iniciar sesión.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Cook Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-6 py-3 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)] text-white font-bold rounded transition flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Crear Nuevo Cocinero
        </button>
      )}

      {/* Create Cook Form */}
      {showForm && (
        <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">person_add</span>
            Nuevo Cocinero
          </h2>

          <form onSubmit={handleCreateCook} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold mb-2 text-[var(--text-primary)]">
                Nombre Completo
              </label>
              <input
                type="text"
                value={cookName}
                onChange={(e) => setCookName(e.target.value)}
                placeholder="Ej: Juan García"
                className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent-orange)] focus:outline-none transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold mb-2 text-[var(--text-primary)]">
                Email
              </label>
              <input
                type="email"
                value={cookEmail}
                onChange={(e) => setCookEmail(e.target.value)}
                placeholder="Ej: juan@cocina.com"
                className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent-orange)] focus:outline-none transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold mb-2 text-[var(--text-primary)]">
                Contraseña
              </label>
              <input
                type="password"
                value={cookPassword}
                onChange={(e) => setCookPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent-orange)] focus:outline-none transition"
              />
            </div>

            {/* Password Confirm */}
            <div>
              <label className="block text-sm font-bold mb-2 text-[var(--text-primary)]">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={cookPasswordConfirm}
                onChange={(e) => setCookPasswordConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent-orange)] focus:outline-none transition"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={creatingCook}
                className="flex-1 px-4 py-2 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded transition"
              >
                {creatingCook ? 'Creando...' : 'Crear Cocinero'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cook Users List */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">group</span>
          Cocineros Registrados ({cookUsers.length})
        </h2>

        {cookUsers.length === 0 ? (
          <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)] mb-2">
              no_accounts
            </span>
            <p className="text-[var(--text-secondary)]">No hay cocineros registrados aún</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {cookUsers.map((cook) => (
              <div
                key={cook.id}
                className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 hover:border-[var(--accent-orange)] transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--accent-orange)] flex items-center justify-center text-white font-bold">
                      {cook.full_name?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[var(--text-primary)]">
                        {cook.full_name || 'Cocinero'}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">{cook.email}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-2">
                        Creado: {new Date(cook.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[var(--accent-orange)]">
                    verified_user
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
