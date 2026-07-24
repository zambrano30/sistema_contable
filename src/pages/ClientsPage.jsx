import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllClients, createClient, updateClient, deleteClient } from '../services/clientsService'

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })
  const navigate = useNavigate()

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
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      const result = await deleteClient(id)

      if (result.ok) {
        await loadClients()
      } else {
        setError(result.error)
      }
    }
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <h1>👥 Clientes</h1>
        <div>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Volver
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Nuevo Cliente
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {showForm && (
        <section className="form-section">
          <h2>{editingId ? 'Editar Cliente' : 'Crear Cliente'}</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <textarea name="address" value={formData.address} onChange={handleInputChange} />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="clients-list">
        {loading ? (
          <p>Cargando clientes...</p>
        ) : clients.length === 0 ? (
          <p>No hay clientes. Crea uno para empezar.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>{client.email || '-'}</td>
                  <td>{client.phone || '-'}</td>
                  <td>{client.address || '-'}</td>
                  <td>
                    <button onClick={() => handleEdit(client)} className="btn-secondary">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="btn-danger">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
