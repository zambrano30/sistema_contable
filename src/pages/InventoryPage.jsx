import { useEffect, useState } from 'react'
import { getAllInventoryMovements, createInventoryMovement, getLowStockProducts, getInventorySummary } from '../services/inventoryService'
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../services/productsService'
import { useAuth } from '../contexts/AuthContext'

export default function InventoryPage() {
  const { user } = useAuth()
  const isDemo = !!localStorage.getItem('demo_user')
  
  // Tabs
  const [activeTab, setActiveTab] = useState('products') // 'products' o 'movements'
  
  // Movements state
  const [movements, setMovements] = useState([])
  const [products, setProducts] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockCount: 0,
    productCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMovementForm, setShowMovementForm] = useState(false)
  
  // Movement form state
  const [selectedProduct, setSelectedProduct] = useState('')
  const [movementType, setMovementType] = useState('IN')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

  // Products form state
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [validationError, setValidationError] = useState('')
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: '',
    purchase_price: '',
    quantity: '',
    minimum_quantity: '10',
    sku: '',
    is_taxable: true,
    tax_percentage: '19',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    if (isDemo) {
      // Cargar desde localStorage en modo demo
      const demoMovements = JSON.parse(localStorage.getItem('demo_movements') || '[]')
      const demoProducts = JSON.parse(localStorage.getItem('demo_products') || '[]')
      
      setMovements(demoMovements)
      setProducts(demoProducts)
      
      // Calcular estadísticas
      const totalItems = demoProducts.reduce((sum, p) => sum + (p.quantity || 0), 0)
      const totalValue = demoProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0)
      const lowStock = demoProducts.filter(p => (p.quantity || 0) < (p.minimum_quantity || 10))
      
      setSummary({
        totalItems,
        totalValue,
        lowStockCount: lowStock.length,
        productCount: demoProducts.length
      })
      setLowStockProducts(lowStock)
    } else {
      // Cargar desde Supabase
      const [movementsRes, productsRes, lowStockRes, summaryRes] = await Promise.all([
        getAllInventoryMovements(),
        getAllProducts(),
        getLowStockProducts(),
        getInventorySummary(),
      ])

      if (movementsRes.ok) setMovements(movementsRes.data)
      if (productsRes.ok) setProducts(productsRes.data)
      if (lowStockRes.ok) setLowStockProducts(lowStockRes.data)
      if (summaryRes.ok) setSummary(summaryRes.data)
    }

    setLoading(false)
  }

  // Movement handlers
  const handleCreateMovement = async (e) => {
    e.preventDefault()

    if (!selectedProduct || !quantity) {
      setError('Selecciona producto y cantidad')
      return
    }

    const product = products.find(p => p.id === parseInt(selectedProduct))
    if (!product) {
      setError('Producto no encontrado')
      return
    }

    if (isDemo) {
      // Guardar en localStorage
      const demoMovements = JSON.parse(localStorage.getItem('demo_movements') || '[]')
      demoMovements.push({
        id: Date.now(),
        product_id: parseInt(selectedProduct),
        movement_type: movementType,
        quantity: parseInt(quantity),
        notes,
        created_at: new Date().toISOString()
      })
      localStorage.setItem('demo_movements', JSON.stringify(demoMovements))
      
      await loadData()
      resetMovementForm()
      setError('')
      alert('✅ Movimiento registrado en modo demo')
    } else {
      const movementData = {
        product_id: parseInt(selectedProduct),
        movement_type: movementType,
        quantity: parseInt(quantity),
        notes,
      }

      const result = await createInventoryMovement(movementData)

      if (result.ok) {
        await loadData()
        resetMovementForm()
        setError('')
      } else {
        setError(result.error)
      }
    }
  }

  const resetMovementForm = () => {
    setShowMovementForm(false)
    setSelectedProduct('')
    setMovementType('IN')
    setQuantity('')
    setNotes('')
  }

  // Product handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProductFormData({ ...productFormData, [name]: value })
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    
    // Validación
    if (!productFormData.name.trim()) {
      setValidationError('El nombre del producto es requerido')
      return
    }
    
    if (!productFormData.price || parseFloat(productFormData.price) <= 0) {
      setValidationError('El precio de venta debe ser mayor a 0')
      return
    }

    setValidationError('')

    const productData = {
      name: productFormData.name.trim(),
      description: productFormData.description.trim(),
      price: parseFloat(productFormData.price),
      purchase_price: parseFloat(productFormData.purchase_price) || parseFloat(productFormData.price),
      quantity: parseInt(productFormData.quantity) || 0,
      minimum_quantity: parseInt(productFormData.minimum_quantity) || 10,
      sku: productFormData.sku.trim(),
      is_taxable: productFormData.is_taxable,
      tax_percentage: parseFloat(productFormData.tax_percentage) || 19,
    }

    if (isDemo) {
      const demoProducts = JSON.parse(localStorage.getItem('demo_products') || '[]')
      
      if (editingProductId) {
        const index = demoProducts.findIndex(p => p.id === editingProductId)
        if (index >= 0) {
          demoProducts[index] = { ...demoProducts[index], ...productData }
        }
      } else {
        const newProduct = {
          id: Date.now(),
          ...productData
        }
        demoProducts.push(newProduct)
      }
      
      localStorage.setItem('demo_products', JSON.stringify(demoProducts))
      await loadData()
      resetProductForm()
      alert('✅ Producto guardado en modo demo')
    } else {
      let result

      if (editingProductId) {
        result = await updateProduct(editingProductId, productData)
      } else {
        result = await createProduct(productData)
      }

      if (result.ok) {
        await loadData()
        resetProductForm()
      } else {
        setError(result.error)
      }
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Confirmar eliminación del producto?')) return

    if (isDemo) {
      const demoProducts = JSON.parse(localStorage.getItem('demo_products') || '[]')
      const filtered = demoProducts.filter(p => p.id !== id)
      localStorage.setItem('demo_products', JSON.stringify(filtered))
      await loadData()
    } else {
      const result = await deleteProduct(id)
      if (result.ok) {
        await loadData()
      } else {
        setError(result.error)
      }
    }
  }

  const handleEditProduct = (product) => {
    setProductFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      purchase_price: product.purchase_price || '',
      quantity: product.quantity || '',
      minimum_quantity: product.minimum_quantity || '10',
      sku: product.sku || '',
      is_taxable: product.is_taxable !== false,
      tax_percentage: product.tax_percentage || '19',
    })
    setEditingProductId(product.id)
    setShowProductForm(true)
  }

  const resetProductForm = () => {
    setProductFormData({
      name: '',
      description: '',
      price: '',
      purchase_price: '',
      quantity: '',
      minimum_quantity: '10',
      sku: '',
      is_taxable: true,
      tax_percentage: '19',
    })
    setValidationError('')
    setEditingProductId(null)
    setShowProductForm(false)
  }

  const getMovementIcon = (type) => {
    switch (type) {
      case 'IN':
        return 'add_circle'
      case 'OUT':
        return 'remove_circle'
      case 'RETURN':
        return 'undo'
      case 'ADJUSTMENT':
        return 'edit'
      default:
        return 'inventory_2'
    }
  }

  const getMovementColor = (type) => {
    switch (type) {
      case 'IN':
        return 'text-green-500'
      case 'OUT':
        return 'text-red-500'
      case 'RETURN':
        return 'text-blue-500'
      case 'ADJUSTMENT':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) return <div className="page-container"><p>Cargando...</p></div>

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div>
          <span className="text-[0.75rem] font-bold text-[var(--accent-orange-light)] uppercase tracking-wider">
            Lumina Ledger • Inventario
          </span>
          <h1 className="mt-1">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">inventory_2</span>
            <span>Gestión de Inventario</span>
          </h1>
        </div>

        <button
          onClick={() => activeTab === 'products' ? setShowProductForm(!showProductForm) : setShowMovementForm(!showMovementForm)}
          className="btn-primary"
        >
          <span className="material-symbols-outlined">add</span>
          <span>{activeTab === 'products' ? 'Nuevo Producto' : 'Registrar Movimiento'}</span>
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}
      {validationError && <div className="error-message">{validationError}</div>}

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6">
          <p className="text-[var(--text-secondary)] text-sm mb-2">Total Items</p>
          <h3 className="text-2xl font-bold text-[var(--accent-orange)]">{summary.totalItems || 0}</h3>
        </div>
        <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6">
          <p className="text-[var(--text-secondary)] text-sm mb-2">Valor Total</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">
            ${summary.totalValue?.toFixed(2) || '0.00'}
          </h3>
        </div>
        <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6">
          <p className="text-[var(--text-secondary)] text-sm mb-2">Productos Bajo Stock</p>
          <h3 className="text-2xl font-bold text-red-500">{summary.lowStockCount || 0}</h3>
        </div>
        <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6">
          <p className="text-[var(--text-secondary)] text-sm mb-2">Total Productos</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">{summary.productCount || 0}</h3>
        </div>
      </section>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="card bg-red-900 bg-opacity-20 border border-red-700 p-6 mb-6">
          <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">warning</span>
            Productos Bajo Stock
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {lowStockProducts.slice(0, 3).map((product) => (
              <div key={product.id} className="bg-[var(--bg-primary)] p-3 rounded border border-red-700">
                <p className="font-medium text-[var(--text-primary)]">{product.name}</p>
                <p className="text-sm text-red-400">
                  {product.quantity_on_hand || product.quantity || 0} / {product.minimum_quantity} mín
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-[var(--border-color)]">
        <button
          onClick={() => {
            setActiveTab('products')
            setShowMovementForm(false)
          }}
          className={`px-4 py-3 font-medium transition ${
            activeTab === 'products'
              ? 'text-[var(--accent-orange)] border-b-2 border-[var(--accent-orange)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span className="material-symbols-outlined inline mr-2 text-lg">inventory_2</span>
          Productos
        </button>
        <button
          onClick={() => {
            setActiveTab('movements')
            setShowProductForm(false)
          }}
          className={`px-4 py-3 font-medium transition ${
            activeTab === 'movements'
              ? 'text-[var(--accent-orange)] border-b-2 border-[var(--accent-orange)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span className="material-symbols-outlined inline mr-2 text-lg">history</span>
          Movimientos
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <>
          {showProductForm && (
            <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                {editingProductId ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={productFormData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={productFormData.sku}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Precio Venta
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      value={productFormData.price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Precio Compra
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="purchase_price"
                      value={productFormData.purchase_price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={productFormData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Cantidad Mínima
                    </label>
                    <input
                      type="number"
                      name="minimum_quantity"
                      value={productFormData.minimum_quantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={productFormData.description}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingProductId ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar producto por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)]"
            />
          </div>

          {/* Products List */}
          <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-[var(--text-secondary)] py-8">Sin productos registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-[var(--text-secondary)] uppercase">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-[var(--text-secondary)] uppercase">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-[var(--text-secondary)] uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                        <td className="px-6 py-4 text-[var(--text-primary)]">{product.name}</td>
                        <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">{product.sku || '-'}</td>
                        <td className="px-6 py-4 text-right font-medium">${product.price?.toFixed(2) || '0.00'}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={product.quantity < product.minimum_quantity ? 'text-red-500 font-medium' : ''}>
                            {product.quantity || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-[var(--accent-orange)] hover:text-[var(--accent-orange-light)] mr-3"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-500 hover:text-red-600"
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* MOVEMENTS TAB */}
      {activeTab === 'movements' && (
        <>
          {/* Movement Form */}
          {showMovementForm && (
            <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--accent-orange)]">add_circle</span>
                Registrar Movimiento
              </h3>

              <form onSubmit={handleCreateMovement} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Product */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Producto
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                    >
                      <option value="">-- Selecciona --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.quantity || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Tipo de Movimiento
                    </label>
                    <select
                      value={movementType}
                      onChange={(e) => setMovementType(e.target.value)}
                      className="w-full px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                    >
                      <option value="IN">Entrada (+)</option>
                      <option value="OUT">Salida (-)</option>
                      <option value="RETURN">Devolución (+)</option>
                      <option value="ADJUSTMENT">Ajuste</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
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
                    onClick={resetMovementForm}
                    className="px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Registrar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Movements List */}
          <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 p-6 pb-0">
              <span className="material-symbols-outlined text-[var(--accent-orange)]">history</span>
              Historial de Movimientos
            </h3>

            {movements.length === 0 ? (
              <p className="text-center text-[var(--text-secondary)] py-8">Sin movimientos registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-[var(--text-secondary)] uppercase">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => {
                      const product = products.find(p => p.id === movement.product_id)
                      return (
                        <tr key={movement.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                          <td className="px-6 py-4">
                            <span className={`material-symbols-outlined ${getMovementColor(movement.movement_type)}`}>
                              {getMovementIcon(movement.movement_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[var(--text-primary)]">{product?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-right font-medium">{movement.quantity}</td>
                          <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">
                            {new Date(movement.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">{movement.notes || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
