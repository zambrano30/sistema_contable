import { useEffect, useState } from 'react'
import { getAllInvoices, deleteInvoice } from '../services/invoicesService'
import { getAllClients } from '../services/clientsService'
import { generateInvoicePDF } from '../services/invoicePdfService'

export default function InvoicesPage() {
  const isDemo = !!localStorage.getItem('demo_user')
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedInvoices, setSelectedInvoices] = useState(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    if (isDemo) {
      setInvoices(JSON.parse(localStorage.getItem('demo_invoices') || '[]'))
      setClients(JSON.parse(localStorage.getItem('demo_clients') || '[]'))
    } else {
      const [invoicesResult, clientsResult] = await Promise.all([
        getAllInvoices(),
        getAllClients(),
      ])

      if (invoicesResult.ok) {
        setInvoices(invoicesResult.data)
      } else {
        setError(invoicesResult.error)
      }
      if (clientsResult.ok) setClients(clientsResult.data)
    }

    setLoading(false)
  }

  const capitalize = (value) => {
    if (!value) return ''
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  }

  const handleDownloadPDF = (invoice) => {
    const client = clients.find(clientItem => clientItem.id === invoice.client_id) || {
      name: 'Consumidor Final',
    }
    const mockItems = [{
      product_id: 1,
      description: `Factura #${invoice.invoice_number}`,
      quantity: 1,
      unit_price: invoice.total_amount || 0,
    }]

    try {
      generateInvoicePDF(invoice, mockItems, client, {
        name: 'FacturaPro S.A.',
        ruc: '1792000000001',
      })
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Error generando PDF')
    }
  }

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta factura? Esta acción no se puede deshacer.')) return

    if (isDemo) {
      const filteredInvoices = invoices.filter(invoice => invoice.id !== invoiceId)
      localStorage.setItem('demo_invoices', JSON.stringify(filteredInvoices))
      setInvoices(filteredInvoices)
    } else {
      const result = await deleteInvoice(invoiceId)
      if (result.ok) {
        await loadData()
      } else {
        setError(`Error al eliminar: ${result.error}`)
      }
    }
  }

  const toggleInvoiceSelection = (invoiceId) => {
    const nextSelected = new Set(selectedInvoices)
    if (nextSelected.has(invoiceId)) {
      nextSelected.delete(invoiceId)
    } else {
      nextSelected.add(invoiceId)
    }
    setSelectedInvoices(nextSelected)
  }

  const toggleSelectAll = () => {
    if (selectedInvoices.size === invoices.length) {
      setSelectedInvoices(new Set())
    } else {
      setSelectedInvoices(new Set(invoices.map(invoice => invoice.id)))
    }
  }

  const handleDeleteSelectedInvoices = async () => {
    if (selectedInvoices.size === 0) {
      setError('Selecciona al menos una factura para eliminar')
      return
    }
    if (!window.confirm(`¿Seguro que deseas eliminar ${selectedInvoices.size} factura(s)?`)) return

    setLoading(true)
    if (isDemo) {
      const filteredInvoices = invoices.filter(invoice => !selectedInvoices.has(invoice.id))
      localStorage.setItem('demo_invoices', JSON.stringify(filteredInvoices))
    } else {
      for (const invoiceId of selectedInvoices) {
        await deleteInvoice(invoiceId)
      }
    }

    setSelectedInvoices(new Set())
    await loadData()
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center py-20">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-[var(--accent-orange)] animate-spin">sync</span>
          <p className="mt-2 text-[var(--text-secondary)] font-medium">Cargando facturas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">receipt_long</span>
            <span>Facturas</span>
          </h1>
          <p className="page-subtitle">Consulta y administra todas las facturas registradas</p>
        </div>
        {selectedInvoices.size > 0 && (
          <button onClick={handleDeleteSelectedInvoices} className="btn-danger text-xs font-bold">
            <span className="material-symbols-outlined text-sm">delete</span>
            <span>Eliminar ({selectedInvoices.size}) seleccionadas</span>
          </button>
        )}
      </header>

      {error && (
        <div className="error-message flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span>
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        {invoices.length === 0 ? (
          <p className="text-center text-[var(--text-tertiary)] py-8">No se registraron facturas todavía</p>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.size === invoices.length && invoices.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th>Factura #</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th className="text-right">Monto Total</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedInvoices.has(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="sku-cell">#{invoice.invoice_number || invoice.id}</td>
                    <td className="font-bold text-white">
                      {invoice.client_id
                        ? capitalize(clients.find(client => client.id === invoice.client_id)?.name || `Cliente ${invoice.client_id}`)
                        : 'Consumidor Final'}
                    </td>
                    <td className="text-xs text-[var(--text-secondary)]">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </td>
                    <td className="text-right font-mono font-bold text-[var(--accent-orange-light)]">
                      ${Number(invoice.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          title="Descargar PDF SRI"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold text-xs"
                        >
                          <span className="material-symbols-outlined text-base">download</span>
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          title="Eliminar registro"
                          className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
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
