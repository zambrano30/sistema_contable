// Sistema de base de datos offline usando IndexedDB
// Soporta: Facturas, Clientes, Productos, Gastos, Inventario

const DB_NAME = 'SistemaContableDB';
const DB_VERSION = 1;

export const offlineDB = {
  db: null,

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Tabla de Facturas/Ventas
        if (!db.objectStoreNames.contains('invoices')) {
          const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
          invoiceStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: false });
          invoiceStore.createIndex('clientId', 'clientId', { unique: false });
          invoiceStore.createIndex('date', 'date', { unique: false });
          invoiceStore.createIndex('status', 'status', { unique: false });
          invoiceStore.createIndex('syncedAt', 'syncedAt', { unique: false });
        }

        // Tabla de Clientes
        if (!db.objectStoreNames.contains('clients')) {
          const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
          clientStore.createIndex('name', 'name', { unique: false });
          clientStore.createIndex('email', 'email', { unique: false });
          clientStore.createIndex('cedula', 'cedula', { unique: false });
          clientStore.createIndex('syncedAt', 'syncedAt', { unique: false });
        }

        // Tabla de Productos
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('sku', 'sku', { unique: false });
          productStore.createIndex('syncedAt', 'syncedAt', { unique: false });
        }

        // Tabla de Gastos
        if (!db.objectStoreNames.contains('expenses')) {
          const expenseStore = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
          expenseStore.createIndex('date', 'date', { unique: false });
          expenseStore.createIndex('category', 'category', { unique: false });
          expenseStore.createIndex('status', 'status', { unique: false });
          expenseStore.createIndex('syncedAt', 'syncedAt', { unique: false });
        }

        // Tabla de Inventario
        if (!db.objectStoreNames.contains('inventory')) {
          const inventoryStore = db.createObjectStore('inventory', { keyPath: 'productId' });
          inventoryStore.createIndex('syncedAt', 'syncedAt', { unique: false });
        }

        // Cola de sincronización - para datos que no se sincronizaron
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('table', 'table', { unique: false });
          queueStore.createIndex('operation', 'operation', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('synced', 'synced', { unique: false });
        }

        // Metadatos offline
        if (!db.objectStoreNames.contains('offlineMetadata')) {
          db.createObjectStore('offlineMetadata', { keyPath: 'key' });
        }
      };
    });
  },

  // ==================== FACTURAS ====================
  async addInvoice(invoice) {
    const tx = this.db.transaction('invoices', 'readwrite');
    const store = tx.objectStore('invoices');
    invoice.createdAt = new Date().toISOString();
    invoice.status = invoice.status || 'draft';
    invoice.syncedAt = null; // Marcar como no sincronizado
    return new Promise((resolve, reject) => {
      const req = store.add(invoice);
      req.onsuccess = () => {
        this.addToSyncQueue('invoices', 'add', invoice, req.result);
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async updateInvoice(id, updates) {
    const tx = this.db.transaction('invoices', 'readwrite');
    const store = tx.objectStore('invoices');
    return new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const invoice = getReq.result;
        if (!invoice) {
          reject(new Error('Factura no encontrada'));
          return;
        }
        const updated = { ...invoice, ...updates, updatedAt: new Date().toISOString() };
        const updateReq = store.put(updated);
        updateReq.onsuccess = () => {
          this.addToSyncQueue('invoices', 'update', updated, id);
          resolve(updated);
        };
        updateReq.onerror = () => reject(updateReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  },

  async getInvoices() {
    const tx = this.db.transaction('invoices', 'readonly');
    const store = tx.objectStore('invoices');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async getInvoice(id) {
    const tx = this.db.transaction('invoices', 'readonly');
    const store = tx.objectStore('invoices');
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async deleteInvoice(id) {
    const tx = this.db.transaction('invoices', 'readwrite');
    const store = tx.objectStore('invoices');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => {
        this.addToSyncQueue('invoices', 'delete', { id }, id);
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  },

  // ==================== CLIENTES ====================
  async addClient(client) {
    const tx = this.db.transaction('clients', 'readwrite');
    const store = tx.objectStore('clients');
    client.createdAt = new Date().toISOString();
    client.syncedAt = null;
    return new Promise((resolve, reject) => {
      const req = store.add(client);
      req.onsuccess = () => {
        this.addToSyncQueue('clients', 'add', client, client.id);
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getClients() {
    const tx = this.db.transaction('clients', 'readonly');
    const store = tx.objectStore('clients');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async updateClient(id, updates) {
    const tx = this.db.transaction('clients', 'readwrite');
    const store = tx.objectStore('clients');
    return new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const client = getReq.result;
        const updated = { ...client, ...updates, updatedAt: new Date().toISOString() };
        const updateReq = store.put(updated);
        updateReq.onsuccess = () => {
          this.addToSyncQueue('clients', 'update', updated, id);
          resolve(updated);
        };
        updateReq.onerror = () => reject(updateReq.error);
      };
    });
  },

  // ==================== PRODUCTOS ====================
  async addProduct(product) {
    const tx = this.db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    product.createdAt = new Date().toISOString();
    product.syncedAt = null;
    return new Promise((resolve, reject) => {
      const req = store.add(product);
      req.onsuccess = () => {
        this.addToSyncQueue('products', 'add', product, product.id);
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getProducts() {
    const tx = this.db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  // ==================== GASTOS ====================
  async addExpense(expense) {
    const tx = this.db.transaction('expenses', 'readwrite');
    const store = tx.objectStore('expenses');
    expense.createdAt = new Date().toISOString();
    expense.status = expense.status || 'pending';
    expense.syncedAt = null;
    return new Promise((resolve, reject) => {
      const req = store.add(expense);
      req.onsuccess = () => {
        this.addToSyncQueue('expenses', 'add', expense, req.result);
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getExpenses() {
    const tx = this.db.transaction('expenses', 'readonly');
    const store = tx.objectStore('expenses');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  // ==================== INVENTARIO ====================
  async updateInventory(productId, quantity, operation = 'set') {
    const tx = this.db.transaction('inventory', 'readwrite');
    const store = tx.objectStore('inventory');
    return new Promise((resolve, reject) => {
      const getReq = store.get(productId);
      getReq.onsuccess = () => {
        let inventory = getReq.result || { productId, quantity: 0 };
        
        if (operation === 'increment') {
          inventory.quantity += quantity;
        } else if (operation === 'decrement') {
          inventory.quantity = Math.max(0, inventory.quantity - quantity);
        } else {
          inventory.quantity = quantity;
        }
        
        inventory.updatedAt = new Date().toISOString();
        inventory.syncedAt = null;
        
        const updateReq = store.put(inventory);
        updateReq.onsuccess = () => {
          this.addToSyncQueue('inventory', operation, inventory, productId);
          resolve(inventory);
        };
        updateReq.onerror = () => reject(updateReq.error);
      };
    });
  },

  async getInventory(productId) {
    const tx = this.db.transaction('inventory', 'readonly');
    const store = tx.objectStore('inventory');
    return new Promise((resolve, reject) => {
      const req = store.get(productId);
      req.onsuccess = () => resolve(req.result || { productId, quantity: 0 });
      req.onerror = () => reject(req.error);
    });
  },

  // ==================== COLA DE SINCRONIZACIÓN ====================
  async addToSyncQueue(table, operation, data, recordId) {
    const tx = this.db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    return new Promise((resolve, reject) => {
      const req = store.add({
        table,
        operation,
        data,
        recordId,
        timestamp: new Date().toISOString(),
        synced: false,
        attempts: 0
      });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async getSyncQueue(synced = false) {
    const tx = this.db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const index = store.index('synced');
    return new Promise((resolve, reject) => {
      const req = index.getAll(synced);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async markAsSynced(queueId) {
    const tx = this.db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    return new Promise((resolve, reject) => {
      const getReq = store.get(queueId);
      getReq.onsuccess = () => {
        const item = getReq.result;
        item.synced = true;
        item.syncedAt = new Date().toISOString();
        const updateReq = store.put(item);
        updateReq.onsuccess = () => resolve(item);
        updateReq.onerror = () => reject(updateReq.error);
      };
    });
  },

  async removeSyncQueueItem(queueId) {
    const tx = this.db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    return new Promise((resolve, reject) => {
      const req = store.delete(queueId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // ==================== METADATOS ====================
  async setMetadata(key, value) {
    const tx = this.db.transaction('offlineMetadata', 'readwrite');
    const store = tx.objectStore('offlineMetadata');
    return new Promise((resolve, reject) => {
      const req = store.put({ key, value, timestamp: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async getMetadata(key) {
    const tx = this.db.transaction('offlineMetadata', 'readonly');
    const store = tx.objectStore('offlineMetadata');
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.value);
      req.onerror = () => reject(req.error);
    });
  },

  // ==================== UTILIDADES ====================
  async clearAllData() {
    const stores = ['invoices', 'clients', 'products', 'expenses', 'inventory', 'syncQueue'];
    for (const storeName of stores) {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await new Promise((resolve, reject) => {
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  },

  async getStats() {
    const stats = {
      invoices: 0,
      clients: 0,
      products: 0,
      expenses: 0,
      pendingSync: 0,
      lastSync: await this.getMetadata('lastSync') || 'Never'
    };

    const invoices = await this.getInvoices();
    stats.invoices = invoices.length;

    const clients = await this.getClients();
    stats.clients = clients.length;

    const products = await this.getProducts();
    stats.products = products.length;

    const expenses = await this.getExpenses();
    stats.expenses = expenses.length;

    const syncQueue = await this.getSyncQueue(false);
    stats.pendingSync = syncQueue.length;

    return stats;
  }
};
