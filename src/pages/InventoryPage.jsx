import { useEffect, useState } from 'react'
import { getAllInventoryMovements, createInventoryMovement, getLowStockProducts, getInventorySummary } from '../services/inventoryService'
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../services/productsService'
import { useAuth } from '../contexts/AuthContext'

export default function InventoryPage() {
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState('products')
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
  
  const [selectedProduct, setSelectedProduct] = useState('')
  const [movementType, setMovementType] = useState('IN')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

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
    tax_percentage: '15',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
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

    setLoading(false)
  }

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

  const resetMovementForm = () => {
    setShowMovementForm(false)
    setSelectedProduct('')
    setMovementType('IN')
    setQuantity('')
    setNotes('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProductFormData({ ...productFormData, [name]: value })
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    
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
      tax_percentage: parseFloat(productFormData.tax_percentage) || 15,
    }

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

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Confirmar eliminación del producto?')) return

    const result = await deleteProduct(id)
    if (result.ok) {
      await loadData()
    } else {
      setError(result.error)
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
      tax_percentage: product.tax_percentage || '15',
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
      tax_percentage: '15',
    })
    setValidationError('')
    setEditingProductId(null)
    setShowProductForm(false)
  }

  const getMovementIcon = (type) => {
    switch (type) {
      case 'IN': return 'add_circle'
      case 'OUT': return 'remove_circle'
      case 'RETURN': return 'undo'
      case 'ADJUSTMENT': return 'tune'
      default: return 'inventory_2'
    }
  }

  const getMovementColor = (type) => {
    switch (type) {
      case 'IN': return 'text-emerald-400'
      case 'OUT': return 'text-red-400'
      case 'RETURN': return 'text-blue-400'
      case 'ADJUSTMENT': return 'text-amber-400'
      default: return 'text-slate-400'
    }
  }

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) return (
    <div className="page-container flex items-center justify-center py-20">
      <div className="text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--accent-orange)] animate-spin">sync</span>
        <p className="mt-2 text-[var(--text-secondary)] font-medium">Cargando datos de inventario...</p>
      </div>
    </div>
  )

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-2xl sm:text-3xl">warehouse</span>
            <span>Control de Inventarios</span>
          </h1>

        </div>
      </header>

      {error && (
        <div className="error-message flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <section className="bento-grid">
        <div className="bento-card">
          <span className="card-label">Unidades en Stock</span>
          <div className="card-value text-[var(--accent-orange-light)]">{summary.totalItems || 0}</div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Físico acumulado</p>
        </div>

        <div className="bento-card">
          <span className="card-label">Valoración Total</span>
          <div className="card-value text-emerald-400">
            ${summary.totalValue?.toFixed(2) || '0.00'}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Valor de venta estimado</p>
        </div>

        <div className="bento-card border-red-500/30 bg-red-500/5">
          <span className="card-label text-red-300">Alerta de Reabastecimiento</span>
          <div className="card-value text-red-400">{summary.lowStockCount || 0}</div>
          <p className="text-xs text-red-300 mt-2">Productos bajo mínimo</p>
        </div>

        <div className="bento-card">
          <span className="card-label">Variedad de Productos</span>
          <div className="card-value text-white">{summary.productCount || 0}</div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Ítems distintos</p>
        </div>
      </section>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="card border-red-500/40 bg-red-500/10">
          <h3 className="text-base font-extrabold text-red-400 m-0 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">warning</span>
            <span>Alertas de Stock Crítico ({lowStockProducts.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {lowStockProducts.slice(0, 8).map((product) => (
              <div key={product.id} className="p-3 rounded-xl bg-black/40 border border-red-500/30">
                <p className="font-bold text-white text-sm m-0">{product.name}</p>
                <p className="text-xs text-red-300 font-mono mt-1 m-0">
                  Quedan {product.quantity_on_hand || product.quantity || 0} / Mín. {product.minimum_quantity || 10}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 sm:gap-3 border-b border-[var(--border-color)] pb-1 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('products')
            setShowMovementForm(false)
          }}
          className={`px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-[var(--accent-orange)]/15 text-[var(--accent-orange-light)] border border-[var(--accent-orange)]/30'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base sm:text-lg">inventory_2</span>
          <span className="hidden sm:inline">Catálogo & Stock</span>
          <span className="sm:hidden">Productos</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('movements')
            setShowProductForm(false)
          }}
          className={`px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'movements'
              ? 'bg-[var(--accent-orange)]/15 text-[var(--accent-orange-light)] border border-[var(--accent-orange)]/30'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base sm:text-lg">history</span>
          <span className="hidden sm:inline">Kardex / Movimientos</span>
          <span className="sm:hidden">Movimientos</span>
        </button>
        <button
          onClick={() => activeTab === 'products' ? setShowProductForm(!showProductForm) : setShowMovementForm(!showMovementForm)}
          className="btn-primary text-xs sm:text-sm ml-auto"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="hidden sm:inline">{activeTab === 'products' ? 'Nuevo Producto' : 'Registrar Movimiento'}</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <>
          {showProductForm && (
            <div className="card">
              <h3 className="text-lg sm:text-xl font-extrabold text-white m-0 mb-4 pb-2 border-b border-[var(--border-color)]">
                {editingProductId ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Nombre del Producto *</label>
                    <input
                      type="text"
                      name="name"
                      value={productFormData.name}
                      onChange={handleInputChange}
                      placeholder=""
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Código SKU / Barcode</label>
                    <input
                      type="text"
                      name="sku"
                      value={productFormData.sku}
                      onChange={handleInputChange}
                      placeholder=""
                      className="font-mono"
                    />
                  </div>

                  <div className="form-group">
                    <label>Precio Venta ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      value={productFormData.price}
                      onChange={handleInputChange}
                      className="font-mono"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock Inicial</label>
                    <input
                      type="number"
                      name="quantity"
                      value={productFormData.quantity}
                      onChange={handleInputChange}
                      className="font-mono"
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock Mínimo</label>
                    <input
                      type="number"
                      name="minimum_quantity"
                      value={productFormData.minimum_quantity}
                      onChange={handleInputChange}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Guardar Producto
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card flex items-center gap-2 sm:gap-3">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-lg sm:text-xl flex-shrink-0">search</span>
            <input
              type="text"
              placeholder=""
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-white text-xs sm:text-sm"
            />
          </div>

          <div className="table-wrapper overflow-x-auto">
            <table className="custom-table w-full">
              <thead>
                <tr>
                  <th className="text-left px-2 text-xs sm:text-sm">Producto</th>
                  <th className="text-left px-2 text-xs sm:text-sm">SKU</th>
                  <th className="hidden md:table-cell text-right px-2 text-xs sm:text-sm">Precio</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="font-bold text-white px-2 py-3 text-xs sm:text-sm truncate">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="hover:text-[var(--accent-orange-light)] transition-colors text-left w-full"
                      >
                        {product.name}
                      </button>
                    </td>
                    <td className="sku-cell px-2 py-3 text-xs sm:text-sm font-mono">{product.sku || 'SKU-000'}</td>
                    <td className="hidden md:table-cell text-right font-mono font-bold text-[var(--accent-orange-light)] px-2 py-3 text-xs sm:text-sm">
                      ${product.price?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MOVEMENTS TAB */}
      {activeTab === 'movements' && (
        <>
          {showMovementForm && (
            <div className="card">
              <h3 className="text-lg sm:text-xl font-extrabold text-white m-0 mb-4 pb-2 border-b border-[var(--border-color)]">
                Registrar Movimiento de Kardex
              </h3>

              <form onSubmit={handleCreateMovement} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label>Producto</label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                    >
                      <option value="">-- Selecciona --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.quantity || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tipo de Entrada / Salida</label>
                    <select
                      value={movementType}
                      onChange={(e) => setMovementType(e.target.value)}
                    >
                      <option value="IN">Entrada (+)</option>
                      <option value="OUT">Salida (-)</option>
                      <option value="RETURN">Devolución (+)</option>
                      <option value="ADJUSTMENT">Ajuste de Stock</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Observaciones / Motivo</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    placeholder=""
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={resetMovementForm}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Guardar Movimiento
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Producto</th>
                  <th className="text-right">Cantidad</th>
                  <th>Fecha</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-[var(--text-tertiary)]">Sin movimientos de kardex</td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const product = products.find(p => p.id === m.product_id)
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined ${getMovementColor(m.movement_type)}`}>
                              {getMovementIcon(m.movement_type)}
                            </span>
                            <span className="font-bold text-xs uppercase">{m.movement_type}</span>
                          </div>
                        </td>
                        <td className="font-bold text-white">{product?.name || 'Producto #' + m.product_id}</td>
                        <td className="text-right font-mono font-bold text-white">{m.quantity}</td>
                        <td className="text-xs text-[var(--text-secondary)]">
                          {new Date(m.created_at).toLocaleDateString()}
                        </td>
                        <td className="text-xs text-[var(--text-secondary)]">{m.notes || '-'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  )
}
