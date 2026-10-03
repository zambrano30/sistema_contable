// Ejemplo de integración de offlineDB en ClientsPage
import { useEffect, useState } from 'react'
import { offlineDB } from '../lib/offlineDB'
import { syncManager } from '../lib/syncManager'
import { useOffline } from '../hooks/useOffline'

export function useOfflineClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const { isOffline, updatePendingChanges } = useOffline()

  useEffect(() => {
    loadClients()
  }, [isOffline])

  const loadClients = async () => {
    try {
      setLoading(true)
      const localClients = await offlineDB.getClients()
      setClients(localClients || [])
    } catch (error) {
      // Error cargando clientes
    } finally {
      setLoading(false)
    }
  }

  const addClient = async (clientData) => {
    try {
      await offlineDB.addClient({
        ...clientData,
        createdAt: new Date().toISOString()
      })

      await updatePendingChanges()
      await loadClients()

      if (!isOffline) {
        await syncManager.syncOfflineData()
      }
    } catch (error) {
      // Error agregando cliente
      throw error
    }
  }

  const updateClient = async (id, updates) => {
    try {
      await offlineDB.updateClient(id, updates)
      await updatePendingChanges()
      await loadClients()

      if (!isOffline) {
        await syncManager.syncOfflineData()
      }
    } catch (error) {
      // Error actualizando cliente
      throw error
    }
  }

  return {
    clients,
    loading,
    isOffline,
    addClient,
    updateClient,
    loadClients
  }
}
