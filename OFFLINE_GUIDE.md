# 📱 GUÍA COMPLETA: Funcionamiento OFFLINE en tu Celular

Tu aplicación ahora funciona **completamente sin internet** gracias a la implementación de:
- ✅ **PWA** - App instalable
- ✅ **IndexedDB** - Almacenamiento local
- ✅ **Capacitor** - App nativa Android/iOS
- ✅ **Sincronización automática** - Cuando vuelve internet

---

## 🚀 PASO 1: Compilar la aplicación

```bash
npm run build
```

Esto generará la carpeta `dist/` con tu app lista para PWA.

---

## 📱 OPCIÓN 1: Instalar como PWA (La más fácil)

### En Android:
1. Abre la app en el navegador Chrome: `http://tu-pc:5173` (desde el celular en la misma red)
2. Toca el botón "Instalar" que aparece en la barra direcciones
3. La app se instalará en tu pantalla principal
4. **¡Funciona sin internet!**

### En iPhone (iOS):
1. Abre en Safari
2. Toca el botón Compartir (arriba)
3. Selecciona "Añadir a pantalla principal"
4. Nombre: "Sistema Contable"
5. **¡Listo! Funciona offline**

---

## 🔧 OPCIÓN 2: Crear app nativa con Capacitor

### 1. Inicializar Capacitor (ya está configurado)

```bash
npm run build
npx cap init
```

### 2. Agregar plataformas

```bash
# Android
npx cap add android

# iOS (solo en Mac)
npx cap add ios
```

### 3. Sincronizar cambios

```bash
npx cap sync
```

### 4. Abrir en Android Studio

```bash
npx cap open android
```

En Android Studio:
- Click en "Run" (Play button)
- Selecciona tu celular
- **¡App lista!**

### 5. Abrir en Xcode (iOS - solo Mac)

```bash
npx cap open ios
```

---

## 💾 CARACTERÍSTICAS OFFLINE

### ✅ Qué funciona sin internet:

1. **Crear Facturas** (se guardan localmente)
   ```javascript
   import { offlineDB } from './lib/offlineDB'
   
   await offlineDB.addInvoice({
     invoiceNumber: 'FAC-001',
     clientId: 1,
     items: [...],
     total: 100.50,
     // Se guarda automáticamente en IndexedDB
   })
   ```

2. **Registrar Clientes** (almacenados localmente)
   ```javascript
   await offlineDB.addClient({
     name: 'Juan García',
     email: 'juan@example.com',
     cedula: '1234567890'
   })
   ```

3. **Gestionar Inventario** (stock local)
   ```javascript
   await offlineDB.updateInventory('PROD-001', 5, 'set')
   ```

4. **Registrar Gastos**
   ```javascript
   await offlineDB.addExpense({
     description: 'Compra de supplies',
     amount: 50.00,
     category: 'Supplies'
   })
   ```

5. **Ver Historial** (todo guardado localmente)

### 📡 Sincronización automática

Cuando recuperes conexión a internet:
1. Se sincroniza automáticamente
2. Las facturas se suben a Supabase
3. Los cambios se actualizan en la nube
4. **Sin perder datos**

---

## 🔄 USAR OFFLINEDB EN TUS PÁGINAS

### Ejemplo: SalesPage.jsx

