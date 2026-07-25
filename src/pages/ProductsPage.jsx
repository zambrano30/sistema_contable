import { useEffect, useState } from 'react'
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../services/productsService'
import { BarcodeScanner } from '../components/BarcodeScanner'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    sku: '',
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    const result = await getAllProducts()

    if (result.ok) {
      setProducts(result.data || [])
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      sku: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleBarcodeScanned = (barcode) => {
    setFormData({ ...formData, sku: barcode })
    setShowScanner(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity) || 0,
      sku: formData.sku,
    }

    let result

    if (editingId) {
      result = await updateProduct(editingId, productData)
    } else {
      result = await createProduct(productData)
    }

    if (result.ok) {
      await loadProducts()
      resetForm()
    } else {
      setError(result.error)
    }
  }

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price ? product.price.toString() : '0',
      quantity: product.quantity ? product.quantity.toString() : '0',
      sku: product.sku || '',
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto del catálogo?')) {
      const result = await deleteProduct(id)

      if (result.ok) {
        await loadProducts()
      } else {
        setError(result.error)
      }
    }
  }

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <span>Catálogo de Productos</span>
          </h1>
        </div>

        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          className="btn-primary"
        >
          <span className="material-symbols-outlined">add</span>
          <span>Nuevo Producto</span>
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="scanner-overlay">
          <div className="card w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] m-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--accent-orange)]">qr_code_scanner</span>
                <span>Escanear Código Barcode</span>
              </h3>
              <button 
                className="bg-none border-none text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                onClick={() => setShowScanner(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <BarcodeScanner
              onScan={handleBarcodeScanned}
              onClose={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}

      {/* Form Card */}
      {showForm && (
        <div className="card bg-[var(--bg-secondary)] border border-[var(--accent-orange)] p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)] m-0 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--accent-orange)]">edit_note</span>
              <span>{editingId ? 'Editar Producto' : 'Crear Nuevo Producto'}</span>
            </h2>
            <button 
              className="bg-none border-none text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
              onClick={resetForm}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label>Nombre del Producto *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Impresora Térmica POS"
                  required
                />
              </div>

              <div className="form-group">
                <label>Código SKU / Barcode</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="sku" 
                    value={formData.sku} 
                    onChange={handleInputChange} 
                    placeholder="779000112233"
                    className="flex-1 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="btn-secondary whitespace-nowrap"
                    title="Escanear con cámara"
                  >
                    <span className="material-symbols-outlined">qr_code_scanner</span>
                    <span>Escanear</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange}
                placeholder="Detalles técnicos o especificaciones del producto..."
                rows="2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label>Precio de Venta ($) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  placeholder="0.00"
                  className="font-mono"
                  required
                />
              </div>

              <div className="form-group">
                <label>Stock Disponible</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                <span className="material-symbols-outlined">save</span>
                <span>{editingId ? 'Guardar Cambios' : 'Crear Producto'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="card flex items-center gap-3">
        <span className="material-symbols-outlined text-[var(--text-tertiary)]">search</span>
        <input 
          type="text" 
          placeholder="Buscar producto por nombre o código SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-[var(--text-primary)]"
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-12 text-center text-[var(--text-tertiary)]">
          <p>Cargando productos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card text-center py-12 text-[var(--text-tertiary)]">
          <span className="material-symbols-outlined text-5xl opacity-30 mb-2">inventory_2</span>
          <p className="m-0">No se encontraron productos en el inventario.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bento-card hover:border-[var(--accent-orange)] transition-colors">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-bold m-0 text-[var(--text-primary)]">{product.name}</h3>
                  <span className="badge badge-orange font-mono">
                    SKU: {product.sku || 'N/A'}
                  </span>
                </div>
                {product.description && (
                  <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--border-light)] mt-3">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-[0.7rem] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">Precio</span>
                    <p className="text-lg font-bold font-mono text-[var(--accent-orange-light)] m-0">
                      ${product.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[0.7rem] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">Stock</span>
                    <p className="text-sm font-bold font-mono text-[var(--text-primary)] m-0">
                      {product.quantity ?? 0} un.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(product)} 
                    className="btn-secondary flex-1 justify-center btn-small"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Editar</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)} 
                    className="btn-danger btn-small"
                    title="Eliminar producto"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
