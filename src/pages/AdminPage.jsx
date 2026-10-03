import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../contexts/CompanyContext'
import { supabase } from '../lib/supabaseClient'
import { createCookUser, getCookUsers, createVendorUser, getVendorUsers } from '../services/userService'
import { recalculateInvoiceTotals, assignCompanyIdToInvoices } from '../services/invoicesService'
import { SkillBadge } from '../components/SkillBadge'

export default function AdminPage() {
  const { user } = useAuth()
  const { activeCompanyId, companies } = useCompany()
  const navigate = useNavigate()

  const [cookUsers, setCookUsers] = useState([])
  const [vendorUsers, setVendorUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('cooks')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isFixingInvoices, setIsFixingInvoices] = useState(false)
  const [isAssigningCompanyId, setIsAssigningCompanyId] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)
  const [loadingDebugInfo, setLoadingDebugInfo] = useState(false)

  const [cookName, setCookName] = useState('')
  const [cookEmail, setCookEmail] = useState('')
  const [cookPassword, setCookPassword] = useState('')
  const [cookPasswordConfirm, setCookPasswordConfirm] = useState('')
  const [creatingCook, setCreatingCook] = useState(false)

  const [vendorName, setVendorName] = useState('')
  const [vendorEmail, setVendorEmail] = useState('')
  const [vendorPassword, setVendorPassword] = useState('')
  const [vendorPasswordConfirm, setVendorPasswordConfirm] = useState('')
  const [vendorCompanyId, setVendorCompanyId] = useState('')
  const [creatingVendor, setCreatingVendor] = useState(false)

  useEffect(() => {
    if (user && user.role !== 'Administrador') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  useEffect(() => {
    loadUsers()
  }, [])

  // Initialize vendorCompanyId when activeCompanyId changes
  useEffect(() => {
    if (activeCompanyId && !vendorCompanyId) {
      setVendorCompanyId(activeCompanyId)
    }
  }, [activeCompanyId, vendorCompanyId])

  const loadUsers = async () => {
    setLoading(true)

    const [cooksRes, vendorsRes] = await Promise.all([
      getCookUsers(),
      getVendorUsers()
    ])
    
    if (cooksRes.ok) setCookUsers(cooksRes.data || [])
    if (vendorsRes.ok) setVendorUsers(vendorsRes.data || [])

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

    const result = await createCookUser(cookEmail, cookPassword, cookName)

    if (result.ok) {
      setSuccess(`✅ Cocinero "${cookName}" registrado exitosamente`)
      resetForm()
      loadUsers()
    } else {
      setError(`Error creando cocinero: ${result.error}`)
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

    if (!vendorCompanyId) {
      setError('⚠️ Debes seleccionar una empresa para asignar al vendedor')
      return
    }

    setCreatingVendor(true)

    // Assign vendor to selected company automatically
    const result = await createVendorUser(vendorEmail, vendorPassword, vendorName, vendorCompanyId)

    if (result.ok) {
      const selectedCompany = companies.find(c => c.id === vendorCompanyId)
      const companyName = selectedCompany ? selectedCompany.name : 'la empresa'
      setSuccess(`✅ Vendedor "${vendorName}" registrado y asignado a ${companyName}`)
      resetForm()
      loadUsers()
    } else {
      setError(`Error creando vendedor: ${result.error}`)
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
    setVendorCompanyId(activeCompanyId || '')
    setShowForm(false)
  }

  const handleFixInvoiceTotals = async () => {
    setError('')
    setSuccess('')
    setIsFixingInvoices(true)

    try {
      const result = await recalculateInvoiceTotals()

      if (result.ok) {
        setSuccess(`✅ Se corrigieron ${result.fixed} facturas con total $0. Recarga la página para ver los cambios.`)
      } else {
        setError(result.error || 'Error al corregir facturas')
      }
    } catch (err) {
      setError('Error al intentar corregir facturas: ' + err.message)
    } finally {
      setIsFixingInvoices(false)
    }
  }

  const handleAssignCompanyId = async () => {
    if (!activeCompanyId) {
      setError('No hay empresa seleccionada. Por favor, selecciona una empresa primero.')
      return
    }

    setError('')
    setSuccess('')
    setIsAssigningCompanyId(true)

    try {
      const result = await assignCompanyIdToInvoices(activeCompanyId)

      if (result.ok) {
        if (result.fixed === 0) {
          setSuccess('✅ No hay facturas sin empresa. El sistema está correctamente configurado.')
        } else {
          setSuccess(`✅ Se asignó empresa a ${result.fixed} facturas. Recarga el dashboard para ver los cambios.`)
        }
        // Reload debug info after fix
        await loadDebugInfo()
      } else {
        setError(result.error || 'Error al asignar empresa a facturas')
      }
    } catch (err) {
      setError('Error al intentar asignar empresa: ' + err.message)
    } finally {
      setIsAssigningCompanyId(false)
    }
  }

  const loadDebugInfo = async () => {
    setLoadingDebugInfo(true)
    try {
      // Get all invoices to check company_id status
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, invoice_number, company_id, total_amount, client_id')
        .order('created_at', { ascending: false })
        .limit(10)

      if (invoicesError) {
        setError('Error al cargar debug info: ' + invoicesError.message)
        return
      }

      // Count by company_id
      const { data: companyStats, error: statsError } = await supabase
        .from('invoices')
        .select('company_id')

      if (!statsError && companyStats) {
        const grouped = {}
        companyStats.forEach(inv => {
          const cid = inv.company_id || 'NULL'
          grouped[cid] = (grouped[cid] || 0) + 1
        })

        setDebugInfo({
          recentInvoices: invoicesData || [],
          companyDistribution: grouped,
          totalInvoices: companyStats.length,
          activeCompanyId
        })
      }
    } catch (err) {
      setError('Error loading debug info: ' + err.message)
    } finally {
      setLoadingDebugInfo(false)
    }
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
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 m-0 font-heading">
              <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">admin_panel_settings</span>
              <span>Administración del Sistema</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            <span className="material-symbols-outlined">person_add</span>
            <span>{activeTab === 'cooks' ? 'Nuevo Cocinero' : 'Nuevo Vendedor'}</span>
          </button>
        </div>
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
        <button
          onClick={() => { setActiveTab('tools'); setShowForm(false) }}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'tools'
              ? 'bg-[var(--accent-orange)]/15 text-[var(--accent-orange-light)] border border-[var(--accent-orange)]/30'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">settings</span>
          <span>Herramientas</span>
        </button>
      </div>

      {/* COOKS TAB */}
      {activeTab === 'cooks' && (
        <>
          {showForm && (
            <div className="modal-overlay">
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
                    <input type="text" value={cookName} onChange={(e) => setCookName(e.target.value)} placeholder="" required />
                  </div>
                  <div className="form-group">
                    <label>Correo Electrónico</label>
                    <input type="email" value={cookEmail} onChange={(e) => setCookEmail(e.target.value)} placeholder="" required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="form-group">
                      <label>Contraseña</label>
                      <input type="password" value={cookPassword} onChange={(e) => setCookPassword(e.target.value)} placeholder="" required />
                    </div>
                    <div className="form-group">
                      <label>Confirmar Contraseña</label>
                      <input type="password" value={cookPasswordConfirm} onChange={(e) => setCookPasswordConfirm(e.target.value)} placeholder="" required />
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
            <div className="modal-overlay">
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
                    <input type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="" required />
                  </div>
                  <div className="form-group">
                    <label>Correo Electrónico</label>
                    <input type="email" value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} placeholder="" required />
                  </div>
                  <div className="form-group">
                    <label>Asignar a Empresa *</label>
                    <select 
                      value={vendorCompanyId} 
                      onChange={(e) => setVendorCompanyId(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm"
                      required
                    >
                      <option value="">-- Selecciona una empresa --</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="form-group">
                      <label>Contraseña</label>
                      <input type="password" value={vendorPassword} onChange={(e) => setVendorPassword(e.target.value)} placeholder="" required />
                    </div>
                    <div className="form-group">
                      <label>Confirmar Contraseña</label>
                      <input type="password" value={vendorPasswordConfirm} onChange={(e) => setVendorPasswordConfirm(e.target.value)} placeholder="" required />
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

      {/* TOOLS TAB */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Debug Info Card */}
          <div className="card border-cyan-500/30 bg-cyan-500/5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white m-0 flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400">bug_report</span>
                  <span>Información de Diagnóstico</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-2 m-0">
                  Revisa si las facturas tienen empresa asignada correctamente. Esto es crucial para que el dashboard muestre los datos.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={loadDebugInfo}
                disabled={loadingDebugInfo}
                className="btn-primary bg-cyan-600 hover:bg-cyan-700"
              >
                <span className="material-symbols-outlined">
                  {loadingDebugInfo ? 'cached' : 'refresh'}
                </span>
                <span>{loadingDebugInfo ? 'Cargando...' : 'Cargar Información'}</span>
              </button>
            </div>

            {debugInfo && (
              <div className="space-y-3">
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-xs text-cyan-300">
                  <p className="m-0 font-bold mb-2">📊 Distribución por Empresa:</p>
                  <div className="space-y-1">
                    {Object.entries(debugInfo.companyDistribution).map(([cid, count]) => (
                      <div key={cid} className="flex justify-between">
                        <span>{cid === 'NULL' ? '❌ SIN EMPRESA' : '✅ ' + cid.substring(0, 8) + '...'}</span>
                        <span className="font-bold">{count} facturas</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 mb-0 text-cyan-400">
                    <strong>Total:</strong> {debugInfo.totalInvoices} facturas
                  </p>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-xs text-cyan-300">
                  <p className="m-0 font-bold mb-2">📝 Últimas 10 Facturas:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {debugInfo.recentInvoices.length === 0 ? (
                      <p className="text-cyan-400">No hay facturas</p>
                    ) : (
                      debugInfo.recentInvoices.map(inv => (
                        <div key={inv.id} className="text-[11px] font-mono flex justify-between">
                          <span>#{inv.invoice_number}</span>
                          <span>{inv.total_amount ? '$' + inv.total_amount : '$0'}</span>
                          <span className={inv.company_id ? 'text-green-400' : 'text-red-400'}>
                            {inv.company_id ? inv.company_id.substring(0, 8) + '...' : 'NULL'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Fix Invoice Totals Card */}
          <div className="card border-blue-500/30 bg-blue-500/5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white m-0 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400">receipt_long</span>
                  <span>Corregir Facturas con Total $0</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-2 m-0">
                  Si tienes facturas creadas con total $0, esta herramienta las corregirá automáticamente calculando el total desde los artículos de la factura.
                </p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4 text-xs text-blue-300">
              <p className="m-0">
                <strong>¿Qué hace?</strong> Busca todas las facturas con total = $0 y recalcula el total basado en:
              </p>
              <ul className="mt-2 ml-4 mb-0 space-y-1">
                <li>• Los artículos agregados a la factura (si existen)</li>
                <li>• El subtotal registrado (si no hay artículos)</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-3 border-t border-blue-500/20">
              <button
                onClick={handleFixInvoiceTotals}
                disabled={isFixingInvoices}
                className="btn-primary bg-blue-600 hover:bg-blue-700"
              >
                <span className="material-symbols-outlined">
                  {isFixingInvoices ? 'cached' : 'build'}
                </span>
                <span>{isFixingInvoices ? 'Corrigiendo...' : 'Ejecutar Corrección'}</span>
              </button>
              <a
                href="/FIX_ZERO_INVOICES.md"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <span className="material-symbols-outlined">help</span>
                <span>Más Información</span>
              </a>
            </div>
          </div>

          {/* Assign Company ID Card */}
          <div className="card border-purple-500/30 bg-purple-500/5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white m-0 flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-400">business</span>
                  <span>Asignar Empresa a Facturas</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-2 m-0">
                  Si hay facturas sin empresa asignada, esta herramienta las asociará a la empresa actualmente seleccionada. Esto es importante para que el dashboard muestre las facturas correctas.
                </p>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-4 text-xs text-purple-300">
              <p className="m-0">
                <strong>¿Cuándo usar?</strong> Cuando:
              </p>
              <ul className="mt-2 ml-4 mb-0 space-y-1">
                <li>• El dashboard muestra "No hay empresa seleccionada"</li>
                <li>• Las facturas no aparecen en el dashboard</li>
                <li>• Migraste facturas de otro sistema sin empresa asignada</li>
              </ul>
              <p className="mt-2 mb-0">
                <strong>Empresa actual:</strong> {activeCompanyId ? activeCompanyId.substring(0, 8) + '...' : 'No seleccionada'}
              </p>
            </div>

            <div className="flex gap-3 pt-3 border-t border-purple-500/20">
              <button
                onClick={handleAssignCompanyId}
                disabled={isAssigningCompanyId || !activeCompanyId}
                className="btn-primary bg-purple-600 hover:bg-purple-700"
              >
                <span className="material-symbols-outlined">
                  {isAssigningCompanyId ? 'cached' : 'done_all'}
                </span>
                <span>{isAssigningCompanyId ? 'Asignando...' : 'Asignar Empresa'}</span>
              </button>
              <a
                href="/COMPANY_ID_FILTERING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <span className="material-symbols-outlined">help</span>
                <span>Más Información</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
