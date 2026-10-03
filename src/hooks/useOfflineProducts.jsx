// Ejemplo de integración de offlineDB en ProductsPage
import { useEffect, useState } from 'react'
import { offlineDB } from '../lib/offlineDB'
import { syncManager } from '../lib/syncManager'
import { useOffline } from '../hooks/useOffline'

export function useOfflineProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { isOffline, updatePendingChanges } = useOffline()

  useEffect(() => {
    loadProducts()
  }, [isOffline])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const localProducts = await offlineDB.getProducts()
      setProducts(localProducts || [])
    } catch (error) {
      // Error cargando productos
    } finally {
      setLoading(false)
    }
  }

  const addProduct = async (productData) => {
    try {
      await offlineDB.addProduct({
        ...productData,
        createdAt: new Date().toISOString()
      })

      await updatePendingChanges()
      await loadProducts()

      if (!isOffline) {
        await syncManager.syncOfflineData()
      }
    } catch (error) {
      // Error agregando producto
      throw error
    }
  }

  const updateInventory = async (productId, quantity, operation = 'set') => {
    try {
      await offlineDB.updateInventory(productId, quantity, operation)
      await updatePendingChanges()

      if (!isOffline) {
        await syncManager.syncOfflineData()
      }
    } catch (error) {
      // Error actualizando inventario
      throw error
    }
  }

  return {
    products,
    loading,
    isOffline,
    addProduct,
    updateInventory,
    loadProducts
  }
}
