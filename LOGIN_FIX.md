# 🔐 SOLUCIÓN: Error "Cédula no fue encontrada" en Login

## El Problema

Cuando intentas iniciar sesión, obtienes el error: **"Usuario no encontrado. Verifica tu cédula."**

Esto significa que la cédula NO se guardó en la tabla `users` cuando te registraste.

---

## 🔧 SOLUCIÓN (Paso a Paso)

### PASO 1: Ejecutar Script SQL en Supabase

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor** (lado izquierdo)
3. Haz clic en **"New Query"**
4. **Copia TODO el contenido** de este archivo:
   ```
   scripts/fix-auth-rls-policies.sql
   ```
5. **Pega en el SQL Editor**
6. Haz clic en **"Run"** (botón verde)
7. Espera a que aparezca: ✅ **"RLS Policies fixed for users table"**

### PASO 2: Verifica que la tabla tiene datos

1. En Supabase, ve a **Table Editor**
2. Abre la tabla `public.users`
3. Deberías ver usuarios con sus cédulas
4. **Si está vacía**, continúa al Paso 3

### PASO 3: Limpiar la caché y reintentar registro

1. Abre tu app en el navegador
2. Presiona **F12** para abrir DevTools
3. Ve a **Application > Storage > Clear Site Data**
4. Marca todo y click **Clear**
5. **Recarga la página** (F5)
6. Intenta registrarte de nuevo
7. Ahora el login debería funcionar

---

## 🐛 DEBUGGING: Verifica el problema

### En Supabase SQL Editor, ejecuta esto:

```sql
-- Ver todos los usuarios registrados
SELECT id, cedula, nombre, email, created_at FROM public.users;

-- Ver cuántos usuarios hay
SELECT COUNT(*) as total_users FROM public.users;

-- Ver el último usuario registrado
SELECT * FROM public.users ORDER BY created_at DESC LIMIT 1;

-- Ver usuarios sin cédula (problema)
SELECT * FROM public.users WHERE cedula IS NULL;
```

### En la consola del navegador (F12), ejecuta:

```javascript
// Ver si está almacenado localmente
console.log(localStorage);

// Ver si hay datos en IndexedDB
await window.offlineDB.getStats();
```

---

## 📝 QUÉ CAMBIÉ EN EL CÓDIGO

### 1. **authService.js** - signUp()
- Ahora **PASA la cédula en metadata** al registrarse:
  ```javascript
  options: {
    data: {
      cedula: userData.cedula.trim(),
      nombre: nombre,
      // ... otros datos
    }
  }
  ```
- **Antes**: No pasaba metadata, por eso la cédula no se guardaba

### 2. **authService.js** - signIn()
- Mejora búsqueda de usuario por cédula
- Intenta búsquedas más flexibles (sin espacios)
- Mejor manejo de errores

### 3. **fix-auth-rls-policies.sql** (Nuevo)
- Arregla permisos RLS para permitir búsquedas de usuarios
- Permite INSERT de usuarios sin restricciones
- Crea índices para búsquedas rápidas

---

## ✅ PASOS PARA VERIFICAR QUE FUNCIONA

### 1. Ejecutar SQL Script
```bash
✅ Ve a Supabase > SQL Editor
✅ Ejecuta: scripts/fix-auth-rls-policies.sql
```

### 2. Limpiar navegador
```bash
✅ DevTools > Application > Clear Site Data
✅ Recarga la página
```

### 3. Registrarse de nuevo
```bash
✅ Cédula: 1234567890
✅ Nombre: Juan García
✅ Email: juan@example.com
✅ Contraseña: 123456
```

### 4. Verificar en Supabase
```bash
✅ Ve a Table Editor
✅ Abre tabla "users"
✅ Deberías ver tu nuevo usuario con su cédula
```

### 5. Intentar login
```bash
✅ Cédula: 1234567890
✅ Contraseña: 123456
✅ ✓ Debería funcionar ahora
```

---

## 🆘 Si aún no funciona

### Opción 1: Resetear tabla users

En **Supabase SQL Editor**, ejecuta:

```sql
-- ⚠️ CUIDADO: Esto borra todos los usuarios
TRUNCATE TABLE public.users CASCADE;
TRUNCATE TABLE public.companies CASCADE;

-- Luego ejecuta de nuevo:
\i scripts/fix-auth-rls-policies.sql;
```

Luego registrate de nuevo.

### Opción 2: Verificar auth.users

```sql
-- Ver usuarios en auth
SELECT id, email, created_at FROM auth.users;

-- Ver metadata guardada
SELECT id, email, raw_user_meta_data FROM auth.users;
```

Si ves la cédula en `raw_user_meta_data`, significa que el metadata se guardó bien.

### Opción 3: Crear usuario manualmente

```sql
-- Crear usuario manualmente (si lo demás falla)
INSERT INTO public.users (
  id,
  cedula,
  nombre,
  email,
  rol,
  is_active
) VALUES (
  gen_random_uuid(),
  '1234567890',
  'Juan García',
  'juan@example.com',
  'Vendedor',
  true
);
```

Luego intenta login con:
- Cédula: `1234567890`
- Contraseña: (la que usaste en auth.users)

---

## 📋 RESUMEN

| Acción | Antes | Ahora |
|--------|-------|-------|
| Metadata durante signup | ❌ No se pasaba | ✅ Se pasa correctamente |
| Búsqueda de cédula en login | ❌ Falla silenciosamente | ✅ Manejo de errores mejorado |
| RLS Policies | ⚠️ Restringido | ✅ Permite búsquedas de anónimos |
| Inserción de usuarios | ❌ Restringida | ✅ Permite durante signup |

---

## 🎉 Si ya funciona

Excelente. Ahora:

1. **Prueba con otro usuario**
2. **Verifica que aparece en Supabase > Table Editor > users**
3. **Intenta login y logout**
4. **¡Disfruta tu app!**

---

## 📞 Preguntas frecuentes

**P: ¿Pierdo mis datos si ejecuto el SQL script?**
A: No. El script solo arregla permisos. No borra datos.

**P: ¿Por qué no guardó la cédula antes?**
A: Porque no se pasaba en metadata durante signup. Ya está arreglado.

**P: ¿Qué pasa si tengo usuarios registrados sin cédula?**
A: El script intenta asignarles IDs automáticos. Puedes actualizar manualmente.

**P: ¿Cómo reseteo TODO?**
A: En Supabase, borra la tabla `users` y vuelve a registrarte.
