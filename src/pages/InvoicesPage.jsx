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
  const [expandedInvoice, setExpandedInvoice] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  const getFilteredInvoices = () => {
    if (!searchQuery.trim()) {
      return invoices
    }

    const query = searchQuery.toLowerCase()
    return invoices.filter((invoice) => {
      const client = clients.find(c => c.id === invoice.client_id)
      const clientCedula = client?.tax_id || ''
      const clientNombre = client?.name || ''
      
      return clientCedula.toLowerCase().includes(query) || clientNombre.toLowerCase().includes(query)
    })
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
      <header className="page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 m-0">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-xl sm:text-3xl">receipt_long</span>
            <span>Facturas</span>
          </h1>
        </div>
        {selectedInvoices.size > 0 && (
          <button onClick={handleDeleteSelectedInvoices} className="btn-danger text-xs sm:text-sm font-bold w-full sm:w-auto">
            <span className="material-symbols-outlined text-sm">delete</span>
            <span className="hidden sm:inline">Eliminar ({selectedInvoices.size}) seleccionadas</span>
            <span className="sm:hidden">Eliminar ({selectedInvoices.size})</span>
          </button>
        )}
      </header>

      {error && (
        <div className="error-message flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* Buscador */}
      <div className="card space-y-3 mb-4">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <span className="material-symbols-outlined text-[var(--accent-orange)]">search</span>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">Buscar Facturas</h3>
        </div>
        <div className="form-group">
          <label htmlFor="search-query" className="text-xs font-semibold text-[var(--text-secondary)]">Cédula, RUC o Nombre del Cliente</label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm">search</span>
            <input
              id="search-query"
              type="text"
              placeholder="Busca por cédula, RUC o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        {searchQuery && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>{getFilteredInvoices().length} factura(s) encontrada(s)</span>
          </div>
        )}
      </div>

      <div className="card p-3 sm:p-4">
        {invoices.length === 0 ? (
          <p className="text-center text-[var(--text-tertiary)] py-8 text-sm">No se registraron facturas todavía</p>
        ) : getFilteredInvoices().length === 0 ? (
          <p className="text-center text-[var(--text-tertiary)] py-8 text-sm">No se encontraron facturas con los filtros aplicados</p>
        ) : (
          <>
            {/* Vista Tabla - Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="custom-table w-full">
                <thead>
                  <tr>
                    <th className="w-8 sm:w-10 px-2 sm:px-3">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.size === getFilteredInvoices().length && getFilteredInvoices().length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
                      />
                    </th>
                    <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap">Factura #</th>
                    <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap">Cliente</th>
                    <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap">Fecha Emisión</th>
                    <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap">Vencimiento</th>
                    <th className="text-right px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap">Subtotal</th>
                    <th className="text-right px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap">Descuento</th>
                    <th className="text-right px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap">Impuesto</th>
                    <th className="text-right px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap">Total</th>
                    <th className="text-left px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap">Pago</th>
                    <th className="text-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredInvoices().map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0">
                      <td className="px-2 sm:px-3 py-2 sm:py-3">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.has(invoice.id)}
                          onChange={() => toggleInvoiceSelection(invoice.id)}
                          className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
                        />
                      </td>
                      <td className="sku-cell px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-mono font-semibold">#{invoice.invoice_number || invoice.id}</td>
                      <td className="font-semibold text-white px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm truncate max-w-xs" title={invoice.client_id ? capitalize(clients.find(client => client.id === invoice.client_id)?.name || `Cliente ${invoice.client_id}`) : 'Consumidor Final'}>
                        {invoice.client_id
                          ? capitalize(clients.find(client => client.id === invoice.client_id)?.name || `Cliente ${invoice.client_id}`)
                          : 'Consumidor Final'}
                      </td>
                      <td className="text-xs sm:text-sm text-[var(--text-secondary)] px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap">
                        {new Date(`${getLocalDateKey(invoice.created_at || invoice.invoice_date)}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>
                      <td className="text-xs sm:text-sm text-[var(--text-secondary)] px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap">
                        {invoice.due_date ? new Date(`${invoice.due_date}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                      </td>
                      <td className="text-right font-mono text-[var(--text-secondary)] px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                        ${Number(invoice.subtotal || 0).toFixed(2)}
                      </td>
                      <td className="text-right font-mono text-red-400 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                        ${Number(invoice.discount_amount || 0).toFixed(2)}
                      </td>
                      <td className="text-right font-mono text-yellow-400 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                        ${Number(invoice.tax_amount || 0).toFixed(2)}
                      </td>
                      <td className="text-right font-mono font-bold text-[var(--accent-orange-light)] px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                        ${Number(invoice.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm capitalize">
                        <span className="inline-block px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 whitespace-nowrap">
                          {invoice.payment_method === 'cash' ? 'Efectivo' : invoice.payment_method === 'card' ? 'Tarjeta' : invoice.payment_method === 'transfer' ? 'Transferencia' : invoice.payment_method || 'No especificado'}
                        </span>
                      </td>
                      <td className="text-center px-2 sm:px-3 py-2 sm:py-3">
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                          <button
                            onClick={() => handleDownloadPDF(invoice)}
                            title="Descargar PDF SRI"
                            className="text-blue-400 hover:text-blue-300 p-1.5 sm:p-2 rounded hover:bg-blue-400/10 transition-all"
                          >
                            <span className="material-symbols-outlined text-base">download</span>
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            title="Eliminar registro"
                            className="text-red-400 hover:text-red-300 p-1.5 sm:p-2 rounded hover:bg-red-400/10 transition-all"
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

            {/* Vista Cards - Mobile */}
            <div className="sm:hidden space-y-3">
              {getFilteredInvoices().map((invoice) => {
                const isExpanded = expandedInvoice === invoice.id
                return (
                  <div key={invoice.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                    {/* Header - Siempre visible */}
                    <div 
                      onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                      className="p-4 cursor-pointer hover:bg-white/10 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.has(invoice.id)}
                          onChange={() => toggleInvoiceSelection(invoice.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 cursor-pointer flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono font-semibold text-[var(--accent-orange)] truncate">
                            #{invoice.invoice_number || invoice.id}
                          </p>
                          <p className="text-sm font-semibold text-white truncate mt-1">
                            {invoice.client_id
                              ? capitalize(clients.find(client => client.id === invoice.client_id)?.name || `Cliente ${invoice.client_id}`)
                              : 'Consumidor Final'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-[var(--text-secondary)]">Total</p>
                        <p className="text-lg font-bold text-[var(--accent-orange-light)] font-mono">
                          ${Number(invoice.total_amount || 0).toFixed(2)}
                        </p>
                      </div>
                      <span className={`material-symbols-outlined text-[var(--text-secondary)] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>

                    {/* Detalles - Ocultos inicialmente */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 bg-white/5 rounded p-3">
                          <div>
                            <p className="text-xs text-[var(--text-secondary)] mb-1">Emisión</p>
                            <p className="text-xs font-mono text-white">
                              {new Date(`${getLocalDateKey(invoice.created_at || invoice.invoice_date)}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[var(--text-secondary)] mb-1">Vencimiento</p>
                            <p className="text-xs font-mono text-white">
                              {invoice.due_date ? new Date(`${invoice.due_date}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/5 rounded p-2">
                            <p className="text-xs text-[var(--text-secondary)] mb-1">Subtotal</p>
                            <p className="text-sm font-mono text-white">${Number(invoice.subtotal || 0).toFixed(2)}</p>
                          </div>
                          <div className="bg-white/5 rounded p-2">
                            <p className="text-xs text-[var(--text-secondary)] mb-1">Descuento</p>
                            <p className="text-sm font-mono text-red-400">-${Number(invoice.discount_amount || 0).toFixed(2)}</p>
                          </div>
                          <div className="bg-white/5 rounded p-2">
                            <p className="text-xs text-[var(--text-secondary)] mb-1">Impuesto</p>
                            <p className="text-sm font-mono text-yellow-400">${Number(invoice.tax_amount || 0).toFixed(2)}</p>
                          </div>
                          <div className="bg-white/5 rounded p-2">
                            <p className="text-xs text-[var(--text-secondary)] mb-1">Pago</p>
                            <p className="text-xs font-semibold text-blue-300 capitalize">
                              {invoice.payment_method === 'cash' ? 'Efectivo' : invoice.payment_method === 'card' ? 'Tarjeta' : invoice.payment_method === 'transfer' ? 'Transferencia' : invoice.payment_method || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                          <button
                            onClick={() => handleDownloadPDF(invoice)}
                            title="Descargar PDF SRI"
                            className="flex items-center gap-2 px-3 py-2 text-xs text-blue-400 hover:text-blue-300 bg-blue-400/10 hover:bg-blue-400/20 rounded transition-all"
                          >
                            <span className="material-symbols-outlined text-base">download</span>
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            title="Eliminar registro"
                            className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 rounded transition-all"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
