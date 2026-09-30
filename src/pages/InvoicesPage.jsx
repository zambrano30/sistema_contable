import { useEffect, useState } from 'react'
import { getAllInvoices, deleteInvoice } from '../services/invoicesService'
import { getAllClients } from '../services/clientsService'
import { generateInvoicePDF } from '../services/invoicePdfService'
import { getLocalDateKey } from '../lib/dateUtils'

export default function InvoicesPage() {
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
    const invoiceItems = invoice.invoice_items || []
    const items = invoiceItems.length > 0 ? invoiceItems.map((item) => ({
      product_id: item.product_id,
      description: item.description || item.products?.name || 'Producto',
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.unit_price || 0),
    })) : [{
      product_id: 1,
      description: 'Consumo general',
      quantity: 1,
      unit_price: invoice.total_amount || 0,
    }]

    try {
      generateInvoicePDF(invoice, items, client, {
        name: 'Pasteles Don Chris',
        ruc: '0940805997011',
        address: 'Quevedo, Los Ríos, Ecuador',
      })
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Error generando PDF')
    }
  }

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta factura? Esta acción no se puede deshacer.')) return

    const result = await deleteInvoice(invoiceId)
    if (result.ok) {
      await loadData()
    } else {
      setError(`Error al eliminar: ${result.error}`)
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
    for (const invoiceId of selectedInvoices) {
      await deleteInvoice(invoiceId)
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
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-2xl sm:text-3xl">receipt_long</span>
            <span>Facturas</span>
          </h1>

        </div>
        {selectedInvoices.size > 0 && (
          <button onClick={handleDeleteSelectedInvoices} className="btn-danger text-xs sm:text-sm font-bold">
            <span className="material-symbols-outlined text-sm">delete</span>
            <span className="hidden sm:inline">Eliminar ({selectedInvoices.size}) seleccionadas</span>
            <span className="sm:hidden">({selectedInvoices.size})</span>
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
          <div className="table-wrapper overflow-x-auto">
            <table className="custom-table w-full">
              <thead>
                <tr>
                  <th className="w-10 px-2">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.size === invoices.length && invoices.length > 0}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-2 text-xs sm:text-sm">Factura #</th>
                  <th className="text-left px-2 text-xs sm:text-sm">Cliente</th>
                  <th className="text-left px-2 text-xs sm:text-sm">Fecha</th>
                  <th className="text-right px-2 text-xs sm:text-sm">Monto Total</th>
                  <th className="text-center px-2 text-xs sm:text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.has(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                        className="w-5 h-5 cursor-pointer"
                      />
                    </td>
                    <td className="sku-cell px-2 py-3 text-xs sm:text-sm font-mono">#{invoice.invoice_number || invoice.id}</td>
                    <td className="font-bold text-white px-2 py-3 text-xs sm:text-sm truncate">
                      {invoice.client_id
                        ? capitalize(clients.find(client => client.id === invoice.client_id)?.name || `Cliente ${invoice.client_id}`)
                        : 'Consumidor Final'}
                    </td>
                    <td className="text-xs text-[var(--text-secondary)] px-2 py-3 whitespace-nowrap">
                      {new Date(`${getLocalDateKey(invoice.created_at || invoice.invoice_date)}T00:00:00`).toLocaleDateString()}
                    </td>
                    <td className="text-right font-mono font-bold text-[var(--accent-orange-light)] px-2 py-3 text-xs sm:text-sm whitespace-nowrap">
                      ${Number(invoice.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="text-center px-2 py-3">
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          title="Descargar PDF SRI"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold text-xs p-1.5 rounded hover:bg-blue-400/10 transition-all"
                        >
                          <span className="material-symbols-outlined text-base">download</span>
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          title="Eliminar registro"
                          className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs p-1.5 rounded hover:bg-red-400/10 transition-all"
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
