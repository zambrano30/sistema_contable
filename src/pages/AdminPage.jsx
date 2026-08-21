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
  const [activeTab, setActiveTab] = useState('cooks')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [cookName, setCookName] = useState('')
  const [cookEmail, setCookEmail] = useState('')
  const [cookPassword, setCookPassword] = useState('')
  const [cookPasswordConfirm, setCookPasswordConfirm] = useState('')
  const [creatingCook, setCreatingCook] = useState(false)

  const [vendorName, setVendorName] = useState('')
  const [vendorEmail, setVendorEmail] = useState('')
  const [vendorPassword, setVendorPassword] = useState('')
  const [vendorPasswordConfirm, setVendorPasswordConfirm] = useState('')
  const [creatingVendor, setCreatingVendor] = useState(false)

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
      const demoCooks = JSON.parse(localStorage.getItem('demo_cooks') || '[]')
      const demoVendors = JSON.parse(localStorage.getItem('demo_vendors') || '[]')
      setCookUsers(demoCooks)
      setVendorUsers(demoVendors)
    } else {
      const [cooksRes, vendorsRes] = await Promise.all([
        getCookUsers(),
        getVendorUsers()
      ])
      
      if (cooksRes.ok) setCookUsers(cooksRes.data || [])
      if (vendorsRes.ok) setVendorUsers(vendorsRes.data || [])
    }

    setLoading(false)
  }

  const handleCreateCook = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!cookName.trim() || !cookEmail.trim() || !cookPassword) {
      setError('Todos los campos son obligatorios')
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

    setCreatingCook(true)

    if (isDemo) {
      const newCook = {
        id: Date.now(),
        email: cookEmail,
        full_name: cookName,
        role: 'cocinero',
        created_at: new Date().toISOString()
      }

      const demoCooks = JSON.parse(localStorage.getItem('demo_cooks') || '[]')
      demoCooks.push(newCook)
      localStorage.setItem('demo_cooks', JSON.stringify(demoCooks))

      setSuccess(`✅ Cocinero "${cookName}" registrado exitosamente`)
      resetForm()
      loadUsers()
    } else {
      const result = await createCookUser(cookEmail, cookPassword, cookName)

      if (result.ok) {
        setSuccess(`✅ Cocinero "${cookName}" registrado exitosamente`)
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

    if (!vendorName.trim() || !vendorEmail.trim() || !vendorPassword) {
      setError('Todos los campos son obligatorios')
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

    setCreatingVendor(true)

    if (isDemo) {
      const newVendor = {
        id: Date.now(),
        email: vendorEmail,
        full_name: vendorName,
        role: 'vendedor',
        created_at: new Date().toISOString()
      }

      const demoVendors = JSON.parse(localStorage.getItem('demo_vendors') || '[]')
      demoVendors.push(newVendor)
      localStorage.setItem('demo_vendors', JSON.stringify(demoVendors))

      setSuccess(`✅ Vendedor "${vendorName}" registrado exitosamente`)
      resetForm()
      loadUsers()
    } else {
      const result = await createVendorUser(vendorEmail, vendorPassword, vendorName)

      if (result.ok) {
        setSuccess(`✅ Vendedor "${vendorName}" registrado exitosamente`)
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

  if (loading) return (
    <div className="page-container flex items-center justify-center py-20">
      <div className="text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--accent-orange)] animate-spin">sync</span>
        <p className="mt-2 text-[var(--text-secondary)] font-medium">Cargando panel de administración...</p>
      </div>
    </div>
  )

  if (user?.role !== 'Administrador') {
    return (
      <div className="page-container">
        <div className="card border-red-500/30 bg-red-500/10 text-center py-10">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-2">block</span>
          <p className="text-red-300 font-bold m-0">Acceso denegado. Se requieren permisos de Administrador.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">admin_panel_settings</span>
            <span>Administración del Sistema</span>
          </h1>
          <p className="page-subtitle">Gestión de accesos, roles de usuarios y personal de caja/cocina</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          <span className="material-symbols-outlined">person_add</span>
          <span>{activeTab === 'cooks' ? 'Nuevo Cocinero' : 'Nuevo Vendedor'}</span>
        </button>
      </header>

      {error && (
        <div className="error-message flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-3 border-b border-[var(--border-color)] pb-1">
        <button
          onClick={() => { setActiveTab('cooks'); setShowForm(false) }}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'cooks'
              ? 'bg-[var(--accent-orange)]/15 text-[var(--accent-orange-light)] border border-[var(--accent-orange)]/30'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">restaurant</span>
          <span>Cocineros ({cookUsers.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('vendors'); setShowForm(false) }}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'vendors'
              ? 'bg-[var(--accent-orange)]/15 text-[var(--accent-orange-light)] border border-[var(--accent-orange)]/30'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">sell</span>
          <span>Vendedores / Cajeros ({vendorUsers.length})</span>
        </button>
      </div>

      {/* COOKS TAB */}
      {activeTab === 'cooks' && (
        <>
          {showForm && (
            <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) resetForm(); }}>
              <div className="modal-content max-w-lg">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-[var(--border-color)]">
                  <h3 className="text-lg font-extrabold text-white m-0 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--accent-orange)]">person_add</span>
                    <span>Registrar Nuevo Cocinero</span>
                  </h3>
                  <button className="text-[var(--text-tertiary)] hover:text-white bg-none border-none cursor-pointer" onClick={resetForm}>
                    <span className="material-symbols-outlined text-2xl">close</span>
                  </button>
                </div>

                <form onSubmit={handleCreateCook} className="space-y-4">
                  <div className="form-group">
                    <label>Nombre Completo</label>
                    <input type="text" value={cookName} onChange={(e) => setCookName(e.target.value)} placeholder="Ej: Mario Rossi" required />
                  </div>
                  <div className="form-group">
                    <label>Correo Electrónico</label>
                    <input type="email" value={cookEmail} onChange={(e) => setCookEmail(e.target.value)} placeholder="cocina@empresa.com" required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="form-group">
                      <label>Contraseña</label>
                      <input type="password" value={cookPassword} onChange={(e) => setCookPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <div className="form-group">
                      <label>Confirmar Contraseña</label>
                      <input type="password" value={cookPasswordConfirm} onChange={(e) => setCookPasswordConfirm(e.target.value)} placeholder="••••••••" required />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-3 border-t border-[var(--border-color)]">
                    <button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button>
                    <button type="submit" disabled={creatingCook} className="btn-primary">
                      {creatingCook ? 'Registrando...' : 'Registrar Cocinero'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cookUsers.length === 0 ? (
              <div className="card col-span-full text-center py-10 text-[var(--text-tertiary)]">
                <span className="material-symbols-outlined text-5xl opacity-30 mb-2">restaurant</span>
                <p className="m-0 text-sm">No hay cocineros registrados</p>
              </div>
            ) : (
              cookUsers.map((cook) => (
                <div key={cook.id} className="bento-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold flex items-center justify-center text-sm">
                      {cook.full_name?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base m-0">{cook.full_name || 'Cocinero'}</h3>
                      <p className="text-xs text-[var(--text-secondary)] m-0">{cook.email}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <span>Rol: Cocina</span>
                    <span className="badge badge-warning">Activo</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* VENDORS TAB */}
      {activeTab === 'vendors' && (
        <>
          {showForm && (
            <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) resetForm(); }}>
              <div className="modal-content max-w-lg">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-[var(--border-color)]">
                  <h3 className="text-lg font-extrabold text-white m-0 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--secondary)]">person_add</span>
                    <span>Registrar Nuevo Vendedor</span>
                  </h3>
                  <button className="text-[var(--text-tertiary)] hover:text-white bg-none border-none cursor-pointer" onClick={resetForm}>
                    <span className="material-symbols-outlined text-2xl">close</span>
                  </button>
                </div>

                <form onSubmit={handleCreateVendor} className="space-y-4">
                  <div className="form-group">
                    <label>Nombre Completo</label>
                    <input type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Ej: Ana Torres" required />
                  </div>
                  <div className="form-group">
                    <label>Correo Electrónico</label>
                    <input type="email" value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} placeholder="ventas@empresa.com" required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="form-group">
                      <label>Contraseña</label>
                      <input type="password" value={vendorPassword} onChange={(e) => setVendorPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <div className="form-group">
                      <label>Confirmar Contraseña</label>
                      <input type="password" value={vendorPasswordConfirm} onChange={(e) => setVendorPasswordConfirm(e.target.value)} placeholder="••••••••" required />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-3 border-t border-[var(--border-color)]">
                    <button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button>
                    <button type="submit" disabled={creatingVendor} className="btn-primary">
                      {creatingVendor ? 'Registrando...' : 'Registrar Vendedor'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendorUsers.length === 0 ? (
              <div className="card col-span-full text-center py-10 text-[var(--text-tertiary)]">
                <span className="material-symbols-outlined text-5xl opacity-30 mb-2">sell</span>
                <p className="m-0 text-sm">No hay vendedores registrados</p>
              </div>
            ) : (
              vendorUsers.map((vendor) => (
                <div key={vendor.id} className="bento-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-extrabold flex items-center justify-center text-sm">
                      {vendor.full_name?.charAt(0).toUpperCase() || 'V'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base m-0">{vendor.full_name || 'Vendedor'}</h3>
                      <p className="text-xs text-[var(--text-secondary)] m-0">{vendor.email}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <span>Rol: Vendedor / Caja</span>
                    <span className="badge badge-info">Activo</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
