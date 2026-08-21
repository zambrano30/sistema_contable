import { useEffect, useState } from 'react'
import { getAllProducts } from '../services/productsService'
import { getAllClients, createClient } from '../services/clientsService'
import { createInvoice, getAllInvoices, deleteInvoice } from '../services/invoicesService'
// import { createCommand } from '../services/commandsService'
import { generateInvoicePDF } from '../services/invoicePdfService'
import { useAuth } from '../contexts/AuthContext'
// import { playNotificationSound } from '../services/notificationService'

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

  // Selection for bulk delete
  const [selectedInvoices, setSelectedInvoices] = useState(new Set())

  // Client creation form
  const [showCreateClient, setShowCreateClient] = useState(false)
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  })

  // Search states
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [filteredClients, setFilteredClients] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  // Filter clients based on search query (name, email, phone, cedula)
  useEffect(() => {
    if (!clientSearchQuery.trim()) {
      setFilteredClients(clients)
      return
    }

    const query = clientSearchQuery.toLowerCase()
    const filtered = clients.filter(client => 
      (client.name && client.name.toLowerCase().includes(query)) ||
      (client.email && client.email.toLowerCase().includes(query)) ||
      (client.phone && client.phone.includes(query)) ||
      (client.cedula_ruc && client.cedula_ruc.includes(query))
    )
    setFilteredClients(filtered)
  }, [clientSearchQuery, clients])

  // Handle barcode search - find product by barcode and add to invoice
  useEffect(() => {
    if (!barcodeSearch.trim()) return

    const product = products.find(p => p.barcode === barcodeSearch)
    if (product) {
      setItemProduct(product.id.toString())
      setItemQuantity('1')
      setBarcodeSearch('')
      // Optionally auto-add the item
      // addInvoiceItem()
    }
  }, [barcodeSearch])

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

  // Auto-add product to cart when selected
  const handleProductSelect = (e) => {
    const productId = e.target.value
    if (!productId) return

    const product = products.find(p => p.id === parseInt(productId))
    if (!product) return

    // Check if product already exists in cart
    const existingItem = invoiceItems.find(item => item.product_id === product.id)
    
    if (existingItem) {
      // If exists, increase quantity
      updateInvoiceItemQuantity(
        invoiceItems.indexOf(existingItem),
        existingItem.quantity + 1
      )
    } else {
      // Add new item with default quantity of 1
      const unitPrice = product.price || 0
      const quantity = 1
      const subtotal = unitPrice * quantity
      const taxAmount = (subtotal * 19) / 100
      const lineTotal = subtotal + taxAmount

      setInvoiceItems([
        ...invoiceItems,
        {
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit_price: unitPrice,
          discount_percentage: 0,
          tax_percentage: 19,
          line_total: lineTotal,
        },
      ])
    }

    setItemProduct('')
  }

  // Update quantity of item in cart
  const updateInvoiceItemQuantity = (index, newQuantity) => {
    if (newQuantity < 1) {
      removeInvoiceItem(index)
      return
    }

    const updatedItems = [...invoiceItems]
    const item = updatedItems[index]
    
    item.quantity = newQuantity
    const subtotal = item.unit_price * newQuantity
    const taxAmount = (subtotal * 19) / 100
    item.line_total = subtotal + taxAmount

    setInvoiceItems(updatedItems)
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
      
      // // Crear comanda para la cocina
      // const demoCommands = JSON.parse(localStorage.getItem('demo_commands') || '[]')
      // const command = {
      //   id: Date.now(),
      //   invoice_id: newInvoice.id,
      //   invoice_number: newInvoice.invoice_number,
      //   status: 'pending',
      //   items: invoiceItems,
      //   notes: notes || '',
      //   created_at: new Date().toISOString(),
      //   updated_at: new Date().toISOString()
      // }
      // demoCommands.push(command)
      // localStorage.setItem('demo_commands', JSON.stringify(demoCommands))
      // 
      // // Reproducir sonido de notificación
      // playNotificationSound()
      
      await loadData()
      resetForm()
      alert(`✅ Factura creada y registrada como ingreso en modo demo\nFactura: ${newInvoice.invoice_number}\nMonto: $${total.toFixed(2)}`)
    } else {
      const result = await createInvoice(invoiceData)

      if (result.ok) {
        const newInvoice = result.data
        
        // // Crear comanda en Supabase automáticamente
        // const commandData = {
        //   invoice_id: newInvoice.id,
        //   invoice_number: newInvoice.invoice_number,
        //   status: 'pending',
        //   items: invoiceItems,
        //   notes: notes || '',
        // }
        // 
        // const commandResult = await createCommand(commandData)
        // 
        // if (commandResult.ok) {
        //   playNotificationSound()
          await loadData()
          resetForm()
          alert(`✅ Factura creada exitosamente\nFactura: ${newInvoice.invoice_number}\nMonto: $${total.toFixed(2)}`)
        // } else {
        //   setError(`Factura creada pero error en comanda: ${commandResult.error}`)
        //   await loadData()
        //   resetForm()
        // }
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

  const capitalize = (str) => {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
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

  const handleDeleteInvoice = async (invoiceId) => {
    const confirmed = window.confirm('¿Seguro que deseas eliminar esta factura? Esta acción no se puede deshacer.')
    if (!confirmed) return

    if (isDemo) {
      // Eliminar de localStorage en modo demo
      const demoInvoices = JSON.parse(localStorage.getItem('demo_invoices') || '[]')
      const filteredInvoices = demoInvoices.filter(inv => inv.id !== invoiceId)
      localStorage.setItem('demo_invoices', JSON.stringify(filteredInvoices))
      
      // También eliminar pagos asociados
      const demoPayments = JSON.parse(localStorage.getItem('demo_payments') || '[]')
      const filteredPayments = demoPayments.filter(pay => pay.invoice_id !== invoiceId)
      localStorage.setItem('demo_payments', JSON.stringify(filteredPayments))
      
      await loadData()
      alert('✓ Factura eliminada')
    } else {
      // Eliminar de Supabase
      const result = await deleteInvoice(invoiceId)
      if (result.ok) {
        await loadData()
        alert('✓ Factura eliminada')
      } else {
        setError(`Error al eliminar: ${result.error}`)
      }
    }
  }

  const toggleInvoiceSelection = (invoiceId) => {
    const newSelected = new Set(selectedInvoices)
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId)
    } else {
      newSelected.add(invoiceId)
    }
    setSelectedInvoices(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedInvoices.size === invoices.length) {
      // Deseleccionar todas
      setSelectedInvoices(new Set())
    } else {
      // Seleccionar todas
      setSelectedInvoices(new Set(invoices.map(inv => inv.id)))
    }
  }

  const handleDeleteSelectedInvoices = async () => {
    if (selectedInvoices.size === 0) {
      setError('Selecciona al menos una factura para eliminar')
      return
    }

    const confirmed = window.confirm(`¿Seguro que deseas eliminar ${selectedInvoices.size} factura(s)? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    setLoading(true)
    let deletedCount = 0
    let failedCount = 0

    for (const invoiceId of selectedInvoices) {
      if (isDemo) {
        // Eliminar de localStorage en modo demo
        const demoInvoices = JSON.parse(localStorage.getItem('demo_invoices') || '[]')
        const filteredInvoices = demoInvoices.filter(inv => inv.id !== invoiceId)
        localStorage.setItem('demo_invoices', JSON.stringify(filteredInvoices))
        
        // También eliminar pagos asociados
        const demoPayments = JSON.parse(localStorage.getItem('demo_payments') || '[]')
        const filteredPayments = demoPayments.filter(pay => pay.invoice_id !== invoiceId)
        localStorage.setItem('demo_payments', JSON.stringify(filteredPayments))
        
        deletedCount++
      } else {
        // Eliminar de Supabase
        const result = await deleteInvoice(invoiceId)
        if (result.ok) {
          deletedCount++
        } else {
          failedCount++
        }
      }
    }

    await loadData()
    setSelectedInvoices(new Set())
    
    if (failedCount === 0) {
      alert(`✓ ${deletedCount} factura(s) eliminada(s) exitosamente`)
    } else {
      setError(`Se eliminaron ${deletedCount} facturas, pero ${failedCount} fallaron`)
    }

    setLoading(false)
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  if (loading) return <div className="page-container"><p>Cargando...</p></div>

// VENDOR: Modern Electronic Invoicing Interface (Invoice Form Style)
  if (user?.role === 'Vendedor') {
    return (
      <div className="page-container">
        {/* Invoice Header */}
        <div className="bg-[var(--bg-secondary)] border-2 border-[var(--accent-orange)] p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--accent-orange)]">FACTURA DE VENTA</h1>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--text-secondary)] uppercase">Facturador Electrónico</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">FacturaPro</p>
            </div>
            <div className="text-right text-xs text-[var(--text-secondary)]">
              <p>Fecha: {new Date().toLocaleDateString('es-ES')}</p>
              <p>Hora: {new Date().toLocaleTimeString('es-ES')}</p>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          {/* Client Info Section */}
          <div className="border-b border-[var(--border-color)] p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Client Search */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Buscar Cliente</label>
                <input
                  type="text"
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  placeholder="Nombre, email, cédula o RUC"
                  className="w-full px-3 py-2 text-sm rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent-orange)] focus:outline-none transition"
                />
                {clientSearchQuery && (
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] mt-1 max-h-40 overflow-y-auto rounded">
                    {filteredClients.length === 0 ? (
                      <p className="text-xs text-[var(--text-secondary)] p-2">No hay clientes que coincidan</p>
                    ) : (
                      filteredClients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => {
                            setSelectedClient(client.id)
                            setClientSearchQuery('')
                          }}
                          className="block w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--accent-orange)] hover:bg-opacity-20 border-b border-[var(--border-color)] last:border-b-0 transition"
                        >
                          <div className="font-bold">{client.name}</div>
                          {client.cedula_ruc && <div className="text-[var(--text-secondary)]">RUC: {client.cedula_ruc}</div>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected Client Display */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Cliente</label>
                {selectedClient ? (
                  <div className="bg-[var(--accent-orange)] bg-opacity-20 border border-[var(--accent-orange)] rounded p-3 min-h-12 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-[var(--text-primary)]">
                        {clients.find(c => c.id == selectedClient)?.name}
                      </p>
                      {clients.find(c => c.id == selectedClient)?.cedula_ruc && (
                        <p className="text-xs text-[var(--text-secondary)]">
                          RUC: {clients.find(c => c.id == selectedClient)?.cedula_ruc}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedClient('')
                        setClientSearchQuery('')
                      }}
                      className="text-[var(--accent-orange)] hover:text-red-500"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded p-3 min-h-12 flex items-center">
                    <span className="text-xs text-[var(--text-secondary)]">No seleccionado</span>
                  </div>
                )}
              </div>

              {/* Consumer Final Option */}
              <label className="flex items-center gap-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded p-3 cursor-pointer hover:border-[var(--accent-orange)] transition">
                <input
                  type="checkbox"
                  checked={isConsumerFinal}
                  onChange={(e) => {
                    setIsConsumerFinal(e.target.checked)
                    if (e.target.checked) setSelectedClient('')
                  }}
                  className="w-4 h-4"
                />
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Cliente</p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Consumidor Final</p>
                </div>
              </label>
            </div>
          </div>

          {/* Product Input Section */}
          <div className="border-b border-[var(--border-color)] p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Barcode Search */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Código de Barras</label>
                <input
                  type="text"
                  value={barcodeSearch}
                  onChange={(e) => setBarcodeSearch(e.target.value)}
                  placeholder="Escanea aquí"
                  autoFocus
                  className="w-full px-3 py-2 text-sm rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent-orange)] focus:outline-none transition"
                />
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Seleccionar Producto</label>
                <select
                  value={itemProduct}
                  onChange={handleProductSelect}
                  className="w-full px-3 py-2 text-sm rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent-orange)] focus:outline-none transition"
                >
                  <option value="">-- Selecciona un producto --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ${p.price?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="border-b border-[var(--border-color)] p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[var(--accent-orange)]">
                  <th className="text-left px-2 py-2 text-xs font-bold text-[var(--text-secondary)] uppercase">Código</th>
                  <th className="text-left px-2 py-2 text-xs font-bold text-[var(--text-secondary)] uppercase">Detalle</th>
                  <th className="text-center px-2 py-2 text-xs font-bold text-[var(--text-secondary)] uppercase">Cantidad</th>
                  <th className="text-right px-2 py-2 text-xs font-bold text-[var(--text-secondary)] uppercase">V. Unitario</th>
                  <th className="text-right px-2 py-2 text-xs font-bold text-[var(--text-secondary)] uppercase">Descto</th>
                  <th className="text-right px-2 py-2 text-xs font-bold text-[var(--text-secondary)] uppercase">IVA</th>
                  <th className="text-right px-2 py-2 text-xs font-bold text-[var(--text-secondary)] uppercase">Total</th>
                  <th className="text-center px-2 py-2 text-xs font-bold text-[var(--text-secondary)] uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-[var(--text-secondary)]">
                      <span className="material-symbols-outlined text-3xl opacity-50">inbox</span>
                      <p className="text-sm mt-2">Sin productos agregados</p>
                    </td>
                  </tr>
                ) : (
                  invoiceItems.map((item, idx) => {
                    const itemIva = item.unit_price * item.quantity * 0.19
                    return (
                      <tr key={idx} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition">
                        <td className="px-2 py-3 text-xs text-[var(--text-secondary)]">-</td>
                        <td className="px-2 py-3">
                          <p className="font-bold text-[var(--text-primary)]">{item.product_name}</p>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItemQuantity(idx, parseInt(e.target.value) || 1)}
                            className="w-16 text-center px-2 py-1 text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded font-bold text-[var(--text-primary)]"
                          />
                        </td>
                        <td className="px-2 py-3 text-right font-bold text-[var(--text-primary)]">
                          ${item.unit_price?.toFixed(2)}
                        </td>
                        <td className="px-2 py-3 text-right text-[var(--text-secondary)]">
                          $0.00
                        </td>
                        <td className="px-2 py-3 text-right font-bold text-[var(--text-primary)]">
                          ${itemIva.toFixed(2)}
                        </td>
                        <td className="px-2 py-3 text-right font-bold text-[var(--accent-orange)]">
                          ${item.line_total?.toFixed(2)}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={() => removeInvoiceItem(idx)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-500 hover:bg-opacity-10 p-1 rounded transition"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          {invoiceItems.length > 0 && (
            <div className="p-6">
              <div className="flex flex-col items-end space-y-3">
                <div className="grid grid-cols-2 gap-8 w-full md:w-80">
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-secondary)] uppercase">Subtotal:</p>
                  </div>
                  <div className="text-right font-bold text-[var(--text-primary)]">
                    ${(invoiceItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) - discountAmount).toFixed(2)}
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-[var(--text-secondary)] uppercase">Descuento:</p>
                  </div>
                  <div className="text-right font-bold text-[var(--text-primary)]">
                    $0.00
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-[var(--text-secondary)] uppercase">IVA (19%):</p>
                  </div>
                  <div className="text-right font-bold text-[var(--text-primary)]">
                    ${((invoiceItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) - discountAmount) * 0.19).toFixed(2)}
                  </div>

                  <div className="border-t-2 border-[var(--accent-orange)]"></div>
                  <div className="border-t-2 border-[var(--accent-orange)]"></div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--accent-orange)] uppercase">TOTAL:</p>
                  </div>
                  <div className="text-right text-2xl font-bold text-[var(--accent-orange)]">
                    ${((invoiceItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) - discountAmount) * 1.19).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-[var(--border-color)] p-6 bg-[var(--bg-primary)]">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleCreateInvoice}
                disabled={invoiceItems.length === 0 || (!selectedClient && !isConsumerFinal)}
                className="px-6 py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded transition flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">check_circle</span>
                Facturar
              </button>
              <button
                onClick={() => {
                  setInvoiceItems([])
                  setSelectedClient('')
                  setIsConsumerFinal(false)
                  setClientSearchQuery('')
                }}
                className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">refresh</span>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ADMIN: Full Management Interface
  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div>
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
        <div className="p-6 pb-0 flex justify-between items-center">
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 m-0">
            <span className="material-symbols-outlined text-[var(--accent-orange)]">history</span>
            Facturas Recientes
          </h3>
          {selectedInvoices.size > 0 && (
            <button
              onClick={handleDeleteSelectedInvoices}
              disabled={loading}
              className="btn-danger flex items-center gap-2 text-sm"
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              <span>Eliminar {selectedInvoices.size} seleccionada(s)</span>
            </button>
          )}
        </div>

        {invoices.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] py-8">Sin facturas aún</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.size === invoices.length && invoices.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Factura #</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-[var(--text-secondary)] uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.has(inv.id)}
                        onChange={() => toggleInvoiceSelection(inv.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-[var(--text-primary)] font-medium">#{inv.id}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">
                      {inv.client_id 
                        ? capitalize(clients.find(c => c.id === inv.client_id)?.name || `Cliente ${inv.client_id}`)
                        : 'Consumidor Final'
                      }
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {new Date(inv.invoice_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-[var(--text-primary)] font-medium">
                      ${inv.total_amount?.toFixed(2) || '0.00'}
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
                      <button 
                        onClick={() => handleDeleteInvoice(inv.id)}
                        title="Eliminar factura"
                        className="text-red-500 hover:text-red-700 flex items-center gap-1"
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
