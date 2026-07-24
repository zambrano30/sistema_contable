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
      quantity: parseInt(formData.quantity),
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
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      sku: product.sku || '',
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      const result = await deleteProduct(id)

      if (result.ok) {
        await loadProducts()
      } else {
        setError(result.error)
      }
    }
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <h1>📦 Productos</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Nuevo Producto
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showForm && (
        <section className="form-section">
          <h2>{editingId ? 'Editar Producto' : 'Crear Producto'}</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Precio *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Cantidad</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>SKU</label>
                <div className="sku-input-group">
                  <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="btn-scan"
                    title="Escanear código de barras con cámara"
                  >
                    📱 Escanear
                  </button>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="products-grid">
        {loading ? (
          <p>Cargando productos...</p>
        ) : products.length === 0 ? (
          <p>No hay productos. Crea uno para empezar.</p>
        ) : (
          products.map((product) => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p className="product-sku">SKU: {product.sku}</p>
              <p className="product-description">{product.description}</p>
              <div className="product-info">
                <div>
                  <strong>Precio:</strong> ${product.price.toFixed(2)}
                </div>
                <div>
                  <strong>Stock:</strong> {product.quantity}
                </div>
              </div>
              <div className="product-actions">
                <button onClick={() => handleEdit(product)} className="btn-secondary">
                  Editar
                </button>
                <button onClick={() => handleDelete(product.id)} className="btn-danger">
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  )
}
