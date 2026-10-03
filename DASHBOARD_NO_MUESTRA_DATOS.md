# Dashboard no muestra datos - Guía de resolución

## Problema
La empresa está seleccionada pero el dashboard no muestra:
- Ventas Totales ($0,00)
- Gastos Registrados ($0,00)
- Balance Neto ($0,00)

## Causa probable
Las facturas creadas no tienen el `company_id` asignado correctamente (probablemente tienen NULL).

## Solución Rápida (Recomendada)

### Paso 1: Abrir Herramientas de Diagnóstico
1. Ve a **Administración** → **Herramientas**
2. Haz clic en el card azul claro **"Información de Diagnóstico"**
3. Haz clic en **"Cargar Información"**

### Paso 2: Revisar el diagnóstico
Verás una tabla como esta:
```
Distribución por Empresa:
❌ SIN EMPRESA    2 facturas
✅ abc123...      0 facturas
```

**Si ves `❌ SIN EMPRESA` con facturas**, significa que tus facturas no tienen empresa asignada.

### Paso 3: Ejecutar corrección
1. Scroll down a la card **"Asignar Empresa a Facturas"** (morada)
2. Asegúrate de que tu empresa esté seleccionada (mira el campo "Empresa actual")
3. Haz clic en **"Asignar Empresa"**
4. Espera el mensaje de confirmación
5. **Recarga el Dashboard** (F5 o Refresh)

## Verificación manual (SQL)

Si prefieres hacerlo manualmente en Supabase:

1. Ve a tu proyecto en Supabase → **SQL Editor**
2. Ejecuta esta consulta:
```sql
SELECT company_id, COUNT(*) as total FROM invoices GROUP BY company_id;
```

3. Verás algo como:
```
company_id       total
NULL             2
abc123...        0
```

4. Si hay `NULL` con valores, ejecuta:
```sql
-- Primero, obtén tu company_id real:
SELECT id, name FROM companies LIMIT 1;

-- Luego reemplaza 'YOUR_COMPANY_ID' y ejecuta:
UPDATE invoices 
SET company_id = 'YOUR_COMPANY_ID'
WHERE company_id IS NULL;
```

## Checklist de verificación

- [ ] Empresa seleccionada en el dropdown del header
- [ ] Cargar información de diagnóstico desde Administración
- [ ] Verificar que NO hay facturas con `❌ SIN EMPRESA`
- [ ] Si las hay, ejecutar "Asignar Empresa a Facturas"
- [ ] Recargar Dashboard (Ctrl+R o F5)
- [ ] Verificar que ahora se muestran Ventas Totales y Gastos

## Aún no funciona?

### Opción A: Verificar estado actual
1. Abre el Dashboard
2. Busca el debug info: `DEBUG: Empresa: ...`
3. Copia ese `Empresa: ...` (el ID)
4. Ve a Administración → Herramientas
5. En "Información de Diagnóstico", verifica que aparezca ESE company_id en la distribución

### Opción B: Recargar página completa
1. Abre las herramientas de desarrollador (F12)
2. Console → Limpia el localStorage:
   ```javascript
   localStorage.clear()
   ```
3. Recarga la página (F5)
4. Selecciona la empresa de nuevo
5. Intenta el proceso nuevamente

### Opción C: Contactar soporte
Si después de todo esto sigue sin funcionar, reúne esta información:
- Captura del "Información de Diagnóstico" (mostrando la distribución)
- El debug info del dashboard (la línea gris)
- El resultado de ejecutar la consulta SQL anterior

## Prevención futura

Ahora que está arreglado:
1. Todas las nuevas facturas se crearán con `company_id` asignado correctamente
2. El dashboard solo mostrará facturas de la empresa seleccionada
3. Si cambias de empresa, el dashboard se actualiza automáticamente
