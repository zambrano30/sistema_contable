// Ejemplo de integración de offlineDB en SalesPage
// Este archivo muestra cómo usar la base de datos offline

import { useEffect, useState } from 'react'
import { offlineDB } from '../lib/offlineDB'
import { syncManager } from '../lib/syncManager'
import { useOffline } from '../hooks/useOffline'
import { useAuth } from '../contexts/AuthContext'

export function useOfflineSales() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const { isOffline, pendingChanges, updatePendingChanges } = useOffline()
  const { user } = useAuth()

  useEffect(() => {
    loadInvoices()
  }, [isOffline])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const localInvoices = await offlineDB.getInvoices()
      setInvoices(localInvoices || [])
    } catch (error) {
      console.error('Error cargando facturas:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInvoice = async (invoiceData) => {
    try {
      const invoiceId = await offlineDB.addInvoice({
        ...invoiceData,
        userId: user?.id,
        createdAt: new Date().toISOString(),
        status: 'draft'
      })

      await updatePendingChanges()
      await loadInvoices()

      // Si estamos online, intentar sincronizar
      if (!isOffline) {
        await syncManager.syncOfflineData()
      }

      return invoiceId
    } catch (error) {
      console.error('Error creando factura:', error)
      throw error
    }
  }

  const updateInvoice = async (id, updates) => {
    try {
      await offlineDB.updateInvoice(id, updates)
      await updatePendingChanges()
      await loadInvoices()

      if (!isOffline) {
        await syncManager.syncOfflineData()
      }
    } catch (error) {
      console.error('Error actualizando factura:', error)
      throw error
    }
  }

  const deleteInvoice = async (id) => {
    try {
      await offlineDB.deleteInvoice(id)
      await updatePendingChanges()
      await loadInvoices()

      if (!isOffline) {
        await syncManager.syncOfflineData()
      }
    } catch (error) {
      console.error('Error eliminando factura:', error)
      throw error
    }
  }

  return {
    invoices,
    loading,
    isOffline,
    pendingChanges,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    loadInvoices
  }
}

// EJEMPLO DE USO EN TU COMPONENTE:
/*
import { useOfflineSales } from '../hooks/useOfflineSales'

export default function SalesPage() {
  const { invoices, loading, isOffline, pendingChanges, createInvoice } = useOfflineSales()

  const handleNewInvoice = async () => {
    await createInvoice({
      invoiceNumber: 'FAC-001',
      items: [],
      total: 0
    })
  }

  return (
    <div>
      {isOffline && (
        <div className="alert alert-warning">
          📴 Modo offline - {pendingChanges} cambios sin sincronizar
        </div>
      )}
      <button onClick={handleNewInvoice}>Nueva Factura</button>
      {/* ... */}
    </div>
  )
}
*/
