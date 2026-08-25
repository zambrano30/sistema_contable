import { useEffect, useState, useRef } from 'react'
import { getAllProducts } from '../services/productsService'
import { getAllClients } from '../services/clientsService'
import { createInvoice } from '../services/invoicesService'
import { BarcodeScanner } from '../components/BarcodeScanner'
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
  const [discountAmount, setDiscountAmount] = useState(0)
  const [notes, setNotes] = useState('')

  // Consumer final and simple invoice options
  const [isConsumerFinal, setIsConsumerFinal] = useState(false)
  const [useSimpleInvoice, setUseSimpleInvoice] = useState(false)
  const [simpleSubtotal, setSimpleSubtotal] = useState(0)
  const [simpleDiscount, setSimpleDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')

  // Item form
  const [itemProduct, setItemProduct] = useState('')
  const [itemQuantity, setItemQuantity] = useState('')
  const [itemDiscount, setItemDiscount] = useState(0)

  // Search states
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [filteredClients, setFilteredClients] = useState([])
  
  // Product catalog modal
  const [showProductCatalog, setShowProductCatalog] = useState(false)
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('')
  const [catalogPage, setCatalogPage] = useState(1)
  const catalogPageSize = 20
  
  // Client modal
  const [showClientModal, setShowClientModal] = useState(false)
  const [clientModalSearchQuery, setClientModalSearchQuery] = useState('')
  const [clientModalPage, setClientModalPage] = useState(1)
  const clientModalPageSize = 20

  // Barcode Scanner
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  
  const barcodeInputRef = useRef(null)

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

  useEffect(() => {
    if (!barcodeSearch.trim()) return

    const product = products.find(p => p.barcode === barcodeSearch)
    if (product) {
      setItemProduct(product.id.toString())
      setItemQuantity('1')
      setBarcodeSearch('')
    }
  }, [barcodeSearch])

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

  const handleProductSelect = (e) => {
    const productId = e.target.value
    if (!productId) return

    const product = products.find(p => p.id === parseInt(productId))
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

  const handleBarcodeScanned = (barcode) => {
    // Buscar producto por código de barras
    const product = products.find(p => p.barcode === barcode)
    if (product) {
      handleProductSelect({ target: { value: product.id.toString() } })
    } else {
      setError(`Código de barras "${barcode}" no encontrado`)
    }
    setShowBarcodeScanner(false)
    // Enfocar el input de código de barras después de cerrar el scanner
    setTimeout(() => barcodeInputRef.current?.focus(), 100)
  }

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

  const getLocalDate = () => {
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${today.getFullYear()}-${month}-${day}`
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
    setShowForm(false)
    setSelectedClient('')
    setInvoiceItems([])
    setDiscountAmount(0)
    setNotes('')
    setIsConsumerFinal(false)
    setUseSimpleInvoice(false)
    setSimpleSubtotal(0)
    setSimpleDiscount(0)
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
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">point_of_sale</span>
            <span>Facturación Electrónica POS</span>
          </h1>
          <p className="page-subtitle">Emisión inmediata de facturas de venta y comprobantes SRI</p>
        </div>

        {user?.role !== 'Vendedor' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary"
            >
              <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
              <span>{showForm ? 'Cerrar Formulario' : 'Nueva Factura'}</span>
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="error-message flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* Modern POS Billing Interface Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client & Product Selection Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-extrabold m-0 text-[var(--text-primary)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--secondary)]">person_search</span>
                <span>Datos del Cliente</span>
              </h3>
              <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-[var(--accent-orange)] transition">
                <input
                  type="checkbox"
                  checked={isConsumerFinal}
                  onChange={(e) => {
                    setIsConsumerFinal(e.target.checked)
                    if (e.target.checked) setSelectedClient('')
                  }}
                  className="w-4 h-4 accent-[var(--accent-orange)] cursor-pointer"
                />
                <span className="text-xs font-bold text-[var(--accent-orange-light)]">Consumidor Final</span>
              </label>
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
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-extrabold m-0 text-[var(--text-primary)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--accent-orange)]">inventory_2</span>
                <span>Catálogo de Productos y Código de Barras</span>
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={useSimpleInvoice}
                  onChange={(e) => {
                    setUseSimpleInvoice(e.target.checked)
                    if (e.target.checked) setInvoiceItems([])
                  }}
                  className="w-4 h-4 accent-[var(--accent-orange)]"
                />
                <span>Monto Global (Factura Simple)</span>
              </label>
            </div>

            {!useSimpleInvoice ? (
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label>Escanear</label>
                  <div className="relative">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeSearch}
                      onChange={(e) => {
                        const query = e.target.value
                        setBarcodeSearch(query)
                        
                        // Si encuentra por código de barras, lo agrega automáticamente
                        const productByBarcode = products.find(p => p.barcode === query)
                        if (productByBarcode) {
                          handleProductSelect({ target: { value: productByBarcode.id.toString() } })
                          setBarcodeSearch('')
                          // Devuelve el foco al input
                          setTimeout(() => barcodeInputRef.current?.focus(), 0)
                        }
                      }}
                      className="pl-14 pr-4 w-full"
                      autoFocus
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)]">qr_code_scanner</span>
                  </div>
                </div>
                
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBarcodeScanner(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center gap-2 h-12"
                    title="Escanear código con cámara o lector"
                  >
                    <span className="material-symbols-outlined">qr_code_scanner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProductCatalog(true)}
                    className="px-6 py-2 bg-[var(--accent-orange)] hover:bg-orange-600 text-white font-bold rounded-xl transition flex items-center gap-2 h-12"
                  >
                    <span className="material-symbols-outlined">store</span>
                    <span>Catálogo</span>
                  </button>
                </div>
              </div>
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

          {/* Product Catalog Modal */}
          {showProductCatalog && (() => {
            // Filtrar productos
            const filteredProducts = products.filter(p =>
              (p.name && p.name.toLowerCase().includes(catalogSearchQuery.toLowerCase())) ||
              (p.barcode && p.barcode.includes(catalogSearchQuery))
            )
            
            // Calcular paginación
            const totalPages = Math.ceil(filteredProducts.length / catalogPageSize)
            const startIndex = (catalogPage - 1) * catalogPageSize
            const paginatedProducts = filteredProducts.slice(startIndex, startIndex + catalogPageSize)
            
            return (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-[var(--bg-secondary)] rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-auto border border-[var(--border-color)] flex flex-col">
                  {/* Header */}
                  <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
                        <span className="material-symbols-outlined text-[var(--accent-orange)]">store</span>
                        Catálogo de Productos ({filteredProducts.length})
                      </h2>
                      <button
                        onClick={() => {
                          setShowProductCatalog(false)
                          setCatalogSearchQuery('')
                          setCatalogPage(1)
                        }}
                        className="text-[var(--text-tertiary)] hover:text-white transition"
                      >
                        <span className="material-symbols-outlined text-2xl">close</span>
                      </button>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={catalogSearchQuery}
                        onChange={(e) => {
                          setCatalogSearchQuery(e.target.value)
                          setCatalogPage(1) // Reset a página 1
                        }}
                        className="pl-14 pr-4 w-full"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)]">search</span>
                    </div>
                  </div>

                  {/* Product List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]">
                    {filteredProducts.length === 0 ? (
                      <p className="text-center text-[var(--text-tertiary)] py-12">No se encontraron productos</p>
                    ) : paginatedProducts.length === 0 ? (
                      <p className="text-center text-[var(--text-tertiary)] py-12">No hay productos en esta página</p>
                    ) : (
                      paginatedProducts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            handleProductSelect({ target: { value: p.id.toString() } })
                            setShowProductCatalog(false)
                            setCatalogSearchQuery('')
                            setCatalogPage(1)
                            // Devuelve el foco al input de escaneo
                            setTimeout(() => barcodeInputRef.current?.focus(), 0)
                          }}
                          className="w-full text-left p-5 hover:bg-[var(--bg-primary)] transition flex items-center justify-between gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm truncate">{p.name}</p>
                            <p className="text-xs text-[var(--text-tertiary)] truncate">Código: {p.barcode || 'N/A'}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-[var(--accent-orange)] text-base">${p.price?.toFixed(2)}</p>
                            <p className="text-xs text-[var(--text-secondary)]">Stock: {p.stock || '0'}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {filteredProducts.length > 0 && totalPages > 1 && (
                    <div className="sticky bottom-0 bg-[var(--bg-primary)] border-t border-[var(--border-color)] p-5 flex items-center justify-between gap-4">
                      <p className="text-xs text-[var(--text-secondary)]">
                        Mostrando {startIndex + 1}-{Math.min(startIndex + catalogPageSize, filteredProducts.length)} de {filteredProducts.length}
                      </p>
                      <div className="flex gap-3 items-center">
                        <button
                          onClick={() => setCatalogPage(Math.max(1, catalogPage - 1))}
                          disabled={catalogPage === 1}
                          className="p-2 bg-[var(--bg-secondary)] hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
                          title="Página anterior"
                        >
                          <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        <span className="px-4 py-2 text-white text-sm font-bold min-w-max">
                          {catalogPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCatalogPage(Math.min(totalPages, catalogPage + 1))}
                          disabled={catalogPage === totalPages}
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
                      <button
                        onClick={() => {
                          setShowClientModal(false)
                          setClientModalSearchQuery('')
                          setClientModalPage(1)
                        }}
                        className="text-[var(--text-tertiary)] hover:text-white transition"
                      >
                        <span className="material-symbols-outlined text-2xl">close</span>
                      </button>
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

                  {/* Client List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]">
                    {filteredClientsModal.length === 0 ? (
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
              <table className="custom-table">
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
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-[var(--text-tertiary)]">
                        <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">shopping_cart</span>
                        <span>No has agregado productos a la factura aún</span>
                      </td>
                    </tr>
                  ) : (
                    invoiceItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="font-bold text-white">{item.product_name}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateInvoiceItemQuantity(idx, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="font-bold font-mono text-sm w-6 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateInvoiceItemQuantity(idx, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="text-right font-mono">${item.unit_price?.toFixed(2)}</td>
                        <td className="text-right font-mono font-bold text-[var(--accent-orange-light)]">
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => removeInvoiceItem(idx)}
                            className="text-red-400 hover:text-red-300 p-1"
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
        <div className="space-y-6">
          <div className="card bg-gradient-to-b from-[#182030] to-[#121721] border border-white/10">
            <h3 className="text-lg font-extrabold m-0 mb-4 pb-3 border-b border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-between">
              <span>Resumen de Cobro</span>
              <span className="material-symbols-outlined text-[var(--accent-orange)]">receipt_long</span>
            </h3>

            <div className="space-y-3 font-mono text-sm">
              <div className="form-group font-sans mb-4">
                <label htmlFor="payment-method">Método de pago</label>
                <select id="payment-method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal Neto:</span>
                <span className="font-bold text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Descuento Aplicado:</span>
                <span className="font-bold text-white">
                  ${(useSimpleInvoice ? parseFloat(simpleDiscount) || 0 : parseFloat(discountAmount) || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Impuesto IVA (15%):</span>
                <span className="font-bold text-emerald-400">$0.00</span>
              </div>

              <div className="pt-4 mt-2 border-t-2 border-[var(--accent-orange)] flex justify-between items-baseline">
                <span className="text-base font-bold text-white font-sans uppercase">TOTAL FINAL:</span>
                <span className="text-3xl font-extrabold text-[var(--accent-orange)]">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleCreateInvoice}
                disabled={(!useSimpleInvoice && invoiceItems.length === 0) || (!selectedClient && !isConsumerFinal)}
                className="btn-primary w-full py-4 text-base shadow-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">check_circle</span>
                <span>Emitir Factura Electrónica</span>
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary w-full py-2.5 text-xs text-[var(--text-tertiary)] hover:text-white"
              >
                Limpiar Formulario
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  )
}
