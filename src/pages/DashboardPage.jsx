import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getTotalSales, getMonthlySalesData, getInvoiceStats, getAllInvoices } from '../services/invoicesService'
import { getAllClients } from '../services/clientsService'
import { getTotalExpensesByCategory, getAllExpenses } from '../services/expensesService'

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

      // Load sales data
      const salesResult = await getTotalSales('month')
      
      // Load invoice stats
      const invoiceStatsResult = await getInvoiceStats()
      
      // Load clients count
      const clientsResult = await getAllClients()
      
      // Load monthly chart data
      const chartResult = await getMonthlySalesData(6)
      
      // Load recent invoices
      const recentInvoicesResult = await getAllInvoices()

      // Load total expenses
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
          recentActivity: recentInvoicesResult.data?.slice(0, 3) || [],
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
          <span className="text-[0.75rem] font-bold text-[var(--accent-orange-light)] uppercase tracking-wider">
            Lumina Ledger • Dashboard
          </span>
          <h1 className="mt-1">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">space_dashboard</span>
            <span>Panel Principal</span>
          </h1>
          <p className="page-subtitle">Bienvenido de nuevo, {user?.email}</p>
        </div>
      </header>

      {/* Hero / Quick Stats Bento Grid */}
      <section className="bento-grid">
        {/* Total Sales Bento Hero */}
        <div className="bento-hero">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <span className="bento-hero-title">Ventas Totales</span>
              <h2 className="bento-hero-value font-mono">
                {loading ? '---' : formatCurrency(stats.totalSales)}
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-semibold opacity-90 mt-2">
                <span className="material-symbols-outlined text-sm">
                  {stats.monthlyGrowth >= 0 ? 'trending_up' : 'trending_down'}
                </span>
                <span>
                  {loading ? '---' : `${Math.abs(stats.monthlyGrowth).toFixed(1)}% este mes`}
                </span>
              </div>
            </div>
          </div>
          <div className="absolute right-[-15px] bottom-[-15px] opacity-15 pointer-events-none">
            <span className="material-symbols-outlined text-[110px]">payments</span>
          </div>
        </div>

        {/* Invoices Count Bento Card */}
        <div className="bento-card">
          <div>
            <span className="card-label">Facturas Emitidas</span>
            <div className="card-value font-mono">
              {loading ? '---' : stats.invoiceCount}
            </div>
          </div>
          <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2 mt-4 overflow-hidden">
            <div
              className="bg-[var(--accent-orange)] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.paidPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            {loading ? '---' : `${stats.paidPercentage.toFixed(0)}% pagadas`}
          </p>
        </div>

        {/* Clients Count Bento Card */}
        <div className="bento-card">
          <div>
            <span className="card-label">Clientes Activos</span>
            <div className="card-value font-mono">
              {loading ? '---' : stats.clientCount}
            </div>
          </div>
          <div className="flex -space-x-2 mt-4">
            {!loading && stats.clientCount > 0 ? (
              <>
                <div className="w-7 h-7 rounded-full border-2 border-[var(--bg-secondary)] bg-[var(--secondary)] text-[#1b247f] font-bold text-[10px] flex items-center justify-center">
                  CL
                </div>
                <div className="w-7 h-7 rounded-full border-2 border-[var(--bg-secondary)] bg-[var(--tertiary)] text-[#003549] font-bold text-[10px] flex items-center justify-center">
                  AC
                </div>
                <div className="w-7 h-7 rounded-full border-2 border-[var(--bg-secondary)] bg-[var(--accent-orange)] text-[#4a2800] font-bold text-[10px] flex items-center justify-center">
                  VT
                </div>
              </>
            ) : (
              <div className="text-xs text-[var(--text-secondary)]">---</div>
            )}
          </div>
        </div>

        {/* Total Expenses Bento Card */}
        <div className="bento-card bg-red-950 bg-opacity-30 border-red-900 border-opacity-50">
          <div>
            <span className="card-label text-red-300">Gastos Totales</span>
            <div className="card-value font-mono text-red-400">
              {loading ? '---' : formatCurrency(stats.totalExpenses)}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="material-symbols-outlined text-red-400">trending_down</span>
            <p className="text-xs text-red-300">Mes actual</p>
          </div>
        </div>

        {/* Balance Bento Card - HERO */}
        <div className={`bento-card col-span-1 md:col-span-2 border-2 ${stats.balance >= 0 ? 'border-green-500 bg-green-950 bg-opacity-50' : 'border-red-500 bg-red-950 bg-opacity-50'}`}>
          <div>
            <span className={`card-label ${stats.balance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              Balance Neto
            </span>
            <div className={`card-value font-mono text-2xl ${stats.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {loading ? '---' : formatCurrency(stats.balance)}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-opacity-30" style={{borderColor: stats.balance >= 0 ? 'rgb(34 197 94)' : 'rgb(239 68 68)'}}>
            <div className="flex items-center justify-between text-xs">
              <span className={stats.balance >= 0 ? 'text-green-300' : 'text-red-300'}>
                Ingresos - Gastos
              </span>
              <span className="material-symbols-outlined" style={{color: stats.balance >= 0 ? 'rgb(74 222 128)' : 'rgb(248 113 113)'}}>
                {stats.balance >= 0 ? 'trending_up' : 'trending_down'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Row */}
      <section className="flex flex-wrap gap-3 my-2">
        <button 
          className="btn-primary" 
          onClick={() => navigate('/sales')}
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span>Nueva Venta</span>
        </button>
        <button 
          className="btn-secondary" 
          onClick={() => navigate('/products')}
        >
          <span className="material-symbols-outlined">inventory_2</span>
          <span>Catálogo Productos</span>
        </button>
        <button 
          className="btn-secondary" 
          onClick={() => navigate('/clients')}
        >
          <span className="material-symbols-outlined">person_add</span>
          <span>Agregar Cliente</span>
        </button>
      </section>

      {/* Monthly Sales Chart Section */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold m-0 text-[var(--text-primary)]">Rendimiento Mensual</h3>
            <p className="text-xs text-[var(--text-secondary)] m-0">Comparativa de ingresos netos facturados</p>
          </div>
          <span className="material-symbols-outlined text-[var(--text-tertiary)] cursor-pointer">more_vert</span>
        </div>

        <div className="relative h-44 w-full mt-4">
          {!loading && chartData.length > 0 && chartData.some(d => d.total > 0) ? (
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffc081" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ff9800" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path 
                d={generateChartPath(chartData, 100)} 
                fill="url(#chartGradient)"
              ></path>
              <path 
                d={generateChartPath(chartData, 100)} 
                fill="none" 
                stroke="#ffc081" 
                strokeWidth="3" 
                strokeLinecap="round"
              ></path>
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
              {loading ? 'Cargando...' : 'Sin datos disponibles'}
            </div>
          )}
          <div className="flex justify-between mt-3 px-1">
            {chartData.slice(-4).map((data, idx) => (
              <span key={idx} className="text-xs text-[var(--text-tertiary)] font-semibold">
                {data.month.split('-')[1]}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity List */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold m-0 text-[var(--text-primary)]">Actividad Reciente</h3>
          <button className="btn-link text-xs uppercase tracking-wider font-semibold">Ver todo</button>
        </div>

        <div className="flex flex-col gap-2.5">
          {loading ? (
            <div className="text-center py-8 text-[var(--text-secondary)]">Cargando actividad...</div>
          ) : stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                onClick={() => navigate('/sales')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-container-high)] flex items-center justify-center text-[var(--accent-orange)]">
                    <span className="material-symbols-outlined">receipt_long</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold m-0 text-[var(--text-primary)]">
                      {invoice.invoice_number}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] m-0">
                      {invoice.clients?.name || 'Cliente'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono m-0 text-[var(--text-primary)]">
                    {formatCurrency(invoice.total_amount)}
                  </p>
                  <span className={`badge ${
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
            <div className="text-center py-8 text-[var(--text-secondary)]">No hay actividad reciente</div>
          )}
        </div>
      </section>
    </div>
  )
}

/**
 * Generate SVG path for chart based on data
 */
function generateChartPath(data, height) {
  if (data.length === 0) return ''
  
  const maxValue = Math.max(...data.map(d => d.total), 1)
  const width = 400
  const pointWidth = width / (data.length - 1 || 1)
  
  let path = `M0,${height - (data[0].total / maxValue) * (height - 10)}`
  
  for (let i = 1; i < data.length; i++) {
    const x = i * pointWidth
    const y = height - (data[i].total / maxValue) * (height - 10)
    path += ` L${x},${y}`
  }
  
  path += ` L${width},${height} L0,${height} Z`
  return path
}
