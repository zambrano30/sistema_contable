import { useEffect, useState } from 'react'
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../services/productsService'
import { useAuth } from '../contexts/AuthContext'

export default function ProductsPage() {
  const { user } = useAuth()
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [validationError, setValidationError] = useState('')
  const [formData, setFormData] = useState({
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
      purchase_price: '',
      quantity: '',
      minimum_quantity: '10',
      sku: '',
      is_taxable: true,
      tax_percentage: '15',
    })
    setValidationError('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setValidationError('El nombre del producto es requerido')
      return
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setValidationError('El precio de venta debe ser mayor a 0')
      return
    }

    setValidationError('')

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      purchase_price: parseFloat(formData.purchase_price) || parseFloat(formData.price),
      quantity: parseInt(formData.quantity) || 0,
      minimum_quantity: parseInt(formData.minimum_quantity) || 10,
      sku: formData.sku.trim(),
      is_taxable: formData.is_taxable,
      tax_percentage: parseFloat(formData.tax_percentage) || 15,
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
      name: product.name || '',
      description: product.description || '',
      price: product.price ? product.price.toString() : '0',
      purchase_price: product.purchase_price ? product.purchase_price.toString() : product.price ? product.price.toString() : '0',
      quantity: product.quantity ? product.quantity.toString() : '0',
      minimum_quantity: product.minimum_quantity ? product.minimum_quantity.toString() : '10',
      sku: product.sku || '',
      is_taxable: product.is_taxable !== false,
      tax_percentage: product.tax_percentage ? product.tax_percentage.toString() : '15',
    })
    setValidationError('')
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
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-2xl sm:text-3xl">inventory_2</span>
            <span>Catálogo de Productos</span>
          </h1>

        </div>

        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          className="btn-primary text-xs sm:text-sm"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="hidden sm:inline">Nuevo Producto</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </header>

      {error && (
        <div className="error-message flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) resetForm(); }}>
          <div className="modal-content">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-color)]">
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] m-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--accent-orange)] text-xl sm:text-2xl">edit_note</span>
                <span>{editingId ? 'Editar Producto' : 'Crear Producto'}</span>
              </h2>
              <button 
                className="text-[var(--text-tertiary)] hover:text-white bg-none border-none cursor-pointer"
                onClick={resetForm}
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {validationError && (
                <div className="error-message flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  <span>{validationError}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Nombre del Producto *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
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
                    value={formData.sku} 
                    onChange={handleInputChange} 
                    placeholder=""
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción del Producto</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange}
                  placeholder=""
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Precio de Venta ($) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    placeholder=""
                    className="font-mono font-bold"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Precio de Compra ($)</label>
                  <input
                    type="number"
                    name="purchase_price"
                    value={formData.purchase_price}
                    onChange={handleInputChange}
                    step="0.01"
                    placeholder=""
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Stock Disponible</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder=""
                    className="font-mono"
                  />
                </div>

                <div className="form-group">
                  <label>Stock Mínimo Alerta</label>
                  <input
                    type="number"
                    name="minimum_quantity"
                    value={formData.minimum_quantity}
                    onChange={handleInputChange}
                    placeholder=""
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border-color)]">
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
        </div>
      )}

      {/* Search Bar */}
      <div className="card flex items-center gap-2 sm:gap-3">
        <span className="material-symbols-outlined text-[var(--accent-orange)] text-lg sm:text-xl flex-shrink-0">search</span>
        <input 
          type="text" 
          placeholder=""
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] font-medium text-xs sm:text-sm"
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-12 text-center text-[var(--text-tertiary)]">
          <span className="material-symbols-outlined text-4xl animate-spin text-[var(--accent-orange)]">sync</span>
          <p className="mt-2 text-sm">Cargando productos del catálogo...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card text-center py-12 text-[var(--text-tertiary)]">
          <span className="material-symbols-outlined text-5xl opacity-30 mb-2">inventory_2</span>
          <p className="m-0 text-sm">No se encontraron productos en el inventario.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bento-card">
              <div>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="text-base font-extrabold m-0 text-white leading-tight">{product.name}</h3>
                  <span className="sku-cell whitespace-nowrap text-xs">
                    {product.sku || 'SKU-000'}
                  </span>
                </div>
                {product.description && (
                  <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--border-color)] mt-3">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-[0.7rem] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">Precio P.V.P</span>
                    <p className="text-xl font-extrabold font-mono text-[var(--accent-orange-light)] m-0">
                      ${product.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[0.7rem] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">Existencias</span>
                    <p className="text-sm font-bold font-mono text-white m-0">
                      {product.quantity ?? 0} unidades
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
