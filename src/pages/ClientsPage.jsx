import { useEffect, useState } from 'react'
import { getAllClients, createClient, updateClient, deleteClient } from '../services/clientsService'
import { useAuth } from '../contexts/AuthContext'

export default function ClientsPage() {
  const { user } = useAuth()
  
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
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
      <header className="page-header">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">group</span>
            <span>Directorio de Clientes</span>
          </h1>
          <p className="page-subtitle">Gestión de clientes, RUC/Cédula y datos de facturación</p>
        </div>

        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          className="btn-primary"
        >
          <span className="material-symbols-outlined">person_add</span>
          <span>Registrar Nuevo Cliente</span>
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
              <h2 className="text-xl font-extrabold text-[var(--text-primary)] m-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--accent-orange)]">person_add</span>
                <span>{editingId ? 'Editar Información del Cliente' : 'Registrar Nuevo Cliente'}</span>
              </h2>
              <button 
                className="text-[var(--text-tertiary)] hover:text-white bg-none border-none cursor-pointer"
                onClick={resetForm}
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label>Nombre Completo / Razón Social *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Distribuidora Sol S.A."
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
                    placeholder="1792000000001"
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
                    placeholder="facturacion@empresa.com"
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
                    placeholder="0991234567"
                  />
                </div>

                <div className="form-group">
                  <label>Dirección Fiscal</label>
                  <input 
                    type="text"
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange}
                    placeholder="Av. 10 de Agosto N24-12"
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

      {/* Filter / Search Bar */}
      <div className="card flex items-center gap-3">
        <span className="material-symbols-outlined text-[var(--accent-orange)] text-xl">search</span>
        <input 
          type="text" 
          placeholder="Buscar cliente por nombre, RUC/Cédula o correo electrónico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] font-medium text-sm"
        />
      </div>

      {/* Clients Table Container */}
      <div className="card">
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
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Cédula / RUC</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--accent-orange)] to-[#ff7b00] text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-[var(--accent-orange)]/20 border border-white/20">
                          {getInitials(client.name)}
                        </div>
                        <span className="font-bold text-white text-sm">{client.name}</span>
                      </div>
                    </td>
                    <td className="sku-cell">
                      {client.tax_id || client.cedula_ruc || 'Consumidor Final'}
                    </td>
                    <td className="text-[var(--text-secondary)] text-sm">
                      {client.email ? (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-xs text-[var(--accent-orange)]">mail</span>
                          <span>{client.email}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="text-[var(--text-secondary)] font-mono text-xs">
                      {client.phone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-xs text-blue-400">call</span>
                          <span>{client.phone}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="text-[var(--text-secondary)] text-xs">
                      {client.address || '-'}
                    </td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleEdit(client)} 
                          className="btn-secondary btn-small"
                          title="Editar información"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)} 
                          className="btn-danger btn-small"
                          title="Eliminar cliente"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
