import { useEffect, useState } from 'react'
import { getAllExpenses, createExpense, updateExpense, deleteExpense, getTotalExpensesByCategory } from '../services/expensesService'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // Form state
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

  // Category totals
  const [categoryTotals, setCategoryTotals] = useState({
    pasteles: 0,
    jugos: 0,
    sueldos: 0,
    servicios: 0,
    otros: 0,
  })

  // Filter by category
  const [filterCategory, setFilterCategory] = useState('all')

  const CATEGORIES = [
    { id: 'pasteles', name: '🍰 Pasteles', color: 'bg-pink-100 text-pink-700' },
    { id: 'jugos', name: '🥤 Jugos', color: 'bg-blue-100 text-blue-700' },
    { id: 'sueldos', name: '👨‍💼 Sueldos', color: 'bg-green-100 text-green-700' },
    { id: 'servicios', name: '🔧 Servicios', color: 'bg-purple-100 text-purple-700' },
    { id: 'otros', name: '📦 Otros', color: 'bg-gray-100 text-gray-700' },
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const result = await getAllExpenses()
    if (result.ok) {
      setExpenses(result.data)
      calculateCategoryTotals(result.data)
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
      if (totals.hasOwnProperty(exp.category)) {
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

    // Auto-calculate amount when quantity or unit_price changes
    if (name === 'quantity' || name === 'unit_price') {
      updatedData.amount = calculateAmount(updatedData.quantity, updatedData.unit_price)
    }

    // If amount is manually set
    if (name === 'amount') {
      updatedData.amount = parseFloat(value) || 0
    }

    setFormData(updatedData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.item_name || formData.amount <= 0) {
      setError('Nombre del gasto y monto requeridos')
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
    if (confirm('¿Eliminar este gasto?')) {
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

  if (loading) return <div className="page-container"><p>Cargando gastos...</p></div>

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div>
          <span className="text-[0.75rem] font-bold text-[var(--accent-orange-light)] uppercase tracking-wider">
            Lumina Ledger • Gastos
          </span>
          <h1 className="mt-1">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">receipt_long</span>
            <span>Gestión de Gastos</span>
          </h1>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          <span className="material-symbols-outlined">add</span>
          <span>{editingId ? 'Actualizar' : 'Nuevo Gasto'}</span>
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Category Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className={`p-4 rounded border border-[var(--border-color)] cursor-pointer transition ${
              filterCategory === cat.id ? 'ring-2 ring-[var(--accent-orange)]' : ''
            } ${filterCategory === 'all' ? '' : 'hover:ring-2 hover:ring-[var(--accent-orange)]'}`}
            onClick={() => setFilterCategory(filterCategory === cat.id ? 'all' : cat.id)}
          >
            <p className="text-sm text-[var(--text-secondary)] mb-1">{cat.name}</p>
            <p className="text-2xl font-bold text-[var(--accent-orange)]">
              ${categoryTotals[cat.id].toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Total Expenses */}
      <div className="card bg-[var(--bg-secondary)] border-2 border-[var(--accent-orange)] p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">GASTO TOTAL DEL MES</p>
            <p className="text-4xl font-bold text-[var(--accent-orange)]">
              ${totalExpenses.toFixed(2)}
            </p>
          </div>
          <span className="material-symbols-outlined text-6xl text-[var(--accent-orange)] opacity-20">
            trending_down
          </span>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 mb-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-orange)]">edit_note</span>
            {editingId ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Categoría
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-orange)]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Nombre del Gasto
              </label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleFormChange}
                placeholder="ej: Harina, Azúcar, Electricidad..."
                className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-orange)]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Descripción (opcional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Detalles adicionales..."
                rows="2"
                className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-orange)]"
              />
            </div>

            {/* Quantity and Unit Price */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Precio Unitario
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--accent-orange)] mb-2">
                  Monto Total
                </label>
                <div className="w-full px-3 py-2 rounded bg-[var(--bg-primary)] border border-[var(--accent-orange)] text-[var(--text-primary)] font-bold text-lg">
                  ${formData.amount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Amount Manual */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                O ingresa el monto total directamente
              </label>
              <input
                type="number"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleFormChange}
                placeholder="0.00"
                className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Fecha del Gasto
              </label>
              <input
                type="date"
                name="expense_date"
                value={formData.expense_date}
                onChange={handleFormChange}
                className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Notas (opcional)
              </label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Referencia, proveedor, etc..."
                className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingId ? 'Actualizar' : 'Registrar'} Gasto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses List */}
      <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)]">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 p-6 pb-0">
          <span className="material-symbols-outlined text-[var(--accent-orange)]">format_list_bulleted</span>
          {filterCategory === 'all' ? 'Todos los Gastos' : `Gastos de ${CATEGORIES.find(c => c.id === filterCategory)?.name}`}
        </h3>

        {filteredExpenses.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] py-8">
            {filterCategory === 'all' ? 'Sin gastos registrados' : 'Sin gastos en esta categoría'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Gasto</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Descripción</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-[var(--text-secondary)] uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-[var(--text-secondary)] uppercase">Precio Unit.</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-[var(--text-secondary)] uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => {
                  const category = CATEGORIES.find(c => c.id === exp.category)
                  return (
                    <tr key={exp.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${category?.color}`}>
                          {category?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-primary)] font-medium">{exp.item_name}</td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">{exp.description || '-'}</td>
                      <td className="px-6 py-4 text-center text-[var(--text-primary)]">{exp.quantity}</td>
                      <td className="px-6 py-4 text-right text-[var(--text-primary)]">${exp.unit_price?.toFixed(2) || '0.00'}</td>
                      <td className="px-6 py-4 text-right text-[var(--text-primary)] font-bold text-[var(--accent-orange)]">
                        ${exp.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">
                        {new Date(exp.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(exp)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
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
