import { useState, useEffect } from 'react';
import { getAllProducts } from '../services/productsService';
import { BarcodeScanner } from '../components/BarcodeScanner';

export default function SalesPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [saleItems, setSaleItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

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

  const addProductToSale = (product) => {
    if (!product) return;
    const existingItem = saleItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setSaleItems(saleItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: item.price * (item.quantity + 1) }
          : item
      ));
    } else {
      setSaleItems([
        ...saleItems,
        {
          id: product.id,
          name: product.name,
          sku: product.sku || 'N/A',
          price: product.price || 0,
          quantity: 1,
          subtotal: product.price || 0
        }
      ]);
    }
  };

  const handleScan = (decodedText) => {
    const product = products.find(p => p.sku === decodedText);
    
    if (!product) {
      setError(`Producto con SKU ${decodedText} no encontrado`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    addProductToSale(product);
    setShowScanner(false);
  };

  const handleManualAdd = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (product) {
      addProductToSale(product);
      setSelectedProductId('');
    }
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
    alert(`Venta registrada con éxito: ${saleItems.length} productos, Total: $${getTotal().toFixed(2)}`);
    setSaleItems([]);
  };

  const getTotal = () => {
    return saleItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div>
          <span className="text-[0.75rem] font-bold text-[var(--accent-orange-light)] uppercase tracking-wider">
            FacturaPro • Terminal Punto de Venta
          </span>
          <h1 className="mt-1">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">receipt_long</span>
            <span>Registro de Ventas</span>
          </h1>
        </div>

        <button 
          className="btn-primary"
          onClick={() => setShowScanner(true)}
        >
          <span className="material-symbols-outlined">qr_code_scanner</span>
          <span>Escanear Código Barcode</span>
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
                <span>Escanear Producto</span>
              </h3>
              <button 
                className="bg-none border-none text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                onClick={() => setShowScanner(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <BarcodeScanner 
              onScan={handleScan}
              onClose={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}

      {/* Manual Product Selection Bar */}
      <div className="card flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <select 
            value={selectedProductId} 
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] p-3 rounded-xl outline-none"
          >
            <option value="">-- Seleccionar Producto del Catálogo --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) - ${p.price?.toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        <button 
          className="btn-secondary"
          onClick={handleManualAdd}
          disabled={!selectedProductId}
        >
          <span className="material-symbols-outlined">add</span>
          <span>Agregar a Venta</span>
        </button>
      </div>

      {/* Sales Items Table Container */}
      <div className="card">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 m-0">
          <span className="material-symbols-outlined text-[var(--accent-orange)]">shopping_cart</span>
          <span>Productos en la Venta Actual</span>
        </h2>

        {saleItems.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-tertiary)]">
            <span className="material-symbols-outlined text-5xl opacity-40 mb-2">shopping_bag</span>
            <p className="m-0 text-sm">No hay productos en la venta actual.</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Escanea un código de barras o selecciona un producto arriba.</p>
          </div>
        ) : (
          <div className="table-wrapper mt-3">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Precio Unit.</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {saleItems.map(item => (
                  <tr key={item.id}>
                    <td className="font-semibold">{item.name}</td>
                    <td className="sku-cell font-mono">{item.sku}</td>
                    <td className="font-mono">${item.price.toFixed(2)}</td>
                    <td>
                      <input 
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-20 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] px-2 py-1 rounded-lg font-mono text-center"
                      />
                    </td>
                    <td className="font-bold font-mono text-[var(--accent-orange-light)]">
                      ${item.subtotal.toFixed(2)}
                    </td>
                    <td className="text-right">
                      <button 
                        className="btn-danger btn-small"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Eliminar ítem"
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

      {/* Sales Total Summary Box */}
      {saleItems.length > 0 && (
        <div className="card bg-[var(--bg-tertiary)] border border-[var(--accent-orange)] p-6">
          <div className="flex flex-col gap-3 max-w-md ml-auto">
            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
              <span>Items Totales:</span>
              <span className="font-bold text-[var(--text-primary)]">
                {saleItems.length} ({saleItems.reduce((sum, item) => sum + item.quantity, 0)} unidades)
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xl font-bold border-t border-[var(--border-light)] pt-3 text-[var(--text-primary)]">
              <span>TOTAL FACTURA:</span>
              <span className="font-mono text-2xl text-[var(--accent-orange-light)]">
                ${getTotal().toFixed(2)}
              </span>
            </div>

            <div className="flex gap-3 mt-4">
              <button 
                className="btn-primary flex-1 justify-center py-3 text-base"
                onClick={handleConfirmSale}
              >
                <span className="material-symbols-outlined">check_circle</span>
                <span>Confirmar Venta</span>
              </button>
              <button 
                className="btn-secondary"
                onClick={handleClearSale}
              >
                <span className="material-symbols-outlined">refresh</span>
                <span>Limpiar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
