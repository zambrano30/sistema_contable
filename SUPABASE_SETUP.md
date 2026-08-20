# 🗄️ Guía de Configuración Supabase - Sistema Contable

## Estado Actual ✓

```
✅ Variables de ambiente (.env) - CONFIGURADAS
✅ Supabase Client - INICIALIZADO
✅ Estructura de servicios - LISTA
❌ Base de datos - NO ACCESIBLE (Pausado o error de red)
```

## Problema: "net::ERR_NAME_NOT_RESOLVED"

**Causa:** El proyecto Supabase está pausado o la red no puede alcanzarlo.

### Solución Rápida:

1. **Ir a Supabase Dashboard:**
   - https://app.supabase.com
   - Selecciona el proyecto: `pnmzzgsgmqgzdwsodfla`

2. **Verificar estado:**
   - En Settings → General
   - Asegúrate que el proyecto está **Active** (no Paused)
   - Si está pausado, haz click en "Unpause"

3. **Reiniciar conexión:**
   ```bash
   npm run dev
   # Presiona F5 en el navegador para recargar
   ```

---

## 📋 Configuración Completa de Base de Datos

Si es la **primera vez** que configuras Supabase, sigue estos pasos:

### Paso 1: Crear las Tablas

1. Ve a Supabase Dashboard → SQL Editor
2. Haz click en "New Query"
3. **Copia y ejecuta** el contenido de:
   ```
   scripts/complete-supabase-backend.sql
   ```
4. Espera a que complete (sin errores)

### Paso 2: Crear Funciones y RLS

Ejecuta UNO de estos scripts en SQL Editor:

#### Opción A: Configuración Completa (Recomendado)
```
scripts/complete-setup.sql
```
Incluye:
- Función `ensure_user_exists()` para crear usuarios automáticamente
- RLS policies estrictas pero funcionales

#### Opción B: Configuración Simple (Desarrollo)
```
scripts/simple-rls-policies.sql
```
Incluye:
- RLS policies permisivas para todos los usuarios autenticados
- Mejor para pruebas rápidas

### Paso 3: Habilitar RLS en Todas las Tablas

En Supabase Dashboard → Database → Tables:

Para cada tabla (products, clients, invoices, etc.):
1. Abre la tabla
2. Click en el botón "RLS" (esquina superior derecha)
3. Asegúrate que está **Enable** (verde)
4. Verifica que las policies estén aplicadas

Tablas que DEBEN tener RLS:
- ✅ `users`
- ✅ `products`
- ✅ `clients`
- ✅ `invoices`
- ✅ `invoice_items`
- ✅ `categories`

---

## 🔑 Variables de Ambiente

Archivo: `.env` (YA CONFIGURADO)

```bash
VITE_SUPABASE_URL=https://pnmzzgsgmqgzdwsodfla.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Si necesitas cambiar el proyecto Supabase:
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Copia la URL y la Anonymous Key
4. Actualiza el archivo `.env`
5. Reinicia: `npm run dev`

---

## 🧪 Prueba de Conectividad

### Test 1: Desde el Navegador
1. Abre DevTools (F12)
2. Ve a Console
3. Ejecuta:
```javascript
import { supabase } from '/src/lib/supabaseClient.js'
const test = await supabase.from('products').select('count').single()
console.log(test)
```

### Test 2: Desde la Terminal
```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login
supabase login

# Test de conexión
supabase projects list
```

---

## 📊 Estructura de Tablas

### users
- `id` (UUID, PK)
- `email` (TEXT)
- `role` (TEXT: admin, viewer)
- `active` (BOOLEAN)

### products
- `id` (BIGINT, PK)
- `name`, `description`
- `sku`, `barcode` (UNIQUE)
- `unit_price`, `purchase_price`
- `quantity_on_hand`, `minimum_quantity`
- `is_taxable`, `tax_percentage`
- `is_active`

### clients
- `id` (BIGINT, PK)
- `name`, `email`, `phone`, `address`
- `tax_id` (NIT/RUC)
- `is_active`

### invoices
- `id` (BIGINT, PK)
- `invoice_number` (UNIQUE)
- `client_id` (FK)
- `status` (draft, sent, paid)
- `total_amount`, `tax_amount`
- `created_by` (FK to auth.users)

---

## ❌ Errores Comunes y Soluciones

### Error: "Missing Supabase environment variables"
**Causa:** .env no existe o variables no están cargadas
```bash
# Solución:
npm run dev
# Presiona F5 en el navegador
```

### Error: "Invalid JWT"
**Causa:** El ANON_KEY expiró o es incorrecto
**Solución:** Copiar una nueva key del dashboard

### Error: "Policy violation"
**Causa:** RLS policy rechazó la operación
**Solución:** 
- Ejecutar `simple-rls-policies.sql` para permisos permisivos
- O ajustar las policies en el dashboard

### Error: "CORS error"
**Causa:** El dominio no está permitido en Supabase
**Solución:**
1. Supabase Dashboard → Authentication → URL Configuration
2. Agregar: `http://localhost:5173`

---

## 🚀 Comandos Útiles

```bash
# Reiniciar dev server
npm run dev

# Ver logs en tiempo real
npm run dev -- --host

# Conectar con Supabase CLI
supabase link --project-ref pnmzzgsgmqgzdwsodfla

# Ver migrations pendientes
supabase migration list
```

---

## ✅ Checklist de Verificación Final

- [ ] Proyecto Supabase está **Active** (no Paused)
- [ ] Archivo `.env` tiene las variables correctas
- [ ] Tablas creadas: `products`, `clients`, `invoices`, `users`
- [ ] RLS habilitado en todas las tablas
- [ ] Función `ensure_user_exists()` existe
- [ ] Puedo ver "Cargando productos..." sin errores de red
- [ ] Formulario de productos muestra todos los campos
- [ ] Puedo crear un producto sin errores

---

## 📞 Soporte

Si aún tienes problemas:

1. **Revisa la consola del navegador** (F12 → Console)
2. **Revisa los logs en Supabase** (Dashboard → Logs)
3. **Verifica la URL** del proyecto en el .env
4. **Reactiva el proyecto** si está pausado
5. **Ejecuta los scripts SQL** nuevamente si las tablas no existen
