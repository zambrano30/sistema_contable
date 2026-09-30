import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getTotalSales, getInvoiceStats, getAllInvoices, getMonthlyBalanceData } from '../services/invoicesService'
import { getAllClients } from '../services/clientsService'
import { getAllExpenses } from '../services/expensesService'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [monthlyBalance, setMonthlyBalance] = useState([])
  const [stats, setStats] = useState({
    totalSales: 0,
    monthlyGrowth: 0,
    invoiceCount: 0,
    clientCount: 0,
    recentActivity: [],
    totalExpenses: 0,
    balance: 0,
  })
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      let salesResult
      let invoiceStatsResult
      let clientsResult
      let recentInvoicesResult
      let monthlyBalanceResult

      const today = new Date()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

      salesResult = await getTotalSales('month')
      invoiceStatsResult = await getInvoiceStats()
      clientsResult = await getAllClients()
      recentInvoicesResult = await getAllInvoices()
      monthlyBalanceResult = await getMonthlyBalanceData(6)

      const expensesResult = await getAllExpenses({
        startDate: monthStart.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0],
      })
      const totalExpenses = expensesResult.ok
        ? (expensesResult.data || []).reduce((sum, exp) => sum + (exp.amount || 0), 0)
        : 0

      if (salesResult.ok && invoiceStatsResult.ok && clientsResult.ok) {
        const totalSales = salesResult.data?.total || 0
        const balance = totalSales - totalExpenses

        setStats({
          totalSales,
          monthlyGrowth: salesResult.data?.monthlyGrowth || 0,
          invoiceCount: invoiceStatsResult.data?.total || 0,
          clientCount: clientsResult.data?.length || 0,
          recentActivity: recentInvoicesResult.data?.slice(0, 4) || [],
          totalExpenses,
          balance,
        })
      }

      if (monthlyBalanceResult.ok) {
        setMonthlyBalance(monthlyBalanceResult.data || [])
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatChartCurrency = (value) => {
    const abs = Math.abs(value)

    if (abs >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }

    if (abs >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }

    return `$${Number(value).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
  }

  const maxMonthlyValue = Math.max(
    1,
    ...monthlyBalance.map((item) => Math.max(item.sales, item.expenses, Math.abs(item.balance), 1))
  )

  const formatMonthLabel = (month) => {
    if (!month) return ''
    const [year, monthNumber] = month.split('-')
    const date = new Date(Number(year), Number(monthNumber) - 1, 1)
    return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 m-0 font-heading">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">grid_view</span>
            <span>Panel Principal</span>
          </h1>

        </div>

        <div className="flex items-center gap-3">
          <button 
            className="btn-primary" 
            onClick={() => navigate('/sales')}
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span>Nueva Venta POS</span>
          </button>
        </div>
      </header>

      {/* Hero / Quick Stats Bento Grid */}
      <section className="bento-grid">
        {/* Total Sales Bento Hero */}
        <div className="bento-hero">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <span className="bento-hero-title">Ventas Totales</span>
              <h2 className="bento-hero-value">
                {loading ? '---' : formatCurrency(stats.totalSales)}
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-semibold opacity-90 mt-2">
                <span className="material-symbols-outlined text-sm">
                  {stats.monthlyGrowth >= 0 ? 'trending_up' : 'trending_down'}
                </span>
                <span>
                  {loading ? '---' : `${Math.abs(stats.monthlyGrowth).toFixed(1)}% rendimiento`}
                </span>
              </div>
            </div>
          </div>
          <div className="absolute right-[-15px] bottom-[-15px] opacity-15 pointer-events-none">
            <span className="material-symbols-outlined text-[120px]">payments</span>
          </div>
        </div>

        {/* Invoices Count Bento Card */}
        <div className="bento-card">
          <div>
            <span className="card-label">Facturas Emitidas</span>
            <div className="card-value">
              {loading ? '---' : stats.invoiceCount}
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-4 font-medium">
            Total de facturas registradas
          </p>
        </div>

        {/* Clients Count Bento Card */}
        <div className="bento-card">
          <div>
            <span className="card-label">Clientes Activos</span>
            <div className="card-value">
              {loading ? '---' : stats.clientCount}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="material-symbols-outlined text-[var(--secondary)] text-lg">group</span>
            <p className="text-xs text-[var(--text-secondary)]">Registrados en la base</p>
          </div>
        </div>

        {/* Total Expenses Bento Card */}
        <div className="bento-card border-red-500/30 bg-red-500/5">
          <div>
            <span className="card-label text-red-300">Gastos Registrados</span>
            <div className="card-value text-red-400">
              {loading ? '---' : formatCurrency(stats.totalExpenses)}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-red-400 font-medium">
            <span className="material-symbols-outlined text-sm">trending_down</span>
            <span>Egresos del periodo</span>
          </div>
        </div>

        {/* Balance Bento Card */}
        <div className={`bento-card col-span-1 md:col-span-2 border ${stats.balance >= 0 ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
          <div>
            <span className={`card-label ${stats.balance >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              Balance Neto
            </span>
            <div className={`card-value text-2xl ${stats.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {loading ? '---' : formatCurrency(stats.balance)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
            <span className={stats.balance >= 0 ? 'text-emerald-300' : 'text-red-300'}>
              Utilidad (Ventas - Gastos)
            </span>
            <span className="material-symbols-outlined" style={{color: stats.balance >= 0 ? '#30d158' : '#ff453a'}}>
              {stats.balance >= 0 ? 'account_balance_wallet' : 'warning'}
            </span>
          </div>
        </div>
      </section>

      {/* Quick Actions Row */}
      <section className="flex flex-wrap gap-3">
        <button 
          className="btn-secondary" 
          onClick={() => navigate('/products')}
        >
          <span className="material-symbols-outlined text-[var(--accent-orange)]">inventory_2</span>
          <span>Catálogo de Productos</span>
        </button>
        <button 
          className="btn-secondary" 
          onClick={() => navigate('/clients')}
        >
          <span className="material-symbols-outlined text-[var(--secondary)]">person_add</span>
          <span>Gestión de Clientes</span>
        </button>
        <button 
          className="btn-secondary" 
          onClick={() => navigate('/expenses')}
        >
          <span className="material-symbols-outlined text-red-400">add_card</span>
          <span>Registrar Gasto</span>
        </button>
      </section>

      <div className="grid grid-cols-1 gap-6">
        <section className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-extrabold m-0 text-[var(--text-primary)]">Balance mensual</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Ventas, gastos y utilidad por mes</p>
            </div>
          </div>

          {monthlyBalance.length > 0 ? (
            <div className="grid grid-cols-6 gap-3 items-end h-52">
              {monthlyBalance.map((item) => {
                const salesHeight = Math.max((item.sales / maxMonthlyValue) * 100, 8)
                const expensesHeight = Math.max((item.expenses / maxMonthlyValue) * 100, 8)

                return (
                  <div key={item.month} className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="flex items-end justify-center gap-1 h-36 w-full">
                      <div
                        className="w-1/2 rounded-t-xl bg-emerald-500/80 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                        title={`Ventas ${formatCurrency(item.sales)}`}
                        style={{ height: `${salesHeight}%` }}
                      />
                      <div
                        className="w-1/2 rounded-t-xl bg-red-500/80 shadow-[0_0_16px_rgba(239,68,68,0.35)]"
                        title={`Gastos ${formatCurrency(item.expenses)}`}
                        style={{ height: `${expensesHeight}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-[var(--text-secondary)]">{formatMonthLabel(item.month)}</div>
                      <div className={`text-[10px] font-bold ${item.balance >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {formatCurrency(item.balance)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-secondary)] text-sm">Sin datos del balance mensual</div>
          )}
        </section>

        {/* Recent Activity List */}
        <section className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold m-0 text-[var(--text-primary)]">Últimas Facturas</h3>
            <button onClick={() => navigate('/invoices')} className="btn-link text-xs uppercase tracking-wider font-bold">Ver todas</button>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center py-8 text-[var(--text-secondary)] text-sm">Cargando...</div>
            ) : stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[var(--accent-orange)]/30 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => navigate('/sales')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-orange)]/15 border border-[var(--accent-orange)]/30 flex items-center justify-center text-[var(--accent-orange)]">
                      <span className="material-symbols-outlined text-xl">receipt</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold m-0 text-[var(--text-primary)] font-mono">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] m-0">
                        {invoice.clients?.name || 'Consumidor Final'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono m-0 text-[var(--text-primary)]">
                      {formatCurrency(invoice.total_amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[var(--text-secondary)] text-sm">No hay facturas recientes</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

