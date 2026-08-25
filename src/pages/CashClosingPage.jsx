import { useEffect, useMemo, useState } from 'react'
import { getAllInvoices } from '../services/invoicesService'
import { getLocalDateKey } from '../lib/dateUtils'

const denominations = [
  { value: 100, label: '$100.00', type: 'Billetes' },
  { value: 50, label: '$50.00', type: 'Billetes' },
  { value: 20, label: '$20.00', type: 'Billetes' },
  { value: 10, label: '$10.00', type: 'Billetes' },
  { value: 5, label: '$5.00', type: 'Billetes' },
  { value: 1, label: '$1.00', type: 'Billetes' },
  { value: 0.5, label: '$0.50', type: 'Monedas' },
  { value: 0.25, label: '$0.25', type: 'Monedas' },
  { value: 0.1, label: '$0.10', type: 'Monedas' },
  { value: 0.05, label: '$0.05', type: 'Monedas' },
  { value: 0.01, label: '$0.01', type: 'Monedas' },
]

const getToday = () => {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(value)

export default function CashClosingPage() {
  const [selectedDate, setSelectedDate] = useState(getToday)
  const [invoices, setInvoices] = useState([])
  const [counts, setCounts] = useState(() => Object.fromEntries(denominations.map(({ value }) => [value, ''])))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    setLoading(true)
    setError('')

    const result = await getAllInvoices()
    if (result.ok) setInvoices(result.data)
    else setError(result.error)

    setLoading(false)
  }

  const dailyInvoices = useMemo(() => invoices.filter((invoice) => (
    getLocalDateKey(invoice.created_at || invoice.invoice_date) === selectedDate && invoice.status !== 'cancelled'
  )), [invoices, selectedDate])

  const systemTotal = useMemo(() => dailyInvoices.reduce(
    (total, invoice) => total + Number(invoice.total_amount || 0), 0
  ), [dailyInvoices])

  const countedTotal = useMemo(() => denominations.reduce((total, { value }) => (
    total + value * (Number(counts[value]) || 0)
  ), 0), [counts])

  const difference = countedTotal - systemTotal
  const isBalanced = Math.abs(difference) < 0.005

  const handleCountChange = (value, count) => {
    setSaved(false)
    setCounts((current) => ({ ...current, [value]: count.replace(/[^0-9]/g, '') }))
  }

  const saveClosing = () => {
    const closings = JSON.parse(localStorage.getItem('cash_closings') || '[]')
    const closing = {
      id: Date.now(),
      date: selectedDate,
      systemTotal: Number(systemTotal.toFixed(2)),
      countedTotal: Number(countedTotal.toFixed(2)),
      difference: Number(difference.toFixed(2)),
      counts,
      createdAt: new Date().toISOString(),
    }
    const withoutSameDate = closings.filter((item) => item.date !== selectedDate)
    localStorage.setItem('cash_closings', JSON.stringify([...withoutSameDate, closing]))
    setSaved(true)
  }

  const clearCounts = () => {
    setCounts(Object.fromEntries(denominations.map(({ value }) => [value, ''])))
    setSaved(false)
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">point_of_sale</span>
            <span>Cierre de caja</span>
          </h1>
          <p className="page-subtitle">Comprueba las ventas del día y cuadra el efectivo contado</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          Fecha
          <input className="input-field" type="date" value={selectedDate} onChange={(event) => {
            setSelectedDate(event.target.value)
            setSaved(false)
          }} />
        </label>
      </header>

      {error && <div className="error-message flex items-center gap-2"><span className="material-symbols-outlined">warning</span>{error}</div>}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bento-card border border-blue-500/30 bg-blue-500/5">
          <span className="card-label">Valor del sistema</span>
          <strong className="card-value text-blue-300">{loading ? '---' : formatCurrency(systemTotal)}</strong>
          <span className="text-xs text-[var(--text-secondary)]">{dailyInvoices.length} venta{dailyInvoices.length === 1 ? '' : 's'} no anulada{dailyInvoices.length === 1 ? '' : 's'}</span>
        </div>
        <div className="bento-card border border-[var(--accent-orange)]/30 bg-[var(--accent-orange)]/5">
          <span className="card-label">Efectivo contado</span>
          <strong className="card-value text-[var(--accent-orange-light)]">{formatCurrency(countedTotal)}</strong>
          <span className="text-xs text-[var(--text-secondary)]">Según billetes y monedas ingresados</span>
        </div>
        <div className={`bento-card border ${isBalanced ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
          <span className="card-label">Diferencia</span>
          <strong className={`card-value ${isBalanced ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(difference)}</strong>
          <span className={`text-xs font-bold ${isBalanced ? 'text-emerald-300' : 'text-red-300'}`}>
            {isBalanced ? 'Caja cuadrada' : difference > 0 ? 'Sobrante' : 'Faltante'}
          </span>
        </div>
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--border-color)]">
          <div>
            <h2 className="text-lg font-extrabold m-0">Conteo de efectivo</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Indica cuántas unidades tienes de cada denominación</p>
          </div>
          <button type="button" className="btn-secondary text-sm" onClick={clearCounts}>
            <span className="material-symbols-outlined text-base">restart_alt</span>
            <span>Limpiar conteo</span>
          </button>
        </div>

        {['Billetes', 'Monedas'].map((type) => (
          <div key={type} className="mb-6 last:mb-0">
            <h3 className="text-sm uppercase tracking-wider text-[var(--accent-orange-light)] mb-3">{type}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {denominations.filter((denomination) => denomination.type === type).map(({ value, label }) => {
                const quantity = Number(counts[value]) || 0
                return (
                  <label key={value} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-3">
                    <span className="block font-bold text-white">{label}</span>
                    <span className="block text-xs text-[var(--text-tertiary)] mt-1">Cantidad</span>
                    <input
                      className="input-field mt-2 w-full text-center font-mono"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={counts[value]}
                      onChange={(event) => handleCountChange(value, event.target.value)}
                      aria-label={`Cantidad de ${label}`}
                    />
                    <span className="block text-right text-xs text-[var(--accent-orange-light)] mt-2 font-mono">{formatCurrency(value * quantity)}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap justify-end items-center gap-4 mt-6 pt-5 border-t border-[var(--border-color)]">
          {saved && <span className="text-sm text-emerald-300 flex items-center gap-1"><span className="material-symbols-outlined text-base">check_circle</span>Cierre guardado</span>}
          <button type="button" className="btn-primary" onClick={saveClosing}>
            <span className="material-symbols-outlined">lock</span>
            <span>Guardar cierre</span>
          </button>
        </div>
      </section>
    </div>
  )
}