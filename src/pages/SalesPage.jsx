import { useEffect, useState, useRef } from 'react'
import { getAllProducts } from '../services/productsService'
import { getAllClients, createClient } from '../services/clientsService'
import { createInvoice } from '../services/invoicesService'
import { useAuth } from '../contexts/AuthContext'

export default function SalesPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [selectedClient, setSelectedClient] = useState('')
  const [invoiceItems, setInvoiceItems] = useState([])
  const [discountAmount, setDiscountAmount] = useState('')
  const [notes, setNotes] = useState('')

  // Consumer final and simple invoice options
  const [isConsumerFinal, setIsConsumerFinal] = useState(false)
  const [useSimpleInvoice, setUseSimpleInvoice] = useState(false)
  const [simpleSubtotal, setSimpleSubtotal] = useState('')
  const [simpleDiscount, setSimpleDiscount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  // Item form
  const [itemProduct, setItemProduct] = useState('')
  const [itemQuantity, setItemQuantity] = useState('1')
  const [itemDiscount, setItemDiscount] = useState('')

  // Search states
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [filteredClients, setFilteredClients] = useState([])
  const [showProductCatalog, setShowProductCatalog] = useState(false)
  
  // Client modal
  const [showClientModal, setShowClientModal] = useState(false)
  const [clientModalSearchQuery, setClientModalSearchQuery] = useState('')
  const [clientModalPage, setClientModalPage] = useState(1)
  const clientModalPageSize = 20
  
  // Create client form in modal
  const [showCreateClientForm, setShowCreateClientForm] = useState(false)
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
  })
  const [errorCreatingClient, setErrorCreatingClient] = useState('')

  const draftRestoredRef = useRef(false)
  const draftStorageKey = `sales_invoice_draft_${user?.id || 'guest'}`

  useEffect(() => {
    draftRestoredRef.current = false

    try {
      const savedDraft = localStorage.getItem(draftStorageKey)
      if (savedDraft) {
        const draft = JSON.parse(savedDraft)
        setShowForm(draft.showForm ?? true)
        setSelectedClient(draft.selectedClient || '')
        setInvoiceItems(Array.isArray(draft.invoiceItems) ? draft.invoiceItems : [])
        setDiscountAmount(draft.discountAmount || '')
        setNotes(draft.notes || '')
        setIsConsumerFinal(Boolean(draft.isConsumerFinal))
        setUseSimpleInvoice(Boolean(draft.useSimpleInvoice))
        setSimpleSubtotal(draft.simpleSubtotal || '')
        setSimpleDiscount(draft.simpleDiscount || '')
        setPaymentMethod(draft.paymentMethod || 'cash')
      }
    } catch (error) {
      console.error('No se pudo restaurar el borrador de factura:', error)
      localStorage.removeItem(draftStorageKey)
    }

    draftRestoredRef.current = true
  }, [draftStorageKey])

  useEffect(() => {
    if (!draftRestoredRef.current) return

    const hasDraft = showForm || selectedClient || invoiceItems.length > 0 || notes ||
      isConsumerFinal || useSimpleInvoice || Number(simpleSubtotal) > 0 ||
      Number(simpleDiscount) > 0 || Number(discountAmount) > 0

    if (!hasDraft) {
      localStorage.removeItem(draftStorageKey)
      return
    }

    localStorage.setItem(draftStorageKey, JSON.stringify({
      showForm,
      selectedClient,
      invoiceItems,
      discountAmount,
      notes,
      isConsumerFinal,
      useSimpleInvoice,
      simpleSubtotal,
      simpleDiscount,
      paymentMethod,
    }))
  }, [
    draftStorageKey,
    showForm,
    selectedClient,
    invoiceItems,
    discountAmount,
    notes,
    isConsumerFinal,
    useSimpleInvoice,
    simpleSubtotal,
    simpleDiscount,
    paymentMethod,
  ])

  useEffect(() => {
    loadData()
  }, [])

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
      (client.tax_id && client.tax_id.includes(query))
    )
    setFilteredClients(filtered)
  }, [clientSearchQuery, clients])

  const productSearchTerm = productSearchQuery.trim().toLocaleLowerCase()
  const productSuggestions = productSearchTerm
    ? products
      .filter(product => product.name?.toLocaleLowerCase().includes(productSearchTerm))
      .slice(0, 8)
    : []

  const loadData = async () => {
    setLoading(true)
    
    const [productsRes, clientsRes] = await Promise.all([
      getAllProducts(),
      getAllClients(),
    ])

    if (productsRes.ok) setProducts(productsRes.data)
    if (clientsRes.ok) setClients(clientsRes.data)

    setLoading(false)
  }

  const addInvoiceItem = () => {
    if (!itemProduct || !itemQuantity) {
      setError('Selecciona producto y cantidad')
      return
    }

    const product = products.find(p => p.id === parseInt(itemProduct))
    if (!product) return

    const quantity = Number(itemQuantity)
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError('La cantidad debe ser un número entero mayor que cero')
      return
    }
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
    setItemQuantity('1')
    setItemDiscount('')
  }

  const handleProductSelect = (productId) => {
    if (!productId) return

    const product = products.find(p => String(p.id) === String(productId))
    if (!product) return

    const existingItem = invoiceItems.find(item => item.product_id === product.id)
    
    if (existingItem) {
      updateInvoiceItemQuantity(
        invoiceItems.indexOf(existingItem),
        existingItem.quantity + 1
      )
    } else {
      const unitPrice = product.price || 0
      const quantity = 1

      setInvoiceItems([
        ...invoiceItems,
        {
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit_price: unitPrice,
          discount_percentage: 0,
          tax_percentage: 19,
          line_total: 0,
        },
      ])
    }
  }

  const updateInvoiceItemQuantity = (index, newQuantity) => {
    const updatedItems = [...invoiceItems]

    if (newQuantity === '') {
      updatedItems[index].quantity = ''
      updatedItems[index].line_total = 0
      setInvoiceItems(updatedItems)
      return
    }

    newQuantity = Number(newQuantity)

    if (!Number.isInteger(newQuantity)) return

    if (newQuantity < 1) {
      removeInvoiceItem(index)
      return
    }

    const item = updatedItems[index]
    
    item.quantity = newQuantity
    const subtotal = item.unit_price * newQuantity
    const taxAmount = (subtotal * 19) / 100
    item.line_total = subtotal + taxAmount

    setInvoiceItems(updatedItems)
  }

  const adjustInvoiceItemQuantity = (index, change) => {
    const quantity = Number(invoiceItems[index]?.quantity) || 0
    updateInvoiceItemQuantity(index, Math.max(1, quantity + change))
  }

  const removeInvoiceItem = (index) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    if (useSimpleInvoice) {
      const grossSubtotal = Math.max(0, parseFloat(simpleSubtotal) || 0)
      const discount = Math.min(grossSubtotal, Math.max(0, parseFloat(simpleDiscount) || 0))
      const subtotal = grossSubtotal - discount
      const total = subtotal
      return { subtotal, taxAmount: 0, total }
    }

    const grossSubtotal = invoiceItems.reduce((sum, item) => sum + (item.unit_price * (parseInt(item.quantity, 10) || 0)), 0)
    const discount = Math.min(grossSubtotal, Math.max(0, parseFloat(discountAmount) || 0))
    const subtotal = grossSubtotal - discount
    const total = subtotal

    return { subtotal, taxAmount: 0, total }
  }

  const getLocalDate = () => {
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${today.getFullYear()}-${month}-${day}`
  }

  const handleCreateClient = async (e) => {
    e.preventDefault()
    setErrorCreatingClient('')

    if (!newClientForm.name.trim()) {
      setErrorCreatingClient('El nombre del cliente es requerido')
      return
    }

    const clientData = {
      name: newClientForm.name.trim(),
      email: newClientForm.email.trim(),
      phone: newClientForm.phone.trim(),
      address: newClientForm.address.trim(),
      tax_id: newClientForm.tax_id.trim(),
      cedula_ruc: newClientForm.tax_id.trim(),
    }

    const result = await createClient(clientData)
    
    if (result.ok) {
      // Reload clients
      const clientsRes = await getAllClients()
      if (clientsRes.ok) {
        setClients(clientsRes.data)
        // Auto-select the new client
        if (result.data?.id) {
          setSelectedClient(result.data.id.toString())
        }
      }
      
      // Reset form
      setNewClientForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        tax_id: '',
      })
      setShowCreateClientForm(false)
      setShowClientModal(false)
    } else {
      setErrorCreatingClient(result.error || 'Error al crear el cliente')
    }
  }

  const handleCreateInvoice = async (e) => {
    if (e) e.preventDefault()
    setError('')

    if (!isConsumerFinal && !selectedClient) {
      setError('Selecciona un cliente o marca como Consumidor Final')
      return
    }

    if (!useSimpleInvoice && invoiceItems.length === 0) {
      setError('Añade al menos un producto o usa Factura Simple')
      return
    }

    if (!useSimpleInvoice && invoiceItems.some(item => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
      setError('Ingresa una cantidad entera para cada producto')
      return
    }

    if (useSimpleInvoice && (!simpleSubtotal || parseFloat(simpleSubtotal) <= 0)) {
      setError('Ingresa un monto para la factura simple')
      return
    }

    const { subtotal, taxAmount, total } = calculateTotals()

    const invoiceData = {
      client_id: isConsumerFinal ? null : parseInt(selectedClient),
      invoice_date: getLocalDate(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal,
      tax_amount: 0,
      discount_amount: useSimpleInvoice ? parseFloat(simpleDiscount) : parseFloat(discountAmount),
      total_amount: total,
      payment_method: paymentMethod,
      notes: notes || (isConsumerFinal ? 'Consumidor Final' : ''),
      items: useSimpleInvoice ? [] : invoiceItems,
    }

    const result = await createInvoice(invoiceData)

    if (result.ok) {
      const newInvoice = result.data
      await loadData()
      resetForm()
      alert(`✅ Factura creada exitosamente\nFactura: ${newInvoice.invoice_number}\nMonto: $${total.toFixed(2)}`)
    } else {
      setError(result.error)
    }
  }

  const resetForm = () => {
    localStorage.removeItem(draftStorageKey)
    setShowForm(false)
    setSelectedClient('')
    setInvoiceItems([])
    setDiscountAmount('')
    setNotes('')
    setIsConsumerFinal(false)
    setUseSimpleInvoice(false)
    setSimpleSubtotal('')
    setSimpleDiscount('')
    setPaymentMethod('cash')
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  if (loading) return (
    <div className="page-container flex items-center justify-center py-20">
      <div className="text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--accent-orange)] animate-spin">sync</span>
        <p className="mt-2 text-[var(--text-secondary)] font-medium">Cargando módulo de facturación...</p>
      </div>
    </div>
  )

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 m-0 font-heading">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">point_of_sale</span>
            <span>Ventas</span>
          </h1>
        </div>
      </header>

      {error && (
        <div className="error-message flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* Modern POS Billing Interface Container */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.8fr)_360px] xl:items-start">
        {/* Left Column: Client & Product Selection Panel */}
        <div className="space-y-6 min-w-0">
          {/* Client Selection Card */}
          <div className="card">
            <div className="mb-4 pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-extrabold m-0 text-[var(--text-primary)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--secondary)]">person_search</span>
                <span>Datos del Cliente</span>
              </h3>
            </div>

            {!isConsumerFinal ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowClientModal(true)}
                  className="px-4 py-2 bg-[var(--accent-orange)] hover:bg-orange-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 h-10"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  <span>Seleccionar Cliente</span>
                </button>

                {selectedClient && (
                  <div className="form-group">
                    <label>Cliente Seleccionado</label>
                    <div className="p-2.5 bg-[var(--accent-orange)]/15 border border-[var(--accent-orange)]/40 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-white m-0">
                          {clients.find(c => c.id.toString() === selectedClient)?.name}
                        </p>
                        <p className="text-xs text-[var(--accent-orange-light)] m-0">
                          CI / RUC: {clients.find(c => c.id.toString() === selectedClient)?.tax_id || 'Consumidor Final'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedClient('')}
                        className="text-red-400 hover:text-red-300"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-[var(--accent-orange)]/10 border border-[var(--accent-orange)]/30 rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--accent-orange)]">badge</span>
                <div>
                  <p className="font-bold text-sm m-0 text-white">Consumidor Final</p>
                  <p className="text-xs text-[var(--text-secondary)] m-0">Documento simplificado autorizado por SRI</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Selection Card */}
          <div className="card">
            <div className="mb-4 pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-extrabold m-0 text-[var(--text-primary)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--accent-orange)]">inventory_2</span>
                <span>Productos</span>
              </h3>
            </div>

            {!useSimpleInvoice ? (
              <button
                type="button"
                onClick={() => {
                  setProductSearchQuery('')
                  setShowProductCatalog(true)
                }}
                className="btn-secondary w-full justify-center sm:w-auto"
              >
                <span className="material-symbols-outlined" aria-hidden="true">search</span>
                <span>Buscar productos</span>
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Subtotal Global ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={simpleSubtotal}
                    onChange={(e) => setSimpleSubtotal(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Descuento ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={simpleDiscount}
                    onChange={(e) => setSimpleDiscount(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {showProductCatalog && (
            <div
              className="sales-product-modal-overlay fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pb-4"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setShowProductCatalog(false)
                  setProductSearchQuery('')
                }
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="sales-product-dialog-title"
                className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl"
              >
                <header className="flex items-center justify-between gap-4 border-b border-[var(--border-color)] p-4 sm:p-5">
                  <h2 id="sales-product-dialog-title" className="m-0 text-lg font-bold text-[var(--text-primary)]">Buscar productos</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductCatalog(false)
                      setProductSearchQuery('')
                    }}
                    className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    aria-label="Cerrar búsqueda de productos"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">close</span>
                  </button>
                </header>

                <div className="border-b border-[var(--border-color)] p-4 sm:p-5">
                  <label htmlFor="sales-product-search" className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">Nombre del producto</label>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true">search</span>
                    <input
                      id="sales-product-search"
                      type="search"
                      autoComplete="off"
                      value={productSearchQuery}
                      onChange={(event) => setProductSearchQuery(event.target.value)}
                      placeholder=""
                      aria-controls="sales-product-results"
                      aria-expanded={productSearchTerm.length > 0}
                      className="h-12 w-full pl-11 pr-12 text-base"
                    />
                    {productSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setProductSearchQuery('')}
                        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                        aria-label="Limpiar búsqueda"
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">close</span>
                      </button>
                    )}
                  </div>
                </div>

                <div id="sales-product-results" className="min-h-24 flex-1 overflow-y-auto">
                  {!productSearchTerm ? (
                    <p className="px-4 py-6 text-sm text-[var(--text-secondary)] sm:px-5">Escribe el nombre para ver productos.</p>
                  ) : productSuggestions.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-[var(--text-secondary)] sm:px-5">No se encontraron productos.</p>
                  ) : (
                    productSuggestions.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          handleProductSelect(product.id)
                          setProductSearchQuery('')
                          setShowProductCatalog(false)
                        }}
                        className="flex w-full items-center justify-between gap-4 border-b border-[var(--border-color)] px-4 py-3 text-left transition hover:bg-[var(--bg-hover)] sm:px-5"
                      >
                        <span className="min-w-0 truncate font-semibold text-[var(--text-primary)]">{product.name}</span>
                        <span className="shrink-0 text-right text-sm">
                          <span className="font-bold text-[var(--accent-orange)]">${Number(product.price || 0).toFixed(2)}</span>
                          <span className="ml-2 text-[var(--text-secondary)]">Stock: {product.quantity ?? 0}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}

          {/* Client Modal */}
          {showClientModal && (() => {
            const filteredClientsModal = clients.filter(c =>
              (c.name && c.name.toLowerCase().includes(clientModalSearchQuery.toLowerCase())) ||
              (c.tax_id && c.tax_id.includes(clientModalSearchQuery)) ||
              (c.email && c.email.toLowerCase().includes(clientModalSearchQuery))
            )
            
            const totalPages = Math.ceil(filteredClientsModal.length / clientModalPageSize)
            const startIndex = (clientModalPage - 1) * clientModalPageSize
            const paginatedClients = filteredClientsModal.slice(startIndex, startIndex + clientModalPageSize)
            
            return (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-[var(--bg-secondary)] rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-auto border border-[var(--border-color)] flex flex-col">
                  {/* Header */}
                  <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
                        <span className="material-symbols-outlined text-[var(--accent-orange)]">person</span>
                        Seleccionar Cliente ({filteredClientsModal.length})
                      </h2>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowCreateClientForm(!showCreateClientForm)}
                          className="btn-primary btn-small"
                          title="Crear nuevo cliente"
                        >
                          <span className="material-symbols-outlined text-sm">person_add</span>
                          <span className="text-xs hidden sm:inline">Crear</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowClientModal(false)
                            setClientModalSearchQuery('')
                            setClientModalPage(1)
                            setShowCreateClientForm(false)
                          }}
                          className="text-[var(--text-tertiary)] hover:text-white transition"
                        >
                          <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={clientModalSearchQuery}
                        onChange={(e) => {
                          setClientModalSearchQuery(e.target.value)
                          setClientModalPage(1)
                        }}
                        className="pl-14 pr-4 w-full"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)]">search</span>
                    </div>
                  </div>

                  {/* Create Client Form */}
                  {showCreateClientForm && (
                    <div className="border-b border-[var(--border-color)] p-6 bg-[var(--bg-primary)]">
                      <h3 className="text-lg font-extrabold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[var(--accent-orange)]">person_add</span>
                        Crear Nuevo Cliente
                      </h3>
                      
                      {errorCreatingClient && (
                        <div className="error-message mb-4 flex items-center gap-2 text-sm">
                          <span className="material-symbols-outlined text-lg">error</span>
                          <span>{errorCreatingClient}</span>
                        </div>
                      )}

                      <form onSubmit={handleCreateClient} className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Nombre *</label>
                          <input
                            type="text"
                            value={newClientForm.name}
                            onChange={(e) => setNewClientForm({...newClientForm, name: e.target.value})}
                            placeholder=""
                            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">RUC / Cédula</label>
                            <input
                              type="text"
                              value={newClientForm.tax_id}
                              onChange={(e) => setNewClientForm({...newClientForm, tax_id: e.target.value})}
                              placeholder=""
                              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Email</label>
                            <input
                              type="email"
                              value={newClientForm.email}
                              onChange={(e) => setNewClientForm({...newClientForm, email: e.target.value})}
                              placeholder=""
                              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Teléfono</label>
                            <input
                              type="tel"
                              value={newClientForm.phone}
                              onChange={(e) => setNewClientForm({...newClientForm, phone: e.target.value})}
                              placeholder=""
                              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Dirección</label>
                            <input
                              type="text"
                              value={newClientForm.address}
                              onChange={(e) => setNewClientForm({...newClientForm, address: e.target.value})}
                              placeholder=""
                              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border-color)]">
                          <button
                            type="button"
                            onClick={() => {
                              setShowCreateClientForm(false)
                              setNewClientForm({name: '', email: '', phone: '', address: '', tax_id: ''})
                              setErrorCreatingClient('')
                            }}
                            className="btn-secondary btn-small"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="btn-primary btn-small"
                          >
                            <span className="material-symbols-outlined text-sm">save</span>
                            <span>Crear Cliente</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Client List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]">
                    {showCreateClientForm ? (
                      <p className="text-center text-[var(--text-tertiary)] py-8 text-sm">Complete el formulario para crear un nuevo cliente</p>
                    ) : filteredClientsModal.length === 0 ? (
                      <p className="text-center text-[var(--text-tertiary)] py-12">No se encontraron clientes</p>
                    ) : paginatedClients.length === 0 ? (
                      <p className="text-center text-[var(--text-tertiary)] py-12">No hay clientes en esta página</p>
                    ) : (
                      paginatedClients.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedClient(c.id.toString())
                            setShowClientModal(false)
                            setClientModalSearchQuery('')
                            setClientModalPage(1)
                            setShowCreateClientForm(false)
                          }}
                          className="w-full text-left p-5 hover:bg-[var(--bg-primary)] transition flex items-center justify-between gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm truncate">{c.name}</p>
                            <p className="text-xs text-[var(--text-tertiary)] truncate">CI / RUC: {c.tax_id || 'N/A'}</p>
                            <p className="text-xs text-[var(--text-tertiary)] truncate">{c.email}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="material-symbols-outlined text-[var(--accent-orange)]">check_circle</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {filteredClientsModal.length > 0 && totalPages > 1 && (
                    <div className="sticky bottom-0 bg-[var(--bg-primary)] border-t border-[var(--border-color)] p-5 flex items-center justify-between gap-4">
                      <p className="text-xs text-[var(--text-secondary)]">
                        Mostrando {startIndex + 1}-{Math.min(startIndex + clientModalPageSize, filteredClientsModal.length)} de {filteredClientsModal.length}
                      </p>
                      <div className="flex gap-3 items-center">
                        <button
                          onClick={() => setClientModalPage(Math.max(1, clientModalPage - 1))}
                          disabled={clientModalPage === 1}
                          className="p-2 bg-[var(--bg-secondary)] hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
                          title="Página anterior"
                        >
                          <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        <span className="px-4 py-2 text-white text-sm font-bold min-w-max">
                          {clientModalPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setClientModalPage(Math.min(totalPages, clientModalPage + 1))}
                          disabled={clientModalPage === totalPages}
                          className="p-2 bg-[var(--bg-secondary)] hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
                          title="Próxima página"
                        >
                          <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Cart Items Table */}
          {!useSimpleInvoice && (
            <div className="table-wrapper">
              <table className="custom-table sales-cart-table" aria-label="Productos seleccionados para la factura">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Cant.</th>
                    <th className="text-right">Precio Unit.</th>
                    <th className="text-right">Total</th>
                    <th className="text-center">Quitar</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.length === 0 ? (
                    <tr className="sales-cart-empty-row">
                      <td colSpan="5" className="text-center py-10 text-[var(--text-tertiary)]">
                        <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">shopping_cart</span>
                        <span>No has agregado productos a la factura aún</span>
                      </td>
                    </tr>
                  ) : (
                    invoiceItems.map((item, idx) => (
                      <tr key={idx} className="sales-cart-row">
                        <td className="font-bold text-white">{item.product_name}</td>
                        <td className="text-center" data-label="Cantidad">
                          <div className="quantity-control">
                            <button
                              type="button"
                              className="quantity-stepper"
                              onClick={() => adjustInvoiceItemQuantity(idx, -1)}
                              aria-label={`Restar una unidad de ${item.product_name}`}
                            >
                              <span className="material-symbols-outlined" aria-hidden="true">remove</span>
                            </button>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              inputMode="numeric"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceItemQuantity(idx, e.target.value)}
                              className="quantity-input text-center font-mono"
                              aria-label={`Cantidad de ${item.product_name}`}
                            />
                            <button
                              type="button"
                              className="quantity-stepper"
                              onClick={() => adjustInvoiceItemQuantity(idx, 1)}
                              aria-label={`Sumar una unidad de ${item.product_name}`}
                            >
                              <span className="material-symbols-outlined" aria-hidden="true">add</span>
                            </button>
                          </div>
                        </td>
                        <td className="text-right font-mono" data-label="Precio unitario">${item.unit_price?.toFixed(2)}</td>
                        <td className="text-right font-mono font-bold text-[var(--accent-orange-light)]" data-label="Total">
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </td>
                        <td className="text-center" data-label="Quitar">
                          <button
                            type="button"
                            onClick={() => removeInvoiceItem(idx)}
                            className="text-red-400 hover:text-red-300 p-1"
                            aria-label={`Quitar ${item.product_name}`}
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Checkout & Summary Sidebar */}
        <div className="sales-summary-shell w-full">
          <div className="sales-summary-card card bg-gradient-to-b from-[#1a2633] via-[#141d2a] to-[#0f1419] border border-white/10 backdrop-blur-sm flex flex-col justify-between w-full rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-extrabold m-0 text-[var(--text-primary)]">
                Resumen de Cobro
              </h3>
            </div>

            <div className="px-6 py-4 space-y-4 flex-1 overflow-hidden">
              <div className="form-group font-sans">
                <label htmlFor="payment-method" className="text-sm font-semibold text-[var(--text-secondary)] mb-2 block">Método de pago</label>
                <select 
                  id="payment-method" 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[var(--accent-orange)] focus:outline-none transition-all"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>
              
              {!useSimpleInvoice && (
                <div className="form-group font-sans">
                  <label htmlFor="invoice-discount" className="text-sm font-semibold text-[var(--text-secondary)] mb-2 block">Descuento especial ($)</label>
                  <input
                    id="invoice-discount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder=""
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[var(--accent-orange)] focus:outline-none transition-all"
                  />
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center bg-white/5 rounded-lg px-4 py-3 border border-white/5">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Subtotal Neto:</span>
                  <span className="font-bold text-white text-lg">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center bg-white/5 rounded-lg px-4 py-3 border border-white/5">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Descuento Aplicado:</span>
                  <span className="font-bold text-[#ff6b35] text-lg">
                    -${(useSimpleInvoice ? parseFloat(simpleDiscount) || 0 : parseFloat(discountAmount) || 0).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-white/5 rounded-lg px-4 py-3 border border-white/5">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Impuesto IVA (15%):</span>
                  <span className="font-bold text-emerald-400 text-lg">$0.00</span>
                </div>
              </div>

              <div className="relative mt-4 pt-4">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-orange)]/50 to-transparent"></div>
                <div className="bg-gradient-to-r from-[var(--accent-orange)]/10 to-[#ff7b00]/10 rounded-xl px-4 py-4 border border-[var(--accent-orange)]/20">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">Total Final:</span>
                    <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-orange)] to-[#ff7b00]">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 space-y-2.5 border-t border-white/5">
              <button
                type="button"
                onClick={handleCreateInvoice}
                disabled={(!useSimpleInvoice && invoiceItems.length === 0) || (!selectedClient && !isConsumerFinal)}
                className="btn-primary w-full py-3.5 text-base font-semibold shadow-xl shadow-[var(--accent-orange)]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer rounded-lg transition-all hover:shadow-lg hover:shadow-[var(--accent-orange)]/40"
              >
                Emitir Factura Electrónica
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="w-full py-2.5 px-4 text-sm font-medium text-[var(--text-tertiary)] hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all"
              >
                Limpiar Formulario
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