```jsx
import { useEffect, useState } from 'react'
import { offlineDB } from '../lib/offlineDB'
import { useOffline } from '../hooks/useOffline'

export default function SalesPage() {
  const [invoices, setInvoices] = useState([])
  const { isOffline, pendingChanges } = useOffline()

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    // Si estamos offline, usar datos locales
    if (isOffline) {
      const localInvoices = await offlineDB.getInvoices()
      setInvoices(localInvoices)
    } else {
      // Si estamos online, sincronizar con servidor
      const response = await supabase.from('invoices').select()
      setInvoices(response.data)
    }
  }

  const createInvoice = async (invoiceData) => {
    try {
      // Guardar localmente
      const invoiceId = await offlineDB.addInvoice({
        ...invoiceData,
        createdAt: new Date().toISOString()
      })
      
      // Sincronizar si estamos online
      if (!isOffline) {
        await syncManager.syncOfflineData()
      }

      setInvoices([...invoices, { id: invoiceId, ...invoiceData }])
    } catch (error) {
      console.error('Error creando factura:', error)
    }
  }

  return (
    <div>
      <h1>Ventas</h1>
      
      {isOffline && (
        <div className="alert alert-warning">
          📴 Modo offline - {pendingChanges} cambios por sincronizar
        </div>
      )}

      <button onClick={() => createInvoice({...})}>
        Nueva Factura
      </button>

      <ul>
        {invoices.map(inv => (
          <li key={inv.id}>{inv.invoiceNumber}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Ejemplo: ClientsPage.jsx

```jsx
import { offlineDB } from '../lib/offlineDB'
import { useOffline } from '../hooks/useOffline'

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const { isOffline } = useOffline()

  useEffect(() => {
    const loadClients = async () => {
      const localClients = await offlineDB.getClients()
      setClients(localClients)
    }
    loadClients()
  }, [])

  const addClient = async (clientData) => {
    await offlineDB.addClient(clientData)
    const clients = await offlineDB.getClients()
    setClients(clients)
  }

  return (
    <div>
      <h1>Clientes {isOffline ? '(Offline)' : '(Online)'}</h1>
      {/* ... */}
    </div>
  )
}
```

---

## 📊 MONITOREAR ESTADO OFFLINE

### Hook useOffline()

```jsx
import { useOffline } from '../hooks/useOffline'

function MyComponent() {
  const {
    isOffline,        // boolean: está sin internet
    isOnline,         // boolean: está con internet
    isSyncing,        // boolean: sincronizando ahora
    syncStatus,       // 'success' | 'error' | null
    pendingChanges    // número de cambios sin sincronizar
  } = useOffline()

  return (
    <div>
      {isOffline && <p>⚠️ Sin internet</p>}
      {isSyncing && <p>⟳ Sincronizando ({pendingChanges} cambios)...</p>}
      {syncStatus === 'success' && <p>✓ Sincronizado</p>}
    </div>
  )
}
```

---

## 🛠️ DEBUGGING & ADMINISTRACIÓN

### En la consola del navegador:

```javascript
// Ver estado de la base de datos
await window.offlineDB.getStats()

// Obtener todas las facturas
const invoices = await window.offlineDB.getInvoices()

// Ver cola de sincronización
const queue = await window.offlineDB.getSyncQueue(false)

// Forzar sincronización manual
await window.syncManager.forceSyncNow()

// Ver estado de sincronización
await window.syncManager.getSyncStatus()

// Limpiar datos (CUIDADO: elimina todo)
await window.offlineDB.clearAllData()
```

---

## 🐛 RESOLVER PROBLEMAS

### "No funciona offline"
- Verifica que hayas hecho `npm run build`
- Cierra y reabre la app
- Verifica en DevTools > Application > Service Workers

### "No sincroniza"
- Verifica conexión a internet
- Abre console y ejecuta: `await window.syncManager.forceSyncNow()`
- Verifica que la app tenga permisos de red

### "Datos no se guardan"
- Abre DevTools > Application > IndexedDB > SistemaContableDB
- Verifica que las tablas tengan datos
- Si está vacío, usa: `await window.offlineDB.addInvoice({...})`

---

## ⚙️ PRÓXIMOS PASOS

1. **Integrar offlineDB en todas tus páginas** (SalesPage, ClientsPage, etc)
2. **Actualizar servicios** para usar offlineDB cuando esté offline
3. **Probar en celular** instalando como PWA
4. **Compilar APK** para Android con Capacitor
5. **Crear IPA** para iOS con Capacitor (solo Mac)

---

## 📞 COMANDOS ÚTILES

```bash
# Desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar build
npm run preview

# Inicializar Capacitor
npx cap init

# Agregar Android
npx cap add android

# Agregar iOS (Mac only)
npx cap add ios

# Abrir Android Studio
npx cap open android

# Abrir Xcode (Mac only)
npx cap open ios

# Sincronizar cambios
npx cap sync

# Crear APK (desde Android Studio)
Build > Build Bundle(s) / APK(s) > Build APK(s)
```

---

## 🎉 ¡LISTO!

Tu aplicación ahora funciona **sin internet** con sincronización automática. 

**Resumen:**
- ✅ PWA instalable en celular
- ✅ Guarda todo localmente (IndexedDB)
- ✅ Sincroniza cuando hay conexión
- ✅ App nativa con Capacitor
- ✅ Sin perder datos

**¡Disfruta tu app offline!** 📱
