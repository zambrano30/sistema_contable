import React, { useState } from 'react'
import { SkillBadge } from './SkillBadge'

export function SystemSkillsCard() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedSkill, setSelectedSkill] = useState(null)

  const skillsData = [
    {
      id: 'sri-invoicing',
      title: 'Facturación SRI & Firma Digital',
      category: 'fiscal',
      level: 100,
      status: 'Operativo',
      variant: 'sri',
      icon: 'verified_user',
      description: 'Emisión automática de comprobantes electrónicos autorizados por el SRI con firma digital PKCS#12.',
      features: ['Clave de acceso de 49 dígitos', 'Generación de XML & PDF RIDEE', 'Envío por Email al Cliente', 'Validación Offline / Online'],
    },
    {
      id: 'pos-terminal',
      title: 'Punto de Venta POS Ultra-Rápido',
      category: 'pos',
      level: 98,
      status: 'Alta Velocidad',
      variant: 'pro',
      icon: 'point_of_sale',
      description: 'Interfaz de cobro optimizada para ventas de mostrador con teclas de acceso rápido y pantalla táctil.',
      features: ['Búsqueda instantánea de productos', 'Múltiples formas de pago', 'Calculadora de cambio', 'Ticket térmico instantáneo'],
    },
    {
      id: 'barcode-scanner',
      title: 'Lector de Código de Barras',
      category: 'pos',
      level: 100,
      status: 'Plug & Play',
      variant: 'sync',
      icon: 'qr_code_scanner',
      description: 'Integración en tiempo real con escáneres USB y de cámara móvil para agregar ítems al carrito.',
      features: ['EAN-13, CODE-128 & QR', 'Modo escaneo continuo', 'Detección automática de SKU', 'Soporte cámara web/móvil'],
    },
    {
      id: 'inventory-control',
      title: 'Inventario Inteligente & Kardex',
      category: 'inventario',
      level: 95,
      status: 'Sincronizado',
      variant: 'info',
      icon: 'inventory_2',
      description: 'Control de stock en tiempo real con alertas automáticas de bajo inventario y trazabilidad de entradas/salidas.',
      features: ['Movimientos de Kardex', 'Alertas de Stock Mínimo', 'Categorización jerárquica', 'Ajustes masivos'],
    },
    {
      id: 'kitchen-kds',
      title: 'Sistema de Cocina KDS',
      category: 'pos',
      level: 96,
      status: 'Tiempo Real',
      variant: 'ai',
      icon: 'restaurant_menu',
      description: 'Pantalla interactiva para comandas de cocina con actualización automática de pedidos sin recargar.',
      features: ['Estados: En espera, Preparando, Listo', 'Filtro por áreas de cocina', 'Notificación sonora de comanda', 'Cronómetro de preparación'],
    },
    {
      id: 'cash-register',
      title: 'Cierre de Caja & Arqueo Contable',
      category: 'finanzas',
      level: 100,
      status: 'Automático',
      variant: 'pro',
      icon: 'account_balance_wallet',
      description: 'Balance diario de efectivo, tarjetas y transferencias con cálculo automático de descuadres.',
      features: ['Resumen de ventas del turno', 'Desglose por método de pago', 'Firma de cierre', 'Exportación de reporte'],
    },
    {
      id: 'coin-counter',
      title: 'Calculadora & Conteo de Monedas',
      category: 'finanzas',
      level: 90,
      status: 'Precisión',
      variant: 'info',
      icon: 'toll',
      description: 'Herramienta de arqueo rápido por denominación de billetes y monedas con totales instantáneos.',
      features: ['Monedas $0.01 a $1.00', 'Billetes $1 a $100', 'Suma total automatizada', 'Copia rápida al cierre'],
    },
    {
      id: 'security-rls',
      title: 'Seguridad Supabase & RLS',
      category: 'seguridad',
      level: 100,
      status: 'Encriptado',
      variant: 'sri',
      icon: 'lock',
      description: 'Control de acceso estricto a nivel de fila (Row Level Security) y aislamiento de datos de usuario.',
      features: ['Roles: Admin, Vendedor, Cocinero', 'JWT Token Encrypted', 'Políticas RLS en DB', 'Auditoría de acciones'],
    },
  ]

  const categories = [
    { id: 'all', label: 'Todas las Skills' },
    { id: 'fiscal', label: 'SRI & Fiscal' },
    { id: 'pos', label: 'POS & Ventas' },
    { id: 'inventario', label: 'Inventario' },
    { id: 'finanzas', label: 'Caja & Monedas' },
    { id: 'seguridad', label: 'Seguridad' },
  ]

  const filteredSkills = activeCategory === 'all' 
    ? skillsData 
    : skillsData.filter(s => s.category === activeCategory)

  return (
    <div className="card glass-panel-elevated p-6 relative overflow-hidden mb-6">
      {/* Decorative ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-[var(--accent-orange)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-[var(--secondary)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-2xl animate-pulse">auto_awesome</span>
            <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] m-0 font-heading">
              Capabilities & System Skills
            </h2>
            <SkillBadge label="System v2.5" variant="pro" size="sm" pulse={true} />
          </div>
          <p className="text-xs text-[var(--text-secondary)] m-0">
            Habilidades técnicas, capacidades integradas y estado operativo de la plataforma FacturaPro
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 bg-[var(--bg-tertiary)] p-1.5 rounded-xl border border-[var(--border-color)]">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[var(--accent-orange)] text-[var(--on-accent-orange)] shadow-md shadow-[var(--accent-orange)]/25'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Skill Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {filteredSkills.map((skill) => (
          <div
            key={skill.id}
            onClick={() => setSelectedSkill(skill)}
            className="group relative bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] hover:border-[var(--accent-orange)]/40 p-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-container-high)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-orange)] group-hover:scale-110 transition-transform shadow-md">
                  <span className="material-symbols-outlined">{skill.icon}</span>
                </div>
                <SkillBadge label={skill.status} variant={skill.variant} size="sm" pulse={skill.level === 100} />
              </div>

              <h3 className="text-sm font-bold text-[var(--text-primary)] m-0 mb-1 font-heading group-hover:text-[var(--accent-orange)] transition-colors">
                {skill.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2 m-0 mb-3">
                {skill.description}
              </p>
            </div>

            <div>
              {/* Skill Level Progress Bar */}
              <div className="mt-2">
                <div className="flex justify-between items-center text-[10px] font-semibold text-[var(--text-tertiary)] mb-1">
                  <span>Nivel de Integración</span>
                  <span className="text-[var(--accent-orange)] font-bold">{skill.level}%</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--bg-container-high)] rounded-full overflow-hidden p-0.5 border border-[var(--border-color)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent-orange)] via-amber-400 to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(255,159,10,0.5)]"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors">
                <span>Ver detalles</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Details View */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-[var(--text-primary)]">
            <button
              onClick={() => setSelectedSkill(null)}
              className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-orange)] to-[#ff7b00] flex items-center justify-center text-white text-2xl shadow-lg shadow-[var(--accent-orange)]/30">
                <span className="material-symbols-outlined">{selectedSkill.icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] m-0 font-heading">{selectedSkill.title}</h3>
                <SkillBadge label={selectedSkill.status} variant={selectedSkill.variant} size="sm" pulse={true} />
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">{selectedSkill.description}</p>

            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-orange)] mb-2 font-heading">Características Clave</h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-primary)]">
                {selectedSkill.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setSelectedSkill(null)}
              className="w-full btn-primary py-2 text-xs justify-center font-bold"
            >
              Cerrar Detalles
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
