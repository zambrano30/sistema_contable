import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createCookUser, getCookUsers, createVendorUser, getVendorUsers } from '../services/userService'

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isDemo = !!localStorage.getItem('demo_user')

  const [cookUsers, setCookUsers] = useState([])
  const [vendorUsers, setVendorUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('cooks') // 'cooks' or 'vendors'
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state - Cook
  const [cookName, setCookName] = useState('')
  const [cookEmail, setCookEmail] = useState('')
  const [cookPassword, setCookPassword] = useState('')
  const [cookPasswordConfirm, setCookPasswordConfirm] = useState('')
  const [creatingCook, setCreatingCook] = useState(false)

  // Form state - Vendor
  const [vendorName, setVendorName] = useState('')
  const [vendorEmail, setVendorEmail] = useState('')
  const [vendorPassword, setVendorPassword] = useState('')
  const [vendorPasswordConfirm, setVendorPasswordConfirm] = useState('')
  const [creatingVendor, setCreatingVendor] = useState(false)

  // Verificar que sea admin
  useEffect(() => {
    if (user && user.role !== 'Administrador') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)

    if (isDemo) {
      // En demo, cargar de localStorage
      const demoCooks = JSON.parse(localStorage.getItem('demo_cooks') || '[]')
      const demoVendors = JSON.parse(localStorage.getItem('demo_vendors') || '[]')
      setCookUsers(demoCooks)
      setVendorUsers(demoVendors)
    } else {
      // En producción, cargar de Supabase
      const [cooksRes, vendorsRes] = await Promise.all([
        getCookUsers(),
        getVendorUsers()
      ])
      
      if (cooksRes.ok) setCookUsers(cooksRes.data)
      if (vendorsRes.ok) setVendorUsers(vendorsRes.data)
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
      loadUsers()
    } else {
      // Crear en Supabase (producción)
      const result = await createCookUser(cookEmail, cookPassword, cookName)

      if (result.ok) {
        setSuccess(`✅ Cocinero "${cookName}" creado exitosamente\nEmail: ${cookEmail}`)
        resetForm()
        loadUsers()
      } else {
        setError(`Error creando cocinero: ${result.error}`)
      }
    }

    setCreatingCook(false)
  }

  const handleCreateVendor = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validaciones
    if (!vendorName.trim()) {
      setError('El nombre del vendedor es obligatorio')
      return
    }

    if (!vendorEmail.trim()) {
      setError('El email es obligatorio')
      return
    }

    if (!vendorPassword) {
      setError('La contraseña es obligatoria')
      return
    }

    if (vendorPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (vendorPassword !== vendorPasswordConfirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Verificar que el email no exista
    const emailExists = vendorUsers.some(v => v.email === vendorEmail)
    if (emailExists) {
      setError('Este email ya está registrado como vendedor')
      return
    }

    setCreatingVendor(true)

    if (isDemo) {
      // Crear en localStorage (demo)
      const newVendor = {
        id: Date.now(),
        email: vendorEmail,
        full_name: vendorName,
        role: 'vendedor',
        password: vendorPassword, // ⚠️ SOLO EN DEMO, NUNCA EN PRODUCCIÓN
        created_at: new Date().toISOString()
      }

      const demoVendors = JSON.parse(localStorage.getItem('demo_vendors') || '[]')
      demoVendors.push(newVendor)
      localStorage.setItem('demo_vendors', JSON.stringify(demoVendors))

      setSuccess(`✅ Vendedor "${vendorName}" creado exitosamente\nEmail: ${vendorEmail}\nContraseña: ${vendorPassword}`)
      resetForm()
      loadUsers()
    } else {
      // Crear en Supabase (producción)
      const result = await createVendorUser(vendorEmail, vendorPassword, vendorName)

      if (result.ok) {
        setSuccess(`✅ Vendedor "${vendorName}" creado exitosamente\nEmail: ${vendorEmail}`)
        resetForm()
        loadUsers()
      } else {
        setError(`Error creando vendedor: ${result.error}`)
      }
    }

    setCreatingVendor(false)
  }

  const resetForm = () => {
    setCookName('')
    setCookEmail('')
    setCookPassword('')
    setCookPasswordConfirm('')
    setVendorName('')
    setVendorEmail('')
    setVendorPassword('')
    setVendorPasswordConfirm('')
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
          <h1 className="mt-1">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">admin_panel_settings</span>
            <span>Gestión de Usuarios</span>
          </h1>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="card bg-red-900 border border-red-700 p-4 mb-6">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="card bg-green-900 border border-green-700 p-4 mb-6">
          <p className="text-green-200 whitespace-pre-line">{success}</p>
          {!isDemo && (
            <div className="mt-4 p-3 bg-green-800 rounded text-sm text-green-100">
              <p className="font-bold">✅ Usuario creado y listo para login</p>
              <p className="mt-2 text-xs">El usuario puede usar el email y contraseña que acabas de establecer para iniciar sesión.</p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--border-color)]">
        <button
          onClick={() => { setActiveTab('cooks'); setShowForm(false) }}
          className={`px-4 py-2 font-bold transition ${
            activeTab === 'cooks'
              ? 'border-b-2 border-[var(--accent-orange)] text-[var(--accent-orange)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined">restaurant_menu</span>
            Cocineros ({cookUsers.length})
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('vendors'); setShowForm(false) }}
          className={`px-4 py-2 font-bold transition ${
            activeTab === 'vendors'
              ? 'border-b-2 border-[var(--accent-orange)] text-[var(--accent-orange)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined">sell</span>
            Vendedores ({vendorUsers.length})
          </span>
        </button>
      </div>

      {/* Cook Tab */}
      {activeTab === 'cooks' && (
        <>
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
        </>
      )}

      {/* Vendor Tab */}
      {activeTab === 'vendors' && (
        <>
          {/* Create Vendor Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-6 px-6 py-3 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)] text-white font-bold rounded transition flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Crear Nuevo Vendedor
            </button>
          )}

          {/* Create Vendor Form */}
          {showForm && (
            <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">person_add</span>
                Nuevo Vendedor
              </h2>

              <form onSubmit={handleCreateVendor} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-[var(--text-primary)]">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="Ej: María López"
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
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    placeholder="Ej: maria@ventas.com"
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
                    value={vendorPassword}
                    onChange={(e) => setVendorPassword(e.target.value)}
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
                    value={vendorPasswordConfirm}
                    onChange={(e) => setVendorPasswordConfirm(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent-orange)] focus:outline-none transition"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={creatingVendor}
                    className="flex-1 px-4 py-2 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded transition"
                  >
                    {creatingVendor ? 'Creando...' : 'Crear Vendedor'}
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

          {/* Vendor Users List */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">group</span>
              Vendedores Registrados ({vendorUsers.length})
            </h2>

            {vendorUsers.length === 0 ? (
              <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)] mb-2">
                  no_accounts
                </span>
                <p className="text-[var(--text-secondary)]">No hay vendedores registrados aún</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {vendorUsers.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 hover:border-[var(--accent-orange)] transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                          {vendor.full_name?.charAt(0).toUpperCase() || 'V'}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-[var(--text-primary)]">
                            {vendor.full_name || 'Vendedor'}
                          </h3>
                          <p className="text-sm text-[var(--text-secondary)]">{vendor.email}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-2">
                            Creado: {new Date(vendor.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-green-500">
                        verified_user
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
