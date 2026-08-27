import { useEffect, useState } from 'react'
import { getAllExpenses, createExpense, updateExpense, deleteExpense } from '../services/expensesService'
import { getAllProviders, createProvider } from '../services/providersService'
import { getLocalDateKey } from '../lib/dateUtils'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [providers, setProviders] = useState([])
  const [showNewProvider, setShowNewProvider] = useState(false)
  const [newProviderName, setNewProviderName] = useState('')
  const [creatingProvider, setCreatingProvider] = useState(false)
  const [useNewExpenseProduct, setUseNewExpenseProduct] = useState(false)
  const [pendingExpenses, setPendingExpenses] = useState([])
  const [savingPending, setSavingPending] = useState(false)

  const [formData, setFormData] = useState({
    provider_id: 'varios',
    category: 'pasteles',
    item_name: '',
    description: '',
    quantity: '',
    unit_price: '',
    amount: '',
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
    const [expensesResult, providersResult] = await Promise.all([
      getAllExpenses(),
      getAllProviders(),
    ])

    if (expensesResult.ok) {
      setExpenses(expensesResult.data || [])
      calculateCategoryTotals(expensesResult.data || [])
    } else setError(expensesResult.error)

    if (providersResult.ok) setProviders(providersResult.data || [])
    else setError(providersResult.error)

    setLoading(false)
  }

  const handleCreateProvider = async (e) => {
    e.preventDefault()
    const name = newProviderName.trim()
    if (!name) return

    setCreatingProvider(true)
    const result = await createProvider(name)
    if (result.ok) {
      setProviders((currentProviders) => [...currentProviders, result.data].sort((a, b) => a.name.localeCompare(b.name)))
      setFormData((currentData) => ({ ...currentData, provider_id: result.data.id.toString() }))
      setNewProviderName('')
      setShowNewProvider(false)
    } else {
      setError(result.error)
    }
    setCreatingProvider(false)
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
      updatedData.amount = updatedData.quantity !== '' && updatedData.unit_price !== ''
        ? calculateAmount(updatedData.quantity, updatedData.unit_price)
        : ''
    }

    if (name === 'amount') {
      updatedData.amount = value === '' ? '' : parseFloat(value) || 0
    }

    setFormData(updatedData)
  }

  const expenseProducts = [...new Set(
    expenses
      .map((expense) => expense.item_name?.trim())
      .filter(Boolean)
  )].sort((firstProduct, secondProduct) => firstProduct.localeCompare(secondProduct))

  const handleExpenseProductChange = (e) => {
    const value = e.target.value
    if (value === '__new__') {
      setUseNewExpenseProduct(true)
      setFormData((currentData) => ({ ...currentData, item_name: '' }))
      return
    }

    setUseNewExpenseProduct(false)
    setFormData((currentData) => ({ ...currentData, item_name: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const quantity = parseFloat(formData.quantity)
    const unitPrice = parseFloat(formData.unit_price)
    const amount = parseFloat(formData.amount)

    if (!formData.item_name || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(amount) || amount <= 0) {
      setError('Producto, cantidad, precio unitario y monto válidos requeridos')
      return
    }

    const expenseData = {
      provider_id: formData.provider_id === 'varios' ? null : parseInt(formData.provider_id),
      category: formData.category,
      item_name: formData.item_name,
      description: formData.description,
      quantity,
      unit_price: unitPrice,
      amount,
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
      setPendingExpenses((currentExpenses) => [...currentExpenses, { ...expenseData, pendingId: crypto.randomUUID() }])
      setFormData((currentData) => ({
        ...currentData,
        item_name: '',
        quantity: '',
        unit_price: '',
        amount: '',
        description: '',
        notes: '',
      }))
      setUseNewExpenseProduct(false)
    }
  }

  const removePendingExpense = (pendingId) => {
    setPendingExpenses((currentExpenses) => currentExpenses.filter((expense) => expense.pendingId !== pendingId))
  }

  const savePendingExpenses = async () => {
    if (pendingExpenses.length === 0) return

    setSavingPending(true)
    const results = await Promise.all(pendingExpenses.map(({ pendingId, ...expense }) => createExpense(expense)))
    const failedResult = results.find((result) => !result.ok)

    if (failedResult) {
      setError(failedResult.error)
    } else {
      await loadData()
      setPendingExpenses([])
      resetForm()
    }
    setSavingPending(false)
  }

  const handleEdit = (expense) => {
    setUseNewExpenseProduct(false)
    setFormData({
      provider_id: expense.provider_id?.toString() || 'varios',
      category: expense.category,
      item_name: expense.item_name,
      description: expense.description || '',
      quantity: expense.quantity ?? '',
      unit_price: expense.unit_price ?? '',
      amount: expense.amount ?? '',
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
      provider_id: 'varios',
      category: 'pasteles',
      item_name: '',
      description: '',
      quantity: '',
      unit_price: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setShowForm(false)
    setEditingId(null)
    setShowNewProvider(false)
    setNewProviderName('')
    setUseNewExpenseProduct(false)
    setPendingExpenses([])
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
        <button type="button" onClick={() => window.print()} className="btn-secondary print-hide">
          <span className="material-symbols-outlined">print</span>
          <span>Imprimir</span>
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
                <label htmlFor="expense-provider">Proveedor</label>
                <div className="flex gap-2">
                  <select
                    id="expense-provider"
                    name="provider_id"
                    value={formData.provider_id}
                    onChange={handleFormChange}
                    className="flex-1"
                  >
                    <option value="varios">Varios / Sin proveedor</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewProvider(!showNewProvider)}
                    className="btn-secondary whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined">person_add</span>
                    <span>Nuevo</span>
                  </button>
                </div>
              </div>

              {showNewProvider && (
                <div className="p-3 rounded-xl border border-[var(--accent-orange)]/30 bg-[var(--accent-orange)]/10">
                  <div className="flex gap-2 items-end">
                    <div className="form-group flex-1">
                      <label htmlFor="new-provider-name">Nombre del proveedor</label>
                      <input
                        id="new-provider-name"
                        type="text"
                        value={newProviderName}
                        onChange={(e) => setNewProviderName(e.target.value)}
                        placeholder="Ej: Distribuidora Central"
                        autoFocus
                      />
                    </div>
                    <button type="button" onClick={handleCreateProvider} disabled={creatingProvider || !newProviderName.trim()} className="btn-primary">
                      {creatingProvider ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )}

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
                <label htmlFor="expense-product">Producto / Detalle del Gasto *</label>
                <select
                  id="expense-product"
                  value={useNewExpenseProduct ? '__new__' : formData.item_name}
                  onChange={handleExpenseProductChange}
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {expenseProducts.map((product) => (
                    <option key={product} value={product}>{product}</option>
                  ))}
                  <option value="__new__">+ Crear nuevo producto</option>
                </select>
                {useNewExpenseProduct && (
                  <input
                    type="text"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleFormChange}
                    placeholder="Escribe el nombre del nuevo producto"
                    autoFocus
                    required
                  />
                )}
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

              {!editingId && pendingExpenses.length > 0 && (
                <div className="space-y-2 rounded-xl border border-[var(--border-color)] p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white m-0">Gastos de esta sesión ({pendingExpenses.length})</h3>
                    <span className="text-xs text-[var(--text-secondary)]">
                      ${pendingExpenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
                    </span>
                  </div>
                  {pendingExpenses.map((expense) => (
                    <div key={expense.pendingId} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate m-0">{expense.item_name}</p>
                        <p className="text-xs text-[var(--text-secondary)] m-0">
                          {expense.quantity} x ${expense.unit_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-mono text-red-300">${expense.amount.toFixed(2)}</span>
                        <button type="button" onClick={() => removePendingExpense(expense.pendingId)} className="text-red-400 hover:text-red-300" title="Quitar gasto">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
                  <span className="material-symbols-outlined">{editingId ? 'save' : 'playlist_add'}</span>
                  <span>{editingId ? 'Actualizar Gasto' : 'Agregar Gasto'}</span>
                </button>
                {!editingId && pendingExpenses.length > 0 && (
                  <button type="button" onClick={savePendingExpenses} disabled={savingPending} className="btn-primary">
                    <span className="material-symbols-outlined">save</span>
                    <span>{savingPending ? 'Guardando...' : `Guardar Todos (${pendingExpenses.length})`}</span>
                  </button>
                )}
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
