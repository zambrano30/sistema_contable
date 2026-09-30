// Gestor de sincronización - sincroniza datos offline cuando hay conexión
import { offlineDB } from './offlineDB'
import { supabase } from './supabaseClient'

export const syncManager = {
  isSyncing: false,
  lastSyncTime: null,

  async init() {
    console.log('Inicializando Sync Manager...')
    
    // Escuchar eventos de conexión
    window.addEventListener('online', () => this.syncOfflineData())
    window.addEventListener('connectionRestored', () => this.syncOfflineData())
    
    // Sincronizar si estamos online al iniciar
    if (navigator.onLine) {
      setTimeout(() => this.syncOfflineData(), 2000)
    }

    // Escuchar mensajes del Service Worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'SYNC_NOW') {
          this.syncOfflineData()
        }
      })
    }
  },

  async syncOfflineData() {
    if (this.isSyncing || !navigator.onLine) {
      return
    }

    this.isSyncing = true
    console.log('📡 Iniciando sincronización...')

    try {
      const syncQueue = await offlineDB.getSyncQueue(false)

      if (syncQueue.length === 0) {
        console.log('✅ Nada que sincronizar')
        this.isSyncing = false
        return
      }

      console.log(`Sincronizando ${syncQueue.length} operaciones...`)

      for (const item of syncQueue) {
        try {
          await this.syncQueueItem(item)
        } catch (error) {
          console.error(`Error sincronizando item ${item.id}:`, error)
        }
      }

      await offlineDB.setMetadata('lastSync', new Date().toISOString())
      this.lastSyncTime = new Date()
      
      console.log('✅ Sincronización completada')
      window.dispatchEvent(new CustomEvent('syncCompleted'))
    } catch (error) {
      console.error('Error en sincronización:', error)
    } finally {
      this.isSyncing = false
    }
  },

  async syncQueueItem(item) {
    const { id, table, operation, data, recordId, attempts } = item

    if (attempts >= 3) {
      console.warn(`Item ${id} excedió intentos de sincronización`)
      return
    }

    try {
      switch (table) {
        case 'invoices':
          await this.syncInvoice(operation, data, recordId)
          break
        case 'clients':
          await this.syncClient(operation, data, recordId)
          break
        case 'products':
          await this.syncProduct(operation, data, recordId)
          break
        case 'expenses':
          await this.syncExpense(operation, data, recordId)
          break
        case 'inventory':
          await this.syncInventory(operation, data, recordId)
          break
        default:
          console.warn(`Tabla desconocida: ${table}`)
      }

      await offlineDB.markAsSynced(id)
      console.log(`✅ Sincronizado: ${table} - ${operation}`)
    } catch (error) {
      console.error(`Error sincronizando ${table}:`, error)
      
      // Incrementar intentos
      const tx = offlineDB.db.transaction('syncQueue', 'readwrite')
      const store = tx.objectStore('syncQueue')
      const updatedItem = { ...item, attempts: (attempts || 0) + 1 }
      await new Promise((resolve, reject) => {
        const req = store.put(updatedItem)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })

      throw error
    }
  },

  async syncInvoice(operation, data, recordId) {
    const { data: response, error } = await supabase
      .from('invoices')
      .upsert([data], { onConflict: 'id' })

    if (error) throw error
    return response
  },

  async syncClient(operation, data, recordId) {
    const { data: response, error } = await supabase
      .from('clients')
      .upsert([data], { onConflict: 'id' })

    if (error) throw error
    return response
  },

  async syncProduct(operation, data, recordId) {
    const { data: response, error } = await supabase
      .from('products')
      .upsert([data], { onConflict: 'id' })

    if (error) throw error
    return response
  },

  async syncExpense(operation, data, recordId) {
    const { data: response, error } = await supabase
      .from('expenses')
      .upsert([data], { onConflict: 'id' })

    if (error) throw error
    return response
  },

  async syncInventory(operation, data, recordId) {
    const { data: response, error } = await supabase
      .from('inventory')
      .upsert([data], { onConflict: 'productId' })

    if (error) throw error
    return response
  },

  // Forzar sincronización manual
  async forceSyncNow() {
    console.log('Forzando sincronización...')
    await this.syncOfflineData()
  },

  // Obtener estado de sincronización
  async getSyncStatus() {
    const stats = await offlineDB.getStats()
    return {
      isSyncing: this.isSyncing,
      isOnline: navigator.onLine,
      pendingSync: stats.pendingSync,
      lastSync: this.lastSyncTime,
      dataStats: stats
    }
  },

  // Limpiar cola de sincronización (útil para debug)
  async clearSyncQueue() {
    const tx = offlineDB.db.transaction('syncQueue', 'readwrite')
    const store = tx.objectStore('syncQueue')
    return new Promise((resolve, reject) => {
      const req = store.clear()
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }
}
