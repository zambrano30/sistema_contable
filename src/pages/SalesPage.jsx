import { useState, useEffect } from 'react';
import { getAllProducts } from '../services/productsService';
import { BarcodeScanner } from '../components/BarcodeScanner';

export default function SalesPage() {
  const [showScanner, setShowScanner] = useState(true);
  const [saleItems, setSaleItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { ok, data, error: err } = await getAllProducts();
      if (ok) {
        setProducts(data || []);
      } else {
        setError(err || 'Error al cargar productos');
      }
    } catch (err) {
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (decodedText) => {
    // Find product by SKU
    const product = products.find(p => p.sku === decodedText);
    
    if (!product) {
      setError(`Producto con SKU ${decodedText} no encontrado`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Check if product already in sale items
    const existingItem = saleItems.find(item => item.id === product.id);
    
    if (existingItem) {
      // Increment quantity
      setSaleItems(saleItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: item.price * (item.quantity + 1) }
          : item
      ));
    } else {
      // Add new item
      setSaleItems([
        ...saleItems,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: 1,
          subtotal: product.price
        }
      ]);
    }

    setShowScanner(false);
  };

  const handleRemoveItem = (productId) => {
    setSaleItems(saleItems.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setSaleItems(saleItems.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
        : item
    ));
  };

  const handleClearSale = () => {
    if (confirm('¿Limpiar toda la lista de venta?')) {
      setSaleItems([]);
    }
  };

  const handleConfirmSale = () => {
    if (saleItems.length === 0) {
      setError('Agrega productos a la venta');
      return;
    }
    // TODO: Save sale to database
    alert(`Venta registrada: ${saleItems.length} productos, Total: $${getTotal().toFixed(2)}`);
    setSaleItems([]);
  };

  const getTotal = () => {
    return saleItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>💰 Ventas</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowScanner(true)}
        >
          📱 Escanear Producto
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showScanner && (
        <div className="scanner-overlay">
          <BarcodeScanner 
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      <div className="sales-content">
        {/* Sales Items Table */}
        <div className="sales-section">
          <h2>📦 Productos en Venta</h2>
          
          {saleItems.length === 0 ? (
            <div className="empty-message">
              <p>No hay productos en la venta. Escanea un producto para comenzar.</p>
            </div>
          ) : (
            <div className="sales-table-wrapper">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {saleItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td className="sku-cell">{item.sku}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>
                        <input 
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="quantity-input"
                        />
                      </td>
                      <td className="subtotal-cell">${item.subtotal.toFixed(2)}</td>
                      <td>
                        <button 
                          className="btn-danger btn-small"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sales Summary */}
        {saleItems.length > 0 && (
          <div className="sales-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${getTotal().toFixed(2)}</span>
            </div>
            <div className="summary-row total-row">
              <span>TOTAL:</span>
              <span>${getTotal().toFixed(2)}</span>
            </div>
            <div className="summary-row items-row">
              <span>Productos:</span>
              <span>{saleItems.length} item(s) ({saleItems.reduce((sum, item) => sum + item.quantity, 0)} unidades)</span>
            </div>

            <div className="sales-actions">
              <button 
                className="btn-primary btn-large"
                onClick={handleConfirmSale}
              >
                ✓ Confirmar Venta
              </button>
              <button 
                className="btn-secondary btn-large"
                onClick={handleClearSale}
              >
                🔄 Limpiar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
