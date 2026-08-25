import { useEffect, useState } from 'react'
import { getAllExpenses, createExpense, updateExpense, deleteExpense } from '../services/expensesService'
import { getLocalDateKey } from '../lib/dateUtils'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState({
    category: 'pasteles',
    item_name: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const [categoryTotals, setCategoryTotals] = useState({
    pasteles: 0,
    jugos: 0,
    sueldos: 0,
    servicios: 0,
    otros: 0,
  })

  const [filterCategory, setFilterCategory] = useState('all')

  const CATEGORIES = [
    { id: 'pasteles', name: '🍰 Insumos / Materia Prima', icon: 'bakery_dining', color: 'text-amber-400' },
    { id: 'jugos', name: '🥤 Bebidas & Envases', icon: 'local_drink', color: 'text-blue-400' },
    { id: 'sueldos', name: '👨‍💼 Sueldos & Personal', icon: 'badge', color: 'text-emerald-400' },
    { id: 'servicios', name: '🔧 Servicios Básicos', icon: 'bolt', color: 'text-purple-400' },
    { id: 'otros', name: '📦 Gastos Varios', icon: 'widgets', color: 'text-slate-400' },
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const result = await getAllExpenses()
    if (result.ok) {
      setExpenses(result.data || [])
      calculateCategoryTotals(result.data || [])
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const calculateCategoryTotals = (expenseList) => {
    const totals = {
      pasteles: 0,
      jugos: 0,
      sueldos: 0,
      servicios: 0,
      otros: 0,
    }

    expenseList.forEach((exp) => {
      if (Object.prototype.hasOwnProperty.call(totals, exp.category)) {
        totals[exp.category] += exp.amount || 0
      }
    })

    setCategoryTotals(totals)
  }

  const calculateAmount = (quantity = 1, unitPrice = 0) => {
    return (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    const updatedData = { ...formData, [name]: value }

    if (name === 'quantity' || name === 'unit_price') {
      updatedData.amount = calculateAmount(updatedData.quantity, updatedData.unit_price)
    }

    if (name === 'amount') {
      updatedData.amount = parseFloat(value) || 0
    }

    setFormData(updatedData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.item_name || formData.amount <= 0) {
      setError('Nombre del gasto y monto válidos requeridos')
      return
    }

    const expenseData = {
      category: formData.category,
      item_name: formData.item_name,
      description: formData.description,
      quantity: parseFloat(formData.quantity) || 1,
      unit_price: parseFloat(formData.unit_price) || 0,
      amount: parseFloat(formData.amount) || 0,
      expense_date: formData.expense_date,
      notes: formData.notes,
    }

    if (editingId) {
      const result = await updateExpense(editingId, expenseData)
      if (result.ok) {
        await loadData()
        resetForm()
      } else {
        setError(result.error)
      }
    } else {
      const result = await createExpense(expenseData)
      if (result.ok) {
        await loadData()
        resetForm()
      } else {
        setError(result.error)
      }
    }
  }

  const handleEdit = (expense) => {
    setFormData({
      category: expense.category,
      item_name: expense.item_name,
      description: expense.description || '',
      quantity: expense.quantity || 1,
      unit_price: expense.unit_price || 0,
      amount: expense.amount || 0,
      expense_date: expense.expense_date,
      notes: expense.notes || '',
    })
    setEditingId(expense.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Deseas eliminar este registro de gasto?')) {
      const result = await deleteExpense(id)
      if (result.ok) {
        await loadData()
      } else {
        setError(result.error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      category: 'pasteles',
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setShowForm(false)
    setEditingId(null)
  }

  const filteredExpenses = filterCategory === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === filterCategory)

  const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)

  if (loading) return (
    <div className="page-container flex items-center justify-center py-20">
      <div className="text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--accent-orange)] animate-spin">sync</span>
        <p className="mt-2 text-[var(--text-secondary)] font-medium">Cargando registros de egresos...</p>
      </div>
    </div>
  )

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-red-400 text-3xl">trending_down</span>
            <span>Gestión de Gastos y Egresos</span>
          </h1>
          <p className="page-subtitle">Registro de egresos por categoría, compras e insumos de operación</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          <span className="material-symbols-outlined">add</span>
          <span>{editingId ? 'Actualizar Gasto' : 'Registrar Nuevo Gasto'}</span>
        </button>
      </header>

      {error && (
        <div className="error-message flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            onClick={() => setFilterCategory(filterCategory === cat.id ? 'all' : cat.id)}
            className={`bento-card cursor-pointer transition-all ${
              filterCategory === cat.id ? 'border-[var(--accent-orange)] bg-[var(--accent-orange)]/10' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{cat.name}</span>
              <span className={`material-symbols-outlined text-xl ${cat.color}`}>{cat.icon}</span>
            </div>
            <p className="text-xl font-extrabold font-mono text-white mt-2 mb-0">
              ${categoryTotals[cat.id]?.toFixed(2) || '0.00'}
            </p>
          </div>
        ))}
      </div>

      {/* Total Hero Card */}
      <div className="bento-card border-red-500/40 bg-gradient-to-r from-red-950/40 to-red-900/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-300">TOTAL EGRESOS DEL PERIODO</span>
            <h2 className="text-3xl font-extrabold font-mono text-red-400 mt-1 m-0">
              ${totalExpenses.toFixed(2)}
            </h2>
          </div>
          <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
            <span className="material-symbols-outlined text-4xl">payments</span>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) resetForm(); }}>
          <div className="modal-content">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-color)]">
              <h2 className="text-xl font-extrabold text-white m-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-400">add_card</span>
                <span>{editingId ? 'Editar Registro de Gasto' : 'Registrar Nuevo Gasto'}</span>
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
                <label>Categoría del Gasto</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Nombre / Detalle del Gasto *</label>
                <input
                  type="text"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleFormChange}
                  placeholder="Ej: Insumos de empaque, Energía eléctrica..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="form-group">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleFormChange}
                    className="font-mono"
                  />
                </div>
                <div className="form-group">
                  <label>Precio Unit. ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleFormChange}
                    className="font-mono"
                  />
                </div>
                <div className="form-group">
                  <label>Monto Total ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleFormChange}
                    className="font-mono font-bold text-red-400"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Fecha de Registro</label>
                <input
                  type="date"
                  name="expense_date"
                  value={formData.expense_date}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group">
                <label>Observaciones / Factura Proveedor</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="2"
                  placeholder="Proveedor, comprobante #..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border-color)]">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <span className="material-symbols-outlined">save</span>
                  <span>{editingId ? 'Actualizar' : 'Guardar'} Gasto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="card">
        <h3 className="text-lg font-extrabold text-white m-0 mb-4 pb-2 border-b border-[var(--border-color)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--accent-orange)]">list_alt</span>
          <span>Historial de Gastos</span>
        </h3>

        {filteredExpenses.length === 0 ? (
          <p className="text-center text-[var(--text-tertiary)] py-8">Sin gastos registrados en el sistema</p>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Detalle</th>
                  <th>Fecha</th>
                  <th className="text-right">Monto Total</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => {
                  const category = CATEGORIES.find(c => c.id === exp.category)
                  return (
                    <tr key={exp.id}>
                      <td>
                        <span className="badge badge-info font-bold text-xs">
                          {category?.name || exp.category}
                        </span>
                      </td>
                      <td>
                        <p className="font-bold text-white m-0">{exp.item_name}</p>
                        {exp.notes && <p className="text-xs text-[var(--text-tertiary)] m-0">{exp.notes}</p>}
                      </td>
                      <td className="text-xs text-[var(--text-secondary)]">
                        {new Date(`${getLocalDateKey(exp.expense_date)}T00:00:00`).toLocaleDateString()}
                      </td>
                      <td className="text-right font-mono font-bold text-red-400">
                        ${exp.amount.toFixed(2)}
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleEdit(exp)} className="btn-secondary btn-small">
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button onClick={() => handleDelete(exp.id)} className="btn-danger btn-small">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
