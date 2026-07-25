import { useEffect, useState } from 'react'
import { getAllClients, createClient, updateClient, deleteClient } from '../services/clientsService'

export default function ClientsPage() {
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
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const clientData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
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
          <span className="text-[0.75rem] font-bold text-[var(--accent-orange-light)] uppercase tracking-wider">
            Lumina Ledger • Clientes
          </span>
          <h1 className="mt-1">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">group</span>
            <span>Gestión de Clientes</span>
          </h1>
        </div>

        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          className="btn-primary"
        >
          <span className="material-symbols-outlined">person_add</span>
          <span>Agregar Cliente</span>
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Form Card */}
      {showForm && (
        <div className="card bg-[var(--bg-secondary)] border border-[var(--accent-orange)] p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)] m-0 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--accent-orange)]">person_add</span>
              <span>{editingId ? 'Editar Información del Cliente' : 'Registrar Nuevo Cliente'}</span>
            </h2>
            <button 
              className="bg-none border-none text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
              onClick={resetForm}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group">
              <label>Nombre Completo / Razon Social *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Distribuidora Global S.A."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contacto@empresa.com"
                />
              </div>

              <div className="form-group">
                <label>Teléfono de Contacto</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+54 11 4455-6677"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Dirección Fiscal / Entrega</label>
              <textarea 
                name="address" 
                value={formData.address} 
                onChange={handleInputChange}
                placeholder="Av. Corrientes 1234, CABA..."
                rows="2"
              />
            </div>

            <div className="flex gap-3 justify-end mt-2">
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
      )}

      {/* Filter / Search Bar */}
      <div className="card flex items-center gap-3">
        <span className="material-symbols-outlined text-[var(--text-tertiary)]">search</span>
        <input 
          type="text" 
          placeholder="Buscar cliente por nombre o correo electrónico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-[var(--text-primary)]"
        />
      </div>

      {/* Clients Table Container */}
      <div className="card">
        {loading ? (
          <div className="py-12 text-center text-[var(--text-tertiary)]">
            <p>Cargando lista de clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-tertiary)]">
            <span className="material-symbols-outlined text-5xl opacity-30 mb-2">person_off</span>
            <p className="m-0">No hay clientes registrados.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cliente</th>
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
                        <div className="w-9 h-9 rounded-full bg-[var(--bg-container-highest)] border border-[var(--accent-orange)]/30 text-[var(--accent-orange-light)] font-bold text-xs flex items-center justify-center">
                          {getInitials(client.name)}
                        </div>
                        <span className="font-semibold">{client.name}</span>
                      </div>
                    </td>
                    <td className="text-[var(--text-secondary)]">
                      {client.email ? (
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-[var(--text-tertiary)]">mail</span>
                          <span>{client.email}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="text-[var(--text-secondary)] font-mono text-xs">
                      {client.phone ? (
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-[var(--text-tertiary)]">call</span>
                          <span>{client.phone}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="text-[var(--text-secondary)]">
                      {client.address || '-'}
                    </td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleEdit(client)} 
                          className="btn-secondary btn-small"
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
