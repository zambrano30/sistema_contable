import { useMemo, useState } from 'react'

const coinDenominations = [
  { value: 1, label: '$1.00' },
  { value: 0.5, label: '$0.50' },
  { value: 0.25, label: '$0.25' },
  { value: 0.1, label: '$0.10' },
  { value: 0.05, label: '$0.05' },
  { value: 0.01, label: '$0.01' },
]

const initialCounts = Object.fromEntries(coinDenominations.map(({ value }) => [value, '']))

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(value)

export default function CoinCounterPage() {
  const [counts, setCounts] = useState(initialCounts)

  const total = useMemo(() => coinDenominations.reduce(
    (sum, { value }) => sum + value * (Number(counts[value]) || 0), 0
  ), [counts])

  const handleCountChange = (value, count) => {
    setCounts((current) => ({
      ...current,
      [value]: count.replace(/[^0-9]/g, ''),
    }))
  }

  const clearCounts = () => setCounts(initialCounts)

  return (
    <div className="page-container coin-counter-page">
      <header className="page-header">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">toll</span>
            <span>Contador de monedas</span>
          </h1>
          <p className="page-subtitle">Ingresa la cantidad de cada moneda para conocer el valor total</p>
        </div>
        <div className="flex gap-3 print-hide">
          <button type="button" className="btn-secondary" onClick={clearCounts}>
            <span className="material-symbols-outlined">restart_alt</span>
            <span>Limpiar</span>
          </button>
          <button type="button" className="btn-primary" onClick={() => window.print()}>
            <span className="material-symbols-outlined">print</span>
            <span>Imprimir</span>
          </button>
        </div>
      </header>

      <section className="coin-total-card print-summary">
        <span className="card-label">Valor total contado</span>
        <strong>{formatCurrency(total)}</strong>
        <span>{coinDenominations.reduce((sum, { value }) => sum + (Number(counts[value]) || 0), 0)} monedas</span>
      </section>

      <section className="coin-counter-grid">
        {coinDenominations.map(({ value, label }) => {
          const quantity = Number(counts[value]) || 0
          return (
            <label key={value} className="coin-counter-card">
              <span className="coin-visual">$</span>
              <span className="coin-denomination">{label}</span>
              <span className="coin-label">Cantidad de monedas</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={counts[value]}
                onChange={(event) => handleCountChange(value, event.target.value)}
                placeholder="0"
                aria-label={`Cantidad de monedas de ${label}`}
              />
              <span className="coin-subtotal">Subtotal: {formatCurrency(value * quantity)}</span>
            </label>
          )
        })}
      </section>

      <section className="coin-print-table">
        <h2>Detalle del conteo</h2>
        <table>
          <thead>
            <tr><th>Denominación</th><th>Cantidad</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            {coinDenominations.map(({ value, label }) => (
              <tr key={value}>
                <td>{label}</td>
                <td>{Number(counts[value]) || 0}</td>
                <td>{formatCurrency(value * (Number(counts[value]) || 0))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><th colSpan="2">Total</th><th>{formatCurrency(total)}</th></tr></tfoot>
        </table>
      </section>
    </div>
  )
}
