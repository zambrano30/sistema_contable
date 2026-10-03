// Hook personalizado para detectar modo offline y sincronización
import { useState, useEffect } from 'react'

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)
  const [pendingChanges, setPendingChanges] = useState(0)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      // Disparar sincronización
      if (window.syncManager) {
        window.syncManager.syncOfflineData()
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    const handleSyncStart = () => setIsSyncing(true)
    const handleSyncComplete = () => {
      setIsSyncing(false)
      setSyncStatus('success')
      setTimeout(() => setSyncStatus(null), 3000)
      updatePendingChanges()
    }

    const handleSyncError = () => {
      setIsSyncing(false)
      setSyncStatus('error')
      setTimeout(() => setSyncStatus(null), 5000)
    }

    // Listeners de eventos
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('syncCompleted', handleSyncComplete)
    window.addEventListener('syncError', handleSyncError)

    // Service Worker messages
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      const handleSWMessage = (event) => {
        if (event.data.type === 'OFFLINE_REQUEST') {
          setIsSyncing(true)
          updatePendingChanges()
        } else if (event.data.type === 'SYNC_SUCCESS') {
          updatePendingChanges()
        }
      }
      navigator.serviceWorker.addEventListener('message', handleSWMessage)
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage)
      }
    }

    updatePendingChanges()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('syncCompleted', handleSyncComplete)
      window.removeEventListener('syncError', handleSyncError)
    }
  }, [])

  const updatePendingChanges = async () => {
    if (window.offlineDB && window.offlineDB.db) {
      try {
        const queue = await window.offlineDB.getSyncQueue(false)
        setPendingChanges(queue.length)
      } catch (error) {
        // Error actualizando cambios pendientes
      }
    }
  }

  return {
    isOffline,
    isSyncing,
    syncStatus,
    pendingChanges,
    isOnline: !isOffline,
    updatePendingChanges
  }
}

// Componente indicador de estado offline
export function OfflineIndicator() {
  const { isOffline, isSyncing, syncStatus, pendingChanges } = useOffline()

  if (!isOffline && !isSyncing && (!syncStatus || syncStatus === null)) {
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
      isSyncing ? 'bg-blue-500' :
      syncStatus === 'success' ? 'bg-green-500' :
      syncStatus === 'error' ? 'bg-red-500' :
      isOffline ? 'bg-orange-500' : 'bg-gray-500'
    }`}>
      {isSyncing && (
        <div className="flex items-center gap-2">
          <div className="animate-spin">⟳</div>
          <span>Sincronizando ({pendingChanges} cambios)...</span>
        </div>
      )}
      {syncStatus === 'success' && !isSyncing && (
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>Sincronización completada</span>
        </div>
      )}
      {syncStatus === 'error' && (
        <div className="flex items-center gap-2">
          <span>✗</span>
          <span>Error en sincronización</span>
        </div>
      )}
      {isOffline && !isSyncing && (
        <div className="flex items-center gap-2">
          <span>📴</span>
          <span>Sin conexión ({pendingChanges} cambios locales)</span>
        </div>
      )}
    </div>
  )
}
