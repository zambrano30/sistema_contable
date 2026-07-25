import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

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
              <h2 className="bento-hero-value font-mono">$128.450</h2>
              <div className="flex items-center gap-1.5 text-xs font-semibold opacity-90 mt-2">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>+12.5% este mes</span>
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
            <div className="card-value font-mono">342</div>
          </div>
          <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2 mt-4 overflow-hidden">
            <div className="bg-[var(--accent-orange)] h-full rounded-full w-3/4"></div>
          </div>
        </div>

        {/* Clients Count Bento Card */}
        <div className="bento-card">
          <div>
            <span className="card-label">Clientes Activos</span>
            <div className="card-value font-mono">89</div>
          </div>
          <div className="flex -space-x-2 mt-4">
            <div className="w-7 h-7 rounded-full border-2 border-[var(--bg-secondary)] bg-[var(--secondary)] text-[#1b247f] font-bold text-[10px] flex items-center justify-center">JD</div>
            <div className="w-7 h-7 rounded-full border-2 border-[var(--bg-secondary)] bg-[var(--tertiary)] text-[#003549] font-bold text-[10px] flex items-center justify-center">AM</div>
            <div className="w-7 h-7 rounded-full border-2 border-[var(--bg-secondary)] bg-[var(--accent-orange)] text-[#4a2800] font-bold text-[10px] flex items-center justify-center">RC</div>
            <div className="w-7 h-7 rounded-full border-2 border-[var(--bg-secondary)] bg-[var(--bg-container-highest)] text-[var(--text-secondary)] font-bold text-[10px] flex items-center justify-center">+5</div>
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
          <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffc081" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ff9800" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M0,80 Q50,75 100,40 T200,50 T300,20 T400,30 L400,100 L0,100 Z" fill="url(#chartGradient)"></path>
            <path d="M0,80 Q50,75 100,40 T200,50 T300,20 T400,30" fill="none" stroke="#ffc081" strokeWidth="3" strokeLinecap="round"></path>
            <circle cx="300" cy="20" r="5" fill="#ff9800" className="animate-pulse"></circle>
          </svg>
          <div className="flex justify-between mt-3 px-1">
            <span className="text-xs text-[var(--text-tertiary)] font-semibold">Ene</span>
            <span className="text-xs text-[var(--text-tertiary)] font-semibold">Feb</span>
            <span className="text-xs text-[var(--text-tertiary)] font-semibold">Mar</span>
            <span className="text-xs text-[var(--text-tertiary)] font-semibold">Abr</span>
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
          {/* Activity Item 1 */}
          <div className="flex items-center justify-between p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-container-high)] flex items-center justify-center text-[var(--accent-orange)]">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <div>
                <p className="text-sm font-semibold m-0 text-[var(--text-primary)]">Factura #F-2026-089</p>
                <p className="text-xs text-[var(--text-secondary)] m-0">Distribuidora Global S.A.</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold font-mono m-0 text-[var(--text-primary)]">$1,420.00</p>
              <span className="badge badge-success">Pagada</span>
            </div>
          </div>

          {/* Activity Item 2 */}
          <div className="flex items-center justify-between p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-container-high)] flex items-center justify-center text-[var(--tertiary)]">
                <span className="material-symbols-outlined">person</span>
              </div>
              <div>
                <p className="text-sm font-semibold m-0 text-[var(--text-primary)]">Nuevo Cliente Registrado</p>
                <p className="text-xs text-[var(--text-secondary)] m-0">Estudio Creativo Luna</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-tertiary)] m-0">Hace 2h</p>
            </div>
          </div>

          {/* Activity Item 3 */}
          <div className="flex items-center justify-between p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-container-high)] flex items-center justify-center text-[var(--danger)]">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <p className="text-sm font-semibold m-0 text-[var(--text-primary)]">Factura Vencida #F-2026-072</p>
                <p className="text-xs text-[var(--text-secondary)] m-0">Tecnologías del Sur</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold font-mono m-0 text-[var(--danger)]">$850.20</p>
              <span className="badge badge-error">Vencido</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
