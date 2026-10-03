import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Detectar si la app ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    // Escuchar si se instaló
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
      setIsInstalled(true)
      console.log('App instalada correctamente')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
  }

  // No mostrar si la app ya está instalada
  if (isInstalled || !showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-lg p-4 z-50 animate-slideUp">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-white mb-1">Instala Sistema Contable</h3>
          <p className="text-sm text-white/90 mb-3">
            Accede a tu facturación desde cualquier dispositivo. Funciona sin conexión a internet.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-white text-orange-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="text-white font-semibold px-4 py-2 rounded hover:bg-white/20 transition"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white hover:bg-white/20 rounded p-1 flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// Animación en tailwind.config.js (si no está ya agregada):
// tailwind.config.js debe tener en theme.animation:
// slideUp: 'slideUp 0.3s ease-out',
// Y en theme.keyframes:
// slideUp: {
//   '0%': { transform: 'translateY(100%)', opacity: '0' },
//   '100%': { transform: 'translateY(0)', opacity: '1' }
// }
