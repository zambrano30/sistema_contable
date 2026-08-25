import { useEffect, useMemo, useState } from 'react'
import { getAllInvoices } from '../services/invoicesService'
import { getAllExpenses } from '../services/expensesService'
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
  const [expenses, setExpenses] = useState([])
  const [counts, setCounts] = useState(() => Object.fromEntries(denominations.map(({ value }) => [value, ''])))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [lastReport, setLastReport] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    const [invoiceResult, expenseResult] = await Promise.all([
      getAllInvoices(),
      getAllExpenses(),
    ])
    if (invoiceResult.ok) setInvoices(invoiceResult.data)
    else setError(invoiceResult.error)
    if (expenseResult.ok) setExpenses(expenseResult.data)
    else setError(expenseResult.error)

    setLoading(false)
  }

  const dailyInvoices = useMemo(() => invoices.filter((invoice) => (
    getLocalDateKey(invoice.created_at || invoice.invoice_date) === selectedDate && invoice.status !== 'cancelled'
  )), [invoices, selectedDate])

  const systemTotal = useMemo(() => dailyInvoices.reduce(
    (total, invoice) => total + Number(invoice.total_amount || 0), 0
  ), [dailyInvoices])

  const dailyExpenses = useMemo(() => expenses.filter((expense) => (
    expense.expense_date === selectedDate
  )), [expenses, selectedDate])

  const expenseTotal = useMemo(() => dailyExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0), 0
  ), [dailyExpenses])

  const cashIncome = useMemo(() => dailyInvoices
    .filter((invoice) => (invoice.payment_method || 'cash') === 'cash')
    .reduce((total, invoice) => total + Number(invoice.total_amount || 0), 0), [dailyInvoices])

  const transferIncome = systemTotal - cashIncome
  const expectedCash = cashIncome - expenseTotal
  const expectedTotalAfterExpenses = systemTotal - expenseTotal

  const countedTotal = useMemo(() => denominations.reduce((total, { value }) => (
    total + value * (Number(counts[value]) || 0)
  ), 0), [counts])

  const verifiedTotal = countedTotal + transferIncome
  const difference = verifiedTotal - expectedTotalAfterExpenses
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
      cashIncome: Number(cashIncome.toFixed(2)),
      transferIncome: Number(transferIncome.toFixed(2)),
      expenseTotal: Number(expenseTotal.toFixed(2)),
      expectedCash: Number(expectedCash.toFixed(2)),
      countedTotal: Number(countedTotal.toFixed(2)),
      verifiedTotal: Number(verifiedTotal.toFixed(2)),
      difference: Number(difference.toFixed(2)),
      counts,
      createdAt: new Date().toISOString(),
    }
    const withoutSameDate = closings.filter((item) => item.date !== selectedDate)
    localStorage.setItem('cash_closings', JSON.stringify([...withoutSameDate, closing]))
    const report = {
      date: selectedDate,
      invoices: dailyInvoices,
      expenses: dailyExpenses,
      systemTotal,
      cashIncome,
      transferIncome,
      expenseTotal,
      expectedCash,
      countedTotal,
      verifiedTotal,
      expectedTotalAfterExpenses,
      difference,
      counts,
    }
    setSaved(true)
    setLastReport(report)
    printClosing(report)
  }

  const printClosing = (report) => {
    const missingAmount = Math.max(0, -report.difference)
    const surplusAmount = Math.max(0, report.difference)
    const reconciliation = report.difference < -0.005
      ? `Faltante: ${formatCurrency(missingAmount)}`
      : report.difference > 0.005
        ? `Sobrante: ${formatCurrency(surplusAmount)}`
        : 'Caja cuadrada'
    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (!printWindow) {
      setError('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio y usa "Imprimir cierre".')
      return
    }
    printWindow.document.write(`<!doctype html><html><head><title>Cierre de caja ${report.date}</title><style>body{font-family:Arial,sans-serif;color:#111;padding:24px;max-width:520px;margin:auto}h1{text-align:center;margin-bottom:4px}h2{border-bottom:1px solid #bbb;padding-bottom:5px;margin-top:24px}.summary p{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:8px 0;margin:0}.total{font-weight:bold;font-size:1.1em;text-align:center;margin-top:24px}</style></head><body><h1>Cierre de caja</h1><p>Fecha: ${report.date}</p><h2>Totales</h2><div class="summary"><p><span>Ingresos totales</span><b>${formatCurrency(report.systemTotal)}</b></p><p><span>Ingresos en efectivo</span><b>${formatCurrency(report.cashIncome)}</b></p><p><span>Transferencias</span><b>${formatCurrency(report.transferIncome)}</b></p><p><span>Gastos del día</span><b>${formatCurrency(report.expenseTotal)}</b></p><p><span>Total esperado después de gastos</span><b>${formatCurrency(report.expectedTotalAfterExpenses)}</b></p><p><span>Efectivo contado</span><b>${formatCurrency(report.countedTotal)}</b></p><p><span>Total verificado</span><b>${formatCurrency(report.verifiedTotal)}</b></p></div><p class="total">${reconciliation}<br>Diferencia: ${formatCurrency(report.difference)}</p></body></html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.onafterprint = () => printWindow.close()
    setTimeout(() => printWindow.print(), 250)
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
          <span className="text-xs text-[var(--text-secondary)]">Esperado: {formatCurrency(expectedCash)}</span>
        </div>
        <div className={`bento-card border ${isBalanced ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
          <span className="card-label">Diferencia</span>
          <strong className={`card-value ${isBalanced ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(difference)}</strong>
          <span className={`text-xs font-bold ${isBalanced ? 'text-emerald-300' : 'text-red-300'}`}>
            {isBalanced ? 'Caja cuadrada' : difference > 0 ? 'Sobrante' : 'Faltante'}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card"><span className="card-label">Ingresos en efectivo</span><strong className="card-value text-emerald-400">{formatCurrency(cashIncome)}</strong></div>
        <div className="card"><span className="card-label">Transferencias</span><strong className="card-value text-blue-300">{formatCurrency(transferIncome)}</strong></div>
        <div className="card"><span className="card-label">Gastos del día</span><strong className="card-value text-red-400">{formatCurrency(expenseTotal)}</strong><span className="text-xs text-[var(--text-secondary)]">{dailyExpenses.length} registro{dailyExpenses.length === 1 ? '' : 's'}</span></div>
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
          {lastReport && <button type="button" className="btn-secondary" onClick={() => printClosing(lastReport)}>
            <span className="material-symbols-outlined">print</span>
            <span>Imprimir cierre</span>
          </button>}
          <button type="button" className="btn-primary" onClick={saveClosing}>
            <span className="material-symbols-outlined">lock</span>
            <span>Guardar cierre</span>
          </button>
        </div>
      </section>
    </div>
  )
}