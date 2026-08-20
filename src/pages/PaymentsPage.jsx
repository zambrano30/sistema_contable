import { useEffect, useState } from 'react'
import { getAllPayments, createPayment, deletePayment, getPaymentStats, getPendingPayments } from '../services/paymentsService'
import { getAllInvoices, updateInvoiceStatus } from '../services/invoicesService'
import { getAllClients } from '../services/clientsService'

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [pendingInvoices, setPendingInvoices] = useState([])
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [stats, setStats] = useState({ totalCollected: 0, paymentCount: 0, averagePayment: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [selectedInvoice, setSelectedInvoice] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [paymentsRes, pendingRes, invoicesRes, clientsRes, statsRes] = await Promise.all([
      getAllPayments(),
      getPendingPayments(),
      getAllInvoices(),
      getAllClients(),
      getPaymentStats(),
    ])

    if (paymentsRes.ok) setPayments(paymentsRes.data)
    if (pendingRes.ok) setPendingInvoices(pendingRes.data)
    if (invoicesRes.ok) setInvoices(invoicesRes.data)
    if (clientsRes.ok) setClients(clientsRes.data)
    if (statsRes.ok) setStats(statsRes.data)

    setLoading(false)
  }

  const getInvoiceInfo = (invoiceId) => {
    const inv = invoices.find(i => i.id === invoiceId)
    return inv
      ? {
          amount: inv.total_amount || 0,
          client: clients.find(c => c.id === inv.client_id)?.name || 'Unknown',
          status: inv.status,
        }
      : null
  }

  const handleCreatePayment = async (e) => {
    e.preventDefault()

    if (!selectedInvoice || !amount) {
      setError('Selecciona factura y monto')
      return
    }

    const invoiceInfo = getInvoiceInfo(parseInt(selectedInvoice))
    if (!invoiceInfo) {
      setError('Factura no encontrada')
      return
    }

    if (parseFloat(amount) <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    const paymentData = {
      invoice_id: parseInt(selectedInvoice),
      payment_date: new Date().toISOString(),
      payment_method: method,
      amount: parseFloat(amount),
      reference_number: reference,
      notes,
    }

    const result = await createPayment(paymentData)

    if (result.ok) {
      // Check if invoice is fully paid
      if (parseFloat(amount) >= invoiceInfo.amount) {
        await updateInvoiceStatus(parseInt(selectedInvoice), 'paid')
      } else {
        // Mark as partially paid if not already sent
        if (invoiceInfo.status === 'draft') {
          await updateInvoiceStatus(parseInt(selectedInvoice), 'sent')
        }
      }

      await loadData()
      resetForm()
      setError('')
    } else {
      setError(result.error)
    }
  }

  const handleDeletePayment = async (id) => {
    if (!window.confirm('¿Confirmar eliminación del pago?')) return

    const result = await deletePayment(id)
    if (result.ok) {
      await loadData()
    } else {
      setError(result.error)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setSelectedInvoice('')
    setAmount('')
    setMethod('cash')
    setReference('')
    setNotes('')
  }

  if (loading) return <div className="page-container"><p>Cargando...</p></div>

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div>
          <span className="text-[0.75rem] font-bold text-[var(--accent-orange-light)] uppercase tracking-wider">
            Lumina Ledger • Pagos
          </span>
          <h1 className="mt-1">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">payments</span>
            <span>Gestión de Pagos</span>
          </h1>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          <span className="material-symbols-outlined">add</span>
          <span>Registrar Pago</span>
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6">
          <p className="text-[var(--text-secondary)] text-sm mb-2">Total Cobrado</p>
          <h3 className="text-2xl font-bold text-[var(--accent-orange)]">
            ${stats.totalCollected?.toFixed(2) || '0.00'}
          </h3>
        </div>
        <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6">
          <p className="text-[var(--text-secondary)] text-sm mb-2">Pagos Registrados</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">{stats.paymentCount || 0}</h3>
        </div>
        <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6">
          <p className="text-[var(--text-secondary)] text-sm mb-2">Pago Promedio</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">
            ${stats.averagePayment?.toFixed(2) || '0.00'}
          </h3>
        </div>
      </section>

      {/* Payment Form */}
      {showForm && (
        <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 mb-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-orange)]">receipt</span>
            Registrar Nuevo Pago
          </h3>

          <form onSubmit={handleCreatePayment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Invoice Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Factura Pendiente
                </label>
                <select
                  value={selectedInvoice}
                  onChange={(e) => {
                    setSelectedInvoice(e.target.value)
                    const inv = invoices.find(i => i.id === parseInt(e.target.value))
                    if (inv) setAmount(inv.total_amount?.toString() || '')
                  }}
                  className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                >
                  <option value="">-- Selecciona --</option>
                  {pendingInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      Factura #{inv.id} - ${inv.total_amount?.toFixed(2) || '0.00'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Monto ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                />
              </div>

              {/* Method */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Método de Pago
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                >
                  <option value="cash">Efectivo</option>
                  <option value="check">Cheque</option>
                  <option value="transfer">Transferencia</option>
                  <option value="credit_card">Tarjeta Crédito</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Referencia (Cheque/Transfer)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej: 123456789"
                  className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Registrar Pago
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payments List */}
      <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)]">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 p-6 pb-0">
          <span className="material-symbols-outlined text-[var(--accent-orange)]">history</span>
          Historial de Pagos
        </h3>

        {payments.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] py-8">Sin pagos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-[var(--text-secondary)] uppercase">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                    Referencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                    <td className="px-6 py-4 text-[var(--text-primary)] font-medium">#{payment.invoice_id}</td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-[var(--text-primary)] font-medium">
                      ${payment.amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)] capitalize">
                      {payment.payment_method || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">{payment.reference_number || '-'}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
