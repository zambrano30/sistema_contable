import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Registrar Service Worker de Vite PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Registrar el SW generado por Vite PWA
    import('virtual:pwa-register').then(({ registerSW }) => {
      const updateSW = registerSW({ 
        immediate: true,
        onNeedRefresh() {
          console.log('Actualización de app disponible')
          // Aquí podrías mostrar un toast o notificación
        },
        onOfflineReady() {
          console.log('App lista para funcionar offline')
        }
      })
    }).catch(() => {
      // Si Vite PWA no está disponible, registrar el SW manual
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('Service Worker registrado:', reg))
        .catch(err => console.log('Error registrando SW:', err))
    })
  })
}

// Detectar modo offline
window.addEventListener('offline', () => {
  localStorage.setItem('isOffline', 'true')
  console.log('App pasó a modo offline')
})

window.addEventListener('online', () => {
  localStorage.setItem('isOffline', 'false')
  console.log('App volvió a modo online')
  // Disparar evento de sincronización
  window.dispatchEvent(new CustomEvent('connectionRestored'))
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
