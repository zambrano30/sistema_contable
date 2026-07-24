import { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import '../styles/BarcodeScanner.css';

export function BarcodeScanner({ onScan, onClose }) {
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        facingMode: { ideal: 'environment' }, // Cámara trasera en móvil
      },
      false
    );

    const onScanSuccess = (decodedText) => {
      setScanning(false);
      onScan(decodedText);
      scanner.clear();
    };

    const onScanError = (error) => {
      // Ignorar errores de escaneo continuo
      console.debug('Scan error:', error);
    };

    scanner.render(onScanSuccess, onScanError);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scanner.clear().catch(() => {});
      }
    };
  }, [scanning, onScan]);

  const handleClose = () => {
    setScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
    }
    onClose();
  };

  return (
    <div className="barcode-scanner-overlay">
      <div className="barcode-scanner-modal">
        <div className="scanner-header">
          <h2>Escanear Código de Barras</h2>
          <button
            type="button"
            onClick={handleClose}
            className="scanner-close-btn"
            aria-label="Cerrar escáner"
          >
            ✕
          </button>
        </div>

        {error && <div className="scanner-error">{error}</div>}

        <div id="qr-reader" className="qr-reader"></div>

        <p className="scanner-hint">
          Apunta la cámara al código de barras
        </p>

        <button
          type="button"
          onClick={handleClose}
          className="btn btn-secondary"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
