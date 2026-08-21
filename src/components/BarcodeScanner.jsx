import { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import '../styles/BarcodeScanner.css';

export function BarcodeScanner({ onScan, onClose }) {
  const [scanning, setScanning] = useState(true);
  const [scanMode, setScanMode] = useState('camera'); // 'camera' o 'keyboard'
  const [error, setError] = useState('');
  const [keyboardInput, setKeyboardInput] = useState('');
  const scannerRef = useRef(null);
  const manualInputRef = useRef(null);

  // Configurar cámara
  useEffect(() => {
    if (!scanning || scanMode !== 'camera') return;

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
  }, [scanning, scanMode, onScan]);

  // Configurar lector de código de barras (teclado)
  useEffect(() => {
    if (!scanning || scanMode !== 'keyboard') return;

    // Enfocar automáticamente el campo de entrada
    if (manualInputRef.current) {
      manualInputRef.current.focus();
    }

    const handleKeyDown = (e) => {
      // Capturar Enter para procesar el código
      if (e.key === 'Enter' && keyboardInput.trim()) {
        e.preventDefault();
        setScanning(false);
        onScan(keyboardInput.trim());
        setKeyboardInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scanning, scanMode, keyboardInput, onScan]);

  const handleClose = () => {
    setScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
    }
    setKeyboardInput('');
    onClose();
  };

  const handleSwitchMode = (mode) => {
    if (scannerRef.current && scanMode === 'camera') {
      scannerRef.current.clear().catch(() => {});
    }
    setScanMode(mode);
    setKeyboardInput('');
    setError('');
  };

  const handleManualSubmit = () => {
    if (keyboardInput.trim()) {
      setScanning(false);
      onScan(keyboardInput.trim());
      setKeyboardInput('');
    } else {
      setError('Por favor ingresa un código');
    }
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

        {/* Selector de modo */}
        <div className="scanner-mode-selector">
          <button
            type="button"
            className={`mode-btn ${scanMode === 'camera' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('camera')}
          >
            📱 Cámara
          </button>
          <button
            type="button"
            className={`mode-btn ${scanMode === 'keyboard' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('keyboard')}
          >
            🔌 Lector USB
          </button>
        </div>

        {error && <div className="scanner-error">{error}</div>}

        {/* Modo cámara */}
        {scanMode === 'camera' && (
          <>
            <div id="qr-reader" className="qr-reader"></div>
            <p className="scanner-hint">
              📷 Apunta la cámara al código de barras
            </p>
          </>
        )}

        {/* Modo lector de código de barras */}
        {scanMode === 'keyboard' && (
          <>
            <div className="keyboard-input-section">
              <p className="scanner-hint">
                🔌 Escanea con tu lector de código de barras o ingresa manualmente:
              </p>
              <input
                ref={manualInputRef}
                type="text"
                value={keyboardInput}
                onChange={(e) => setKeyboardInput(e.target.value)}
                placeholder="Escanea aquí..."
                className="scanner-input"
                autoFocus
              />
              <button
                type="button"
                onClick={handleManualSubmit}
                className="btn btn-primary"
              >
                Procesar
              </button>
            </div>
          </>
        )}

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
