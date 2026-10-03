import { useEffect, useState } from 'react'
import { getAllExpenses, createExpense, updateExpense, deleteExpense } from '../services/expensesService'
import { getAllProviders, createProvider } from '../services/providersService'
import { getRecurringExpenses, createRecurringExpense, updateRecurringExpense, deactivateRecurringExpense, processDueRecurringExpenses } from '../services/recurringExpensesService'
import { getExpenseBudgets, createExpenseBudget, updateExpenseBudget, deleteExpenseBudget, getBudgetAlerts } from '../services/expenseBudgetsService'
import { getExpenseAuditLog, getRecentAuditActivity, logExpenseAudit } from '../services/expenseAuditService'
import { getExpenseAttachments, uploadExpenseAttachment, deleteExpenseAttachment } from '../services/expenseAttachmentsService'
import { getLocalDateKey } from '../lib/dateUtils'
import ExpenseChart from '../components/ExpenseChart'
import BudgetCard from '../components/BudgetCard'
import RecurringExpenseCard from '../components/RecurringExpenseCard'
import AuditLog from '../components/AuditLog'
import ExpenseAttachments from '../components/ExpenseAttachments'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [recurringExpenses, setRecurringExpenses] = useState([])
  const [budgets, setBudgets] = useState([])
  const [budgetAlerts, setBudgetAlerts] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [attachments, setAttachments] = useState({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [providers, setProviders] = useState([])

  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState('month')
  const [filterStartDate, setFilterStartDate] = useState(null)
  const [filterEndDate, setFilterEndDate] = useState(null)

  const [categoryTotals, setCategoryTotals] = useState({})
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

  const [recurringFormData, setRecurringFormData] = useState({
    provider_id: 'varios',
    category: 'sueldos',
    item_name: '',
    description: '',
    amount: '',
    frequency: 'monthly',
    day_of_month: new Date().getDate(),
  })

  const [budgetFormData, setBudgetFormData] = useState({
    category: 'pasteles',
    period: 'monthly',
    budget_amount: '',
    alert_threshold: 80,
  })

  const CATEGORIES = [
    { id: 'pasteles', name: '🍰 Insumos', icon: 'bakery_dining', color: 'text-amber-400' },
    { id: 'sueldos', name: '👨‍💼 Sueldos', icon: 'badge', color: 'text-emerald-400' },
    { id: 'servicios', name: '🔧 Servicios Básicos', icon: 'bolt', color: 'text-purple-400' },
    { id: 'otros', name: '📦 Gastos Varios', icon: 'widgets', color: 'text-slate-400' },
  ]

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [expensesResult, providersResult, recurringResult, budgetsResult, alertsResult, auditResult] = await Promise.all([
        getAllExpenses(),
        getAllProviders(),
        getRecurringExpenses(),
        getExpenseBudgets(),
        getBudgetAlerts(),
        getRecentAuditActivity(7),
      ])

      if (expensesResult.ok) {
        setExpenses(expensesResult.data || [])
        calculateCategoryTotals(expensesResult.data || [])
      } else setError(expensesResult.error)

      if (providersResult.ok) setProviders(providersResult.data || [])
      if (recurringResult.ok) setRecurringExpenses(recurringResult.data || [])
      if (budgetsResult.ok) setBudgets(budgetsResult.data || [])
      if (alertsResult.ok) setBudgetAlerts(alertsResult.data || [])
      if (auditResult.ok) setAuditLogs(auditResult.data || [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const calculateCategoryTotals = (expenseList) => {
    const totals = {}
    CATEGORIES.forEach(cat => totals[cat.id] = 0)

    expenseList.forEach((exp) => {
      if (totals.hasOwnProperty(exp.category)) {
        totals[exp.category] += exp.amount || 0
      }
    })

    setCategoryTotals(totals)
  }

  const getFilteredExpenses = () => {
    let filtered = expenses

    if (filterCategory !== 'all') {
      filtered = filtered.filter(e => e.category === filterCategory)
    }

    if (filterStartDate && filterEndDate) {
      filtered = filtered.filter(e => {
        const expDate = new Date(e.expense_date)
        return expDate >= new Date(filterStartDate) && expDate <= new Date(filterEndDate)
      })
    }

    return filtered
  }

  const handleProcessRecurring = async (recurring) => {
    const result = await processDueRecurringExpenses()
    if (result.ok) {
      await loadAllData()
      setError('')
    } else {
      setError(result.error)
    }
  }

  const handleCreateBudget = async (e) => {
    e.preventDefault()
    const amount = parseFloat(budgetFormData.budget_amount)
    if (!amount || amount <= 0) {
      setError('Ingresa un monto válido')
      return
    }

    const today = new Date()
    let startDate = new Date(today)
    let endDate = new Date(today)

    if (budgetFormData.period === 'monthly') {
      startDate.setDate(1)
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0)
    } else if (budgetFormData.period === 'quarterly') {
      const quarter = Math.floor(today.getMonth() / 3)
      startDate.setMonth(quarter * 3, 1)
      endDate.setMonth((quarter + 1) * 3)
      endDate.setDate(0)
    } else if (budgetFormData.period === 'yearly') {
      startDate.setMonth(0, 1)
      endDate.setMonth(11, 31)
    }

    const result = await createExpenseBudget({
      ...budgetFormData,
      budget_amount: amount,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    })

    if (result.ok) {
      await loadAllData()
      setBudgetFormData({ category: 'pasteles', period: 'monthly', budget_amount: '', alert_threshold: 80 })
      setError('')
    } else {
      setError(result.error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const quantity = parseFloat(formData.quantity)
    const unitPrice = parseFloat(formData.unit_price)
    const amount = parseFloat(formData.amount)

    if (!formData.item_name || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(amount) || amount <= 0) {
      setError('Completa todos los campos requeridos correctamente')
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
        await logExpenseAudit(editingId, 'update', null, expenseData)
        await loadAllData()
        resetForm()
      } else {
        setError(result.error)
      }
    } else {
      // Crear nuevo gasto directamente en Supabase
      const result = await createExpense(expenseData)
      if (result.ok) {
        await logExpenseAudit(result.data.id, 'create', null, expenseData)
        await loadAllData()
        resetForm()
      } else {
        setError(result.error || 'Error al guardar el gasto')
      }
    }
  }

  const savePendingExpenses = async () => {
    if (pendingExpenses.length === 0) return
    setSavingPending(true)

    const results = await Promise.all(
      pendingExpenses.map(({ pendingId, ...expense }) => 
        createExpense(expense).then(async (result) => {
          if (result.ok) {
            await logExpenseAudit(result.data.id, 'create', null, expense)
          }
          return result
        })
      )
    )

    const failedResult = results.find((result) => !result.ok)
    if (failedResult) {
      setError(failedResult.error)
    } else {
      await loadAllData()
      setPendingExpenses([])
      resetForm()
    }
    setSavingPending(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este gasto?')) {
      const result = await deleteExpense(id)
      if (result.ok) {
        await logExpenseAudit(id, 'delete')
        await loadAllData()
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
    setUseNewExpenseProduct(false)
    setPendingExpenses([])
  }

  const expenseProducts = [...new Set(
    expenses.map((e) => e.item_name?.trim()).filter(Boolean)
  )].sort()

  const filteredExpenses = getFilteredExpenses()
  const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)
  const last7Days = expenses.filter(e => {
    const date = new Date(e.expense_date)
    const today = new Date()
    const diff = (today - date) / (1000 * 60 * 60 * 24)
    return diff <= 7
  })

  if (loading) return (
    <div className="page-container flex items-center justify-center py-20">
      <div className="text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--accent-orange)] animate-spin">sync</span>
        <p className="mt-2 text-[var(--text-secondary)]">Cargando datos de gastos...</p>
      </div>
    </div>
  )

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <span className="material-symbols-outlined text-red-400 text-3xl">trending_down</span>
          Gestión de Gastos Avanzada
        </h1>
        <button onClick={() => { setActiveTab('gastos'); setShowForm(true) }} className="btn-primary">
          <span className="material-symbols-outlined">add</span>
          Registrar Gasto
        </button>
      </header>

      {/* Alerts & Errors */}
      {error && (
        <div className="error-message flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span>
          <span>{error}</span>
        </div>
      )}

      {budgetAlerts.length > 0 && (
        <div className="card border-l-4 border-red-500 bg-red-950/20">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl text-red-400">warning</span>
            <div>
              <h3 className="font-bold text-white mb-2">⚠️ Alertas de Presupuesto</h3>
              <ul className="space-y-1 text-sm">
                {budgetAlerts.map((alert, idx) => (
                  <li key={idx} className="text-red-300">
                    {alert.budget.category}: ${alert.totalSpent.toFixed(2)} / ${alert.budgetAmount.toFixed(2)} ({alert.percentageUsed.toFixed(1)}%)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { id: 'dashboard', label: '📊 Dashboard', icon: 'dashboard' },
          { id: 'gastos', label: '📝 Gastos', icon: 'receipt' },
          { id: 'recurrentes', label: '🔄 Recurrentes', icon: 'repeat' },
          { id: 'presupuestos', label: '💰 Presupuestos', icon: 'savings' },
          { id: 'auditoria', label: '📋 Auditoría', icon: 'history' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[var(--accent-orange)] text-black'
                : 'bg-white/10 text-[var(--text-secondary)] hover:bg-white/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {/* Category Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                onClick={() => { setActiveTab('gastos'); setFilterCategory(cat.id) }}
                className="bento-card cursor-pointer hover:border-[var(--accent-orange)] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{cat.name}</span>
                  <span className={`material-symbols-outlined text-xl ${cat.color}`}>{cat.icon}</span>
                </div>
                <p className="text-2xl font-extrabold font-mono text-white">
                  ${categoryTotals[cat.id]?.toFixed(2) || '0.00'}
                </p>
              </div>
            ))}
          </div>

          {/* Total Card */}
          <div className="bento-card border-red-500/40 bg-gradient-to-r from-red-950/40 to-red-900/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-red-300">TOTAL EGRESOS</span>
                <h2 className="text-4xl font-extrabold font-mono text-red-400 mt-1">${totalExpenses.toFixed(2)}</h2>
              </div>
              <span className="material-symbols-outlined text-5xl text-red-500/30">trending_down</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-bold text-white mb-4">Gastos por Categoría</h3>
              <ExpenseChart expenses={filteredExpenses} type="category" />
            </div>
            <div className="card">
              <h3 className="font-bold text-white mb-4">Tendencia (Últimos 7 días)</h3>
              <ExpenseChart expenses={last7Days} type="trend" />
            </div>
          </div>

          {/* Budget Status */}
          {budgets.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--accent-orange)]">savings</span>
                Estado de Presupuestos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map((budget) => (
                  <div key={budget.id} className="p-3 bg-white/5 rounded-lg">
                    <p className="font-semibold text-white capitalize mb-2">{budget.category}</p>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Período: {budget.period} | Presupuesto: ${budget.budget_amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring Expenses Summary */}
          {recurringExpenses.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">repeat</span>
                Próximos Gastos Recurrentes
              </h3>
              <div className="space-y-2">
                {recurringExpenses.slice(0, 5).map((recurring) => (
                  <div key={recurring.id} className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <div>
                      <p className="font-semibold text-white text-sm">{recurring.item_name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{new Date(recurring.next_due_date).toLocaleDateString('es-ES')}</p>
                    </div>
                    <span className="font-mono font-bold text-amber-400">${recurring.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GASTOS TAB */}
      {activeTab === 'gastos' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card">
            <h3 className="font-bold text-white mb-3">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-1">Categoría</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full">
                  <option value="all">Todas</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-1">Desde</label>
                <input type="date" value={filterStartDate || ''} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full" />
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-1">Hasta</label>
                <input type="date" value={filterEndDate || ''} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full" />
              </div>
            </div>
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) resetForm(); }}>
              <div className="modal-content max-h-screen overflow-y-auto">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--border-color)]">
                  <h2 className="text-xl font-bold text-white">Registrar Gasto</h2>
                  <button onClick={resetForm} className="text-[var(--text-tertiary)] hover:text-white">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="form-group">
                    <label>Categoría</label>
                    <select name="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Producto/Detalle</label>
                    <input type="text" value={formData.item_name} onChange={(e) => setFormData({...formData, item_name: e.target.value})} required />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="form-group">
                      <label>Cantidad</label>
                      <input type="number" step="0.01" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value, amount: (parseFloat(e.target.value) || 0) * (parseFloat(formData.unit_price) || 0)})} />
                    </div>
                    <div className="form-group">
                      <label>Precio Unit.</label>
                      <input type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: e.target.value, amount: (parseFloat(formData.quantity) || 0) * (parseFloat(e.target.value) || 0)})} />
                    </div>
                    <div className="form-group">
                      <label>Total</label>
                      <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="font-bold text-red-400" required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Fecha</label>
                    <input type="date" value={formData.expense_date} onChange={(e) => setFormData({...formData, expense_date: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <label>Notas</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows="2" />
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-[var(--border-color)]">
                    <button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button>
                    <button type="submit" className="btn-primary">Guardar</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Expenses Table */}
          {filteredExpenses.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-[var(--text-tertiary)]">Sin gastos registrados</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Detalle</th>
                    <th>Fecha</th>
                    <th className="text-right">Monto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => {
                    const category = CATEGORIES.find(c => c.id === exp.category)
                    return (
                      <tr key={exp.id}>
                        <td><span className="badge badge-info text-xs">{category?.name || exp.category}</span></td>
                        <td>{exp.item_name}</td>
                        <td className="text-sm text-[var(--text-secondary)]">{new Date(exp.expense_date).toLocaleDateString()}</td>
                        <td className="text-right font-mono font-bold text-red-400">${exp.amount.toFixed(2)}</td>
                        <td className="text-center">
                          <button onClick={() => handleDelete(exp.id)} className="btn-danger btn-small">
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
      )}

      {/* RECURRENTES TAB */}
      {activeTab === 'recurrentes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {recurringExpenses.map((recurring) => (
              <RecurringExpenseCard
                key={recurring.id}
                recurring={recurring}
                onEdit={() => {}}
                onDelete={() => deactivateRecurringExpense(recurring.id).then(() => loadAllData())}
                onProcess={() => handleProcessRecurring(recurring)}
              />
            ))}
          </div>
          {recurringExpenses.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-[var(--text-tertiary)]">Sin gastos recurrentes configurados</p>
            </div>
          )}
        </div>
      )}

      {/* PRESUPUESTOS TAB */}
      {activeTab === 'presupuestos' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-white mb-4">Crear Nuevo Presupuesto</h3>
            <form onSubmit={handleCreateBudget} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="form-group">
                  <label>Categoría</label>
                  <select value={budgetFormData.category} onChange={(e) => setBudgetFormData({...budgetFormData, category: e.target.value})}>
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Período</label>
                  <select value={budgetFormData.period} onChange={(e) => setBudgetFormData({...budgetFormData, period: e.target.value})}>
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Monto ($)</label>
                  <input type="number" step="0.01" value={budgetFormData.budget_amount} onChange={(e) => setBudgetFormData({...budgetFormData, budget_amount: e.target.value})} required />
                </div>
                <div className="form-group flex flex-col justify-end">
                  <button type="submit" className="btn-primary">Crear</button>
                </div>
              </div>
            </form>
          </div>

          {budgets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} analysis={{}} onEdit={() => {}} onDelete={() => deleteExpenseBudget(budget.id).then(() => loadAllData())} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* AUDITORIA TAB */}
      {activeTab === 'auditoria' && (
        <div className="card">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">history</span>
            Registro de Cambios
          </h3>
          <AuditLog logs={auditLogs} />
        </div>
      )}
    </div>
  )
}
