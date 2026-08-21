import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getTotalSales, getMonthlySalesData, getInvoiceStats, getAllInvoices } from '../services/invoicesService'
import { getAllClients } from '../services/clientsService'
import { getAllExpenses } from '../services/expensesService'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSales: 0,
    monthlyGrowth: 0,
    invoiceCount: 0,
    clientCount: 0,
    paidPercentage: 0,
    recentActivity: [],
    totalExpenses: 0,
    balance: 0,
  })
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      const salesResult = await getTotalSales('month')
      const invoiceStatsResult = await getInvoiceStats()
      const clientsResult = await getAllClients()
      const chartResult = await getMonthlySalesData(6)
      const recentInvoicesResult = await getAllInvoices()

      const expensesResult = await getAllExpenses()
      const totalExpenses = expensesResult.ok 
        ? (expensesResult.data || []).reduce((sum, exp) => sum + (exp.amount || 0), 0)
        : 0

      if (salesResult.ok && invoiceStatsResult.ok && clientsResult.ok) {
        const paidCount = invoiceStatsResult.data?.paid || 0
        const totalInvoices = invoiceStatsResult.data?.total || 1
        const paidPercentage = (paidCount / totalInvoices) * 100
        const totalSales = salesResult.data?.total || 0
        const balance = totalSales - totalExpenses

        setStats({
          totalSales,
          monthlyGrowth: salesResult.data?.monthlyGrowth || 0,
          invoiceCount: invoiceStatsResult.data?.total || 0,
          clientCount: clientsResult.data?.length || 0,
          paidPercentage,
          recentActivity: recentInvoicesResult.data?.slice(0, 4) || [],
          totalExpenses,
          balance,
        })
      }

      if (chartResult.ok) {
        setChartData(chartResult.data || [])
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

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">grid_view</span>
            <span>Panel Principal</span>
          </h1>
          <p className="page-subtitle">Resumen general de facturación, ingresos y clientes</p>
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
          <div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-4 overflow-hidden">
              <div
                className="bg-[var(--accent-orange)] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.paidPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium">
              {loading ? '---' : `${stats.paidPercentage.toFixed(0)}% cobradas exitosamente`}
            </p>
          </div>
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

      {/* Monthly Sales Chart & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Sales Chart */}
        <section className="card lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-extrabold m-0 text-[var(--text-primary)]">Rendimiento de Ventas Mensuales</h3>
              <p className="text-xs text-[var(--text-secondary)] m-0">Historial de facturación acumulada</p>
            </div>
            <div className="p-2 rounded-xl bg-white/5 text-[var(--accent-orange)]">
              <span className="material-symbols-outlined">show_chart</span>
            </div>
          </div>

          <div className="relative h-48 w-full mt-4">
            {!loading && chartData.length > 0 && chartData.some(d => d.total > 0) ? (
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ff9f0a" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ff9f0a" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path 
                  d={generateChartPath(chartData, 100)} 
                  fill="url(#chartGradient)"
                ></path>
                <path 
                  d={generateChartPath(chartData, 100)} 
                  fill="none" 
                  stroke="#ff9f0a" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                ></path>
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">
                {loading ? 'Cargando datos...' : 'Sin registros de ventas en el gráfico'}
              </div>
            )}
          </div>
          <div className="flex justify-between mt-4 border-t border-[var(--border-color)] pt-3 px-1">
            {chartData.slice(-6).map((data, idx) => (
              <span key={idx} className="text-xs text-[var(--text-tertiary)] font-bold">
                {data.month.split('-')[1]}
              </span>
            ))}
          </div>
        </section>

        {/* Recent Activity List */}
        <section className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold m-0 text-[var(--text-primary)]">Últimas Facturas</h3>
            <button onClick={() => navigate('/sales')} className="btn-link text-xs uppercase tracking-wider font-bold">Ver todas</button>
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
                    <span className={`badge mt-1 ${
                      invoice.status === 'paid' ? 'badge-success' : 
                      invoice.status === 'sent' ? 'badge-info' : 
                      invoice.status === 'draft' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {invoice.status === 'paid' ? 'Pagada' :
                       invoice.status === 'sent' ? 'Enviada' :
                       invoice.status === 'draft' ? 'Borrador' : 'Cancelada'}
                    </span>
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

function generateChartPath(data, height) {
  if (data.length === 0) return ''
  
  const maxValue = Math.max(...data.map(d => d.total), 1)
  const width = 400
  const pointWidth = width / (data.length - 1 || 1)
  
  let path = `M0,${height - (data[0].total / maxValue) * (height - 15)}`
  
  for (let i = 1; i < data.length; i++) {
    const x = i * pointWidth
    const y = height - (data[i].total / maxValue) * (height - 15)
    path += ` L${x},${y}`
  }
  
  path += ` L${width},${height} L0,${height} Z`
  return path
}
