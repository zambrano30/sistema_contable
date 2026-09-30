import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registrado:', reg))
      .catch(err => console.log('Error registrando SW:', err))
  })
}

// Detectar modo offline
window.addEventListener('offline', () => {
  console.log('📴 Aplicación en modo offline')
  localStorage.setItem('isOffline', 'true')
})

window.addEventListener('online', () => {
  console.log('📡 Conexión restaurada')
  localStorage.setItem('isOffline', 'false')
  // Disparar evento de sincronización
  window.dispatchEvent(new CustomEvent('connectionRestored'))
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
