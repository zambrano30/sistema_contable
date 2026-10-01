import { useEffect, useState } from 'react'
import { getAllClients, createClient, updateClient, deleteClient } from '../services/clientsService'
import { useAuth } from '../contexts/AuthContext'

export default function ClientsPage() {
  const { user } = useAuth()
  
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedClient, setExpandedClient] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    
    const result = await getAllClients()
    if (result.ok) {
      setClients(result.data || [])
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      tax_id: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('El nombre del cliente es requerido')
      return
    }

    const clientData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      tax_id: formData.tax_id,
      cedula_ruc: formData.tax_id,
    }

    let result

    if (editingId) {
      result = await updateClient(editingId, clientData)
    } else {
      result = await createClient(clientData)
    }

    if (result.ok) {
      await loadClients()
      resetForm()
    } else {
      setError(result.error)
    }
  }

  const handleEdit = (client) => {
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      tax_id: client.tax_id || client.cedula_ruc || '',
    })
    setEditingId(client.id)
    setShowForm(true)
    setShowDetails(false)
  }

  const handleViewDetails = (client) => {
    setSelectedClient(client)
    setShowDetails(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      const result = await deleteClient(id)
      if (result.ok) {
        await loadClients()
      } else {
        setError(result.error)
      }
    }
  }

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tax_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cedula_ruc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getInitials = (name) => {
    if (!name) return 'CL'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 m-0">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-xl sm:text-3xl">group</span>
            <span>Directorio de Clientes</span>
          </h1>
        </div>

        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          className="btn-primary text-xs sm:text-sm w-full sm:w-auto">
          <span className="material-symbols-outlined">person_add</span>
          <span className="hidden sm:inline">Registrar Nuevo Cliente</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </header>

      {error && (
        <div className="error-message flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form Modal / Card */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) resetForm(); }}>
          <div className="modal-content">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-color)]">
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] m-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--accent-orange)] text-xl sm:text-2xl">person_add</span>
                <span>{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</span>
              </h2>
              <div className="flex items-center gap-2">
                {editingId && (
                  <button 
                    className="btn-secondary btn-small"
                    onClick={resetForm}
                    title="Crear nuevo cliente"
                  >
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    <span className="text-xs">Nuevo</span>
                  </button>
                )}
                <button 
                  className="text-[var(--text-tertiary)] hover:text-white bg-none border-none cursor-pointer"
                  onClick={resetForm}
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label>Nombre Completo / Razón Social *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder=""
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label>RUC / Cédula *</label>
                  <input
                    type="text"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleInputChange}
                    placeholder=""
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Teléfono de Contacto</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="form-group">
                  <label>Dirección Fiscal</label>
                  <input 
                    type="text"
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border-color)]">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <span className="material-symbols-outlined">save</span>
                  <span>{editingId ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {showDetails && selectedClient && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setShowDetails(false); }}>
          <div className="modal-content max-w-2xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-color)]">
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] m-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--accent-orange)] text-xl sm:text-2xl">person</span>
                <span>Detalles del Cliente</span>
              </h2>
              <button 
                className="text-[var(--text-tertiary)] hover:text-white bg-none border-none cursor-pointer"
                onClick={() => setShowDetails(false)}
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Nombre / Razón Social</p>
                <p className="text-sm sm:text-base font-bold text-white">{selectedClient.name}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Cédula / RUC</p>
                  <p className="text-sm sm:text-base font-mono font-bold text-white">{selectedClient.tax_id || selectedClient.cedula_ruc || 'N/A'}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Correo Electrónico</p>
                  <p className="text-sm sm:text-base font-bold text-white break-all">
                    {selectedClient.email ? (
                      <a href={`mailto:${selectedClient.email}`} className="text-blue-400 hover:text-blue-300">
                        {selectedClient.email}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Teléfono de Contacto</p>
                  <p className="text-sm sm:text-base font-mono font-bold text-white">
                    {selectedClient.phone ? (
                      <a href={`tel:${selectedClient.phone}`} className="text-green-400 hover:text-green-300">
                        {selectedClient.phone}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Dirección Fiscal</p>
                  <p className="text-sm sm:text-base font-bold text-white">{selectedClient.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border-color)]">
              <button 
                type="button" 
                onClick={() => setShowDetails(false)} 
                className="btn-secondary text-xs sm:text-sm"
              >
                Cerrar
              </button>
              <button 
                type="button" 
                onClick={() => handleEdit(selectedClient)} 
                className="btn-primary text-xs sm:text-sm"
              >
                <span className="material-symbols-outlined">edit</span>
                <span>Editar Cliente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="material-symbols-outlined text-[var(--accent-orange)] text-lg sm:text-xl flex-shrink-0">search</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre, cédula, RUC o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] font-medium text-xs sm:text-sm placeholder:text-[var(--text-tertiary)]"
          />
        </div>
        {searchTerm && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-2 pt-2 border-t border-white/10">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>{filteredClients.length} cliente(s) encontrado(s)</span>
          </div>
        )}
      </div>

      {/* Clients Table Container */}
      <div className="card p-3 sm:p-4">
        {loading ? (
          <div className="py-12 text-center text-[var(--text-tertiary)]">
            <span className="material-symbols-outlined text-4xl animate-spin text-[var(--accent-orange)]">sync</span>
            <p className="mt-2 text-sm">Cargando directorio de clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-tertiary)]">
            <span className="material-symbols-outlined text-5xl opacity-30 mb-2">group_off</span>
            <p className="m-0 text-sm">No hay clientes registrados en la plataforma.</p>
          </div>
        ) : (
          <>
            {/* Vista Tabla - Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="custom-table w-full">
                <thead>
                  <tr>
                    <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold">Cliente</th>
                    <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold">Cédula / RUC</th>
                    <th className="hidden md:table-cell text-left px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold">Correo</th>
                    <th className="hidden lg:table-cell text-left px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold">Teléfono</th>
                    <th className="hidden xl:table-cell text-left px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold">Dirección</th>
                    <th className="text-right px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0">
                      <td className="px-2 sm:px-3 py-2 sm:py-3 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleViewDetails(client)}>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-[var(--accent-orange)] to-[#ff7b00] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-md shadow-[var(--accent-orange)]/20 border border-white/20 flex-shrink-0">
                            {getInitials(client.name)}
                          </div>
                          <span className="font-bold text-white text-xs sm:text-sm truncate hover:text-[var(--accent-orange)] transition-colors">{client.name}</span>
                        </div>
                      </td>
                      <td className="sku-cell px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-mono truncate cursor-pointer hover:text-[var(--accent-orange)] transition-colors" onClick={() => handleViewDetails(client)}>
                        {client.tax_id || client.cedula_ruc || 'CF'}
                      </td>
                      <td className="hidden md:table-cell text-[var(--text-secondary)] text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-3 truncate cursor-pointer hover:text-white transition-colors" onClick={() => handleViewDetails(client)}>
                        {client.email ? (
                          <a href={`mailto:${client.email}`} className="text-blue-400 hover:text-blue-300" onClick={(e) => e.stopPropagation()}>{client.email}</a>
                        ) : '-'}
                      </td>
                      <td className="hidden lg:table-cell text-[var(--text-secondary)] font-mono text-xs px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap cursor-pointer hover:text-white transition-colors" onClick={() => handleViewDetails(client)}>
                        {client.phone || '-'}
                      </td>
                      <td className="hidden xl:table-cell text-[var(--text-secondary)] text-xs px-2 sm:px-3 py-2 sm:py-3 truncate cursor-pointer hover:text-white transition-colors" onClick={() => handleViewDetails(client)}>
                        {client.address || '-'}
                      </td>
                      <td className="text-right px-2 sm:px-3 py-2 sm:py-3">
                        <div className="flex gap-1 sm:gap-2 justify-end">
                          <button 
                            onClick={() => handleViewDetails(client)} 
                            className="p-1.5 sm:p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded transition-all"
                            title="Ver detalles"
                          >
                            <span className="material-symbols-outlined text-base sm:text-lg">info</span>
                          </button>
                          <button 
                            onClick={() => handleEdit(client)} 
                            className="p-1.5 sm:p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded transition-all"
                            title="Editar información"
                          >
                            <span className="material-symbols-outlined text-base sm:text-lg">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(client.id)} 
                            className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-all"
                            title="Eliminar cliente"
                          >
                            <span className="material-symbols-outlined text-base sm:text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista Cards - Mobile */}
            <div className="sm:hidden space-y-3">
              {filteredClients.map((client) => {
                const isExpanded = expandedClient === client.id
                return (
                  <div key={client.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                    {/* Header - Siempre visible */}
                    <div 
                      onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                      className="p-3 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[var(--accent-orange)] to-[#ff7b00] text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-[var(--accent-orange)]/20 border border-white/20 flex-shrink-0">
                          {getInitials(client.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-sm truncate">{client.name}</p>
                          <p className="text-xs font-mono text-[var(--text-secondary)] truncate">{client.tax_id || client.cedula_ruc || 'CF'}</p>
                        </div>
                      </div>
                      <span className={`material-symbols-outlined text-[var(--text-secondary)] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>

                    {/* Detalles - Ocultos inicialmente */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-3 space-y-3">
                        <div className="space-y-2 text-xs bg-white/5 rounded p-2.5">
                          {client.email && (
                            <div>
                              <p className="text-[var(--text-secondary)] mb-1">Correo</p>
                              <a href={`mailto:${client.email}`} className="text-blue-400 hover:text-blue-300 break-all text-xs" onClick={(e) => e.stopPropagation()}>{client.email}</a>
                            </div>
                          )}
                          {client.phone && (
                            <div>
                              <p className="text-[var(--text-secondary)] mb-1">Teléfono</p>
                              <a href={`tel:${client.phone}`} className="text-green-400 hover:text-green-300 font-mono text-xs" onClick={(e) => e.stopPropagation()}>{client.phone}</a>
                            </div>
                          )}
                          {client.address && (
                            <div>
                              <p className="text-[var(--text-secondary)] mb-1">Dirección</p>
                              <p className="text-white text-xs">{client.address}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-white/10">
                          <button 
                            onClick={() => handleEdit(client)} 
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-400/10 hover:bg-blue-400/20 rounded transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span>Editar</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(client.id)} 
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 rounded transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
