import { useEffect, useState } from 'react'
import { getAllProducts } from '../services/productsService'
import { getAllClients } from '../services/clientsService'
import { createInvoice, getAllInvoices, updateInvoiceStatus } from '../services/invoicesService'
import { createCommand } from '../services/commandsService'
import { generateInvoicePDF } from '../services/invoicePdfService'
import { useAuth } from '../contexts/AuthContext'
import { playNotificationSound } from '../services/notificationService'

export default function SalesPage() {
  const { user } = useAuth()
  const isDemo = !!localStorage.getItem('demo_user')
  const [products, setProducts] = useState([])
  const [clients, setClients] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [selectedClient, setSelectedClient] = useState('')
  const [invoiceItems, setInvoiceItems] = useState([])
  const [discountAmount, setDiscountAmount] = useState(0)
  const [notes, setNotes] = useState('')

  // Consumer final and simple invoice options
  const [isConsumerFinal, setIsConsumerFinal] = useState(false)
  const [useSimpleInvoice, setUseSimpleInvoice] = useState(false)
  const [simpleSubtotal, setSimpleSubtotal] = useState(0)
  const [simpleDiscount, setSimpleDiscount] = useState(0)

  // Item form
  const [itemProduct, setItemProduct] = useState('')
  const [itemQuantity, setItemQuantity] = useState('')
  const [itemDiscount, setItemDiscount] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    if (isDemo) {
      const demoProducts = JSON.parse(localStorage.getItem('demo_products') || '[]')
      const demoClients = JSON.parse(localStorage.getItem('demo_clients') || '[]')
      const demoInvoices = JSON.parse(localStorage.getItem('demo_invoices') || '[]')
      
      setProducts(demoProducts)
      setClients(demoClients)
      setInvoices(demoInvoices)
    } else {
      const [productsRes, clientsRes, invoicesRes] = await Promise.all([
        getAllProducts(),
        getAllClients(),
        getAllInvoices(),
      ])

      if (productsRes.ok) setProducts(productsRes.data)
      if (clientsRes.ok) setClients(clientsRes.data)
      if (invoicesRes.ok) setInvoices(invoicesRes.data)
    }

    setLoading(false)
  }

  const addInvoiceItem = () => {
    if (!itemProduct || !itemQuantity) {
      setError('Selecciona producto y cantidad')
      return
    }

    const product = products.find(p => p.id === parseInt(itemProduct))
    if (!product) return

    const quantity = parseInt(itemQuantity)
    const unitPrice = product.price || 0
    const discountValue = (unitPrice * quantity * itemDiscount) / 100
    const subtotal = unitPrice * quantity - discountValue
    const taxAmount = (subtotal * 19) / 100
    const lineTotal = subtotal + taxAmount

    setInvoiceItems([
      ...invoiceItems,
      {
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: unitPrice,
        discount_percentage: itemDiscount,
        tax_percentage: 19,
        line_total: lineTotal,
      },
    ])

    setItemProduct('')
    setItemQuantity('')
    setItemDiscount(0)
  }

  const removeInvoiceItem = (index) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    if (useSimpleInvoice) {
      const subtotal = Math.max(0, parseFloat(simpleSubtotal) || 0) - Math.max(0, parseFloat(simpleDiscount) || 0)
      const total = subtotal
      return { subtotal, taxAmount: 0, total }
    }

    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) - discountAmount
    const total = subtotal

    return { subtotal, taxAmount: 0, total }
  }

  const handleCreateInvoice = async (e) => {
    e.preventDefault()
    setError('')

    // Validation for client (not required if consumer final)
    if (!isConsumerFinal && !selectedClient) {
      setError('Selecciona un cliente o marca como Consumidor Final')
      return
    }

    // Validation for products (not required if simple invoice)
    if (!useSimpleInvoice && invoiceItems.length === 0) {
      setError('Añade al menos un producto o usa Factura Simple')
      return
    }

    // Validation for simple invoice amounts
    if (useSimpleInvoice && (!simpleSubtotal || parseFloat(simpleSubtotal) <= 0)) {
      setError('Ingresa un monto para la factura simple')
      return
    }

    const { subtotal, taxAmount, total } = calculateTotals()

    const invoiceData = {
      client_id: isConsumerFinal ? null : parseInt(selectedClient),
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      subtotal,
      tax_amount: 0,
      discount_amount: useSimpleInvoice ? parseFloat(simpleDiscount) : parseFloat(discountAmount),
      total_amount: total,
      notes: notes || (isConsumerFinal ? 'Consumidor Final' : ''),
      items: useSimpleInvoice ? [] : invoiceItems,
    }

    if (isDemo) {
      // Guardar factura en localStorage
      const demoInvoices = JSON.parse(localStorage.getItem('demo_invoices') || '[]')
      const newInvoice = {
        id: Date.now(),
        invoice_number: `INV-DEMO-${Date.now()}`,
        ...invoiceData
      }
      demoInvoices.push(newInvoice)
      localStorage.setItem('demo_invoices', JSON.stringify(demoInvoices))
      
      // Registrar automáticamente como ingreso en demo_payments
      const demoPayments = JSON.parse(localStorage.getItem('demo_payments') || '[]')
      const incomeRecord = {
        id: Date.now(),
        invoice_id: newInvoice.id,
        payment_date: new Date().toISOString(),
        payment_method: 'factura',
        amount: total,
        reference_number: newInvoice.invoice_number,
        notes: 'Ingreso por factura generada'
      }
      demoPayments.push(incomeRecord)
      localStorage.setItem('demo_payments', JSON.stringify(demoPayments))
      
      // Crear comanda para la cocina
      const demoCommands = JSON.parse(localStorage.getItem('demo_commands') || '[]')
      const command = {
        id: Date.now(),
        invoice_id: newInvoice.id,
        invoice_number: newInvoice.invoice_number,
        status: 'pending',
        items: invoiceItems,
        notes: notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      demoCommands.push(command)
      localStorage.setItem('demo_commands', JSON.stringify(demoCommands))
      
      // Reproducir sonido de notificación
      playNotificationSound()
      
      await loadData()
      resetForm()
      alert(`✅ Factura creada y registrada como ingreso en modo demo\nFactura: ${newInvoice.invoice_number}\nMonto: $${total.toFixed(2)}\n\n🍳 Comanda enviada a la cocina`)
    } else {
      const result = await createInvoice(invoiceData)

      if (result.ok) {
        const newInvoice = result.data
        
        // Crear comanda en Supabase automáticamente
        const commandData = {
          invoice_id: newInvoice.id,
          invoice_number: newInvoice.invoice_number,
          status: 'pending',
          items: invoiceItems,
          notes: notes || '',
        }
        
        const commandResult = await createCommand(commandData)
        
        if (commandResult.ok) {
          playNotificationSound()
          await loadData()
          resetForm()
          alert(`✅ Factura creada exitosamente\nFactura: ${newInvoice.invoice_number}\nMonto: $${total.toFixed(2)}\n\n🍳 Comanda enviada a la cocina`)
        } else {
          setError(`Factura creada pero error en comanda: ${commandResult.error}`)
          await loadData()
          resetForm()
        }
      } else {
        setError(result.error)
      }
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setSelectedClient('')
    setInvoiceItems([])
    setDiscountAmount(0)
    setNotes('')
    setIsConsumerFinal(false)
    setUseSimpleInvoice(false)
    setSimpleSubtotal(0)
    setSimpleDiscount(0)
  }

  const handleStatusChange = async (id, newStatus) => {
    const result = await updateInvoiceStatus(id, newStatus)
    if (result.ok) {
      await loadData()
    }
  }

  const handleDownloadPDF = async (invoice) => {
    const client = clients.find(c => c.id === invoice.client_id) || { name: 'Cliente' }
    
    // Create mock items from invoice data if not available
    const mockItems = [{
      product_id: 1,
      description: 'Factura # ' + invoice.id,
      quantity: 1,
      unit_price: invoice.total_amount || 0
    }]
    
    try {
      generateInvoicePDF(invoice, mockItems, client, {
        name: 'Mi Empresa',
        ruc: '_______________'
      })
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Error generando PDF')
    }
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  if (loading) return <div className="page-container"><p>Cargando...</p></div>

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div>
          <span className="text-[0.75rem] font-bold text-[var(--accent-orange-light)] uppercase tracking-wider">
            Lumina Ledger • Ventas
          </span>
          <h1 className="mt-1">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">receipt</span>
            <span>Crear Facturas</span>
          </h1>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          <span className="material-symbols-outlined">add</span>
          <span>Nueva Factura</span>
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Invoice Form */}
      {showForm && (
        <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 mb-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-orange)]">edit_note</span>
            Crear Nueva Factura
          </h3>

          <form onSubmit={handleCreateInvoice} className="space-y-4">
            {/* Options Toggle */}
            <div className="flex gap-6 p-4 bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConsumerFinal}
                  onChange={(e) => {
                    setIsConsumerFinal(e.target.checked)
                    if (e.target.checked) setSelectedClient('')
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">Consumidor Final</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSimpleInvoice}
                  onChange={(e) => {
                    setUseSimpleInvoice(e.target.checked)
                    if (e.target.checked) setInvoiceItems([])
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">Factura Simple (sin detalle)</span>
              </label>
            </div>

            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Cliente
              </label>
              {isConsumerFinal ? (
                <div className="w-full px-4 py-2 rounded bg-[var(--accent-orange)] text-white font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined">person</span>
                  CONSUMIDOR FINAL
                </div>
              ) : (
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-orange)]"
                >
                  <option value="">-- Selecciona un cliente --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Items Section or Simple Invoice Section */}
            {useSimpleInvoice ? (
              <div className="border-t border-[var(--border-color)] pt-4 space-y-3">
                <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--accent-orange)]">calculate</span>
                  Monto de Factura Simple
                </h4>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Subtotal (antes de IVA)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={simpleSubtotal}
                    onChange={(e) => setSimpleSubtotal(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-orange)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Descuento
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={simpleDiscount}
                    onChange={(e) => setSimpleDiscount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-orange)]"
                  />
                </div>
              </div>
            ) : (
              <div className="border-t border-[var(--border-color)] pt-4">
                <h4 className="font-medium text-[var(--text-primary)] mb-3">Productos</h4>

                <div className="space-y-2 mb-4">
                  {invoiceItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[var(--bg-primary)] p-3 rounded border border-[var(--border-color)]">
                      <div className="flex-1">
                        <p className="font-medium text-[var(--text-primary)]">{item.product_name}</p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {item.quantity} x ${item.unit_price.toFixed(2)} = ${item.line_total.toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeInvoiceItem(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <select
                    value={itemProduct}
                    onChange={(e) => setItemProduct(e.target.value)}
                    className="col-span-2 px-3 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                  >
                    <option value="">-- Producto --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    placeholder="Cant."
                    className="px-3 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                  />
                  <button
                    type="button"
                    onClick={addInvoiceItem}
                    className="bg-[var(--accent-orange)] text-white rounded hover:bg-[var(--accent-orange-dark)]"
                  >
                    Añadir
                  </button>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-[var(--border-color)] pt-4 space-y-2">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal:</span>
                <span className="font-medium text-[var(--text-primary)]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <label className="text-[var(--text-secondary)]">Descuento:</label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                />
              </div>
              <div className="flex justify-between text-lg font-bold text-[var(--accent-orange)]">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
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
                placeholder="Observaciones de la factura..."
                rows="2"
                className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-orange)]"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Crear Factura
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoices List */}
      <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)]">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 p-6 pb-0">
          <span className="material-symbols-outlined text-[var(--accent-orange)]">history</span>
          Facturas Recientes
        </h3>

        {invoices.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] py-8">Sin facturas aún</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Factura #</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-[var(--text-secondary)] uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                    <td className="px-6 py-4 text-[var(--text-primary)] font-medium">#{inv.id}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">Cliente {inv.client_id}</td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {new Date(inv.invoice_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-[var(--text-primary)] font-medium">
                      ${inv.total_amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        className={`px-3 py-1 rounded text-sm font-medium border-none cursor-pointer ${
                          inv.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : inv.status === 'sent'
                            ? 'bg-blue-100 text-blue-700'
                            : inv.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <option value="draft">Borrador</option>
                        <option value="sent">Enviado</option>
                        <option value="paid">Pagado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button 
                        onClick={() => handleDownloadPDF(inv)}
                        title="Descargar PDF (Formato SRI)"
                        className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span className="text-xs">PDF</span>
                      </button>
                      <button className="text-red-500 hover:text-red-700">
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
