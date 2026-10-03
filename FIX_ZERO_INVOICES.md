# Corrección de Facturas con Total = 0

## Problema
Se crearon 2 facturas pero aparecen con total de $0,00 en el dashboard.

## Causa
Las facturas se crearon sin calcular correctamente el monto total. Esto puede haber sucedido porque:
- No se ingresó correctamente el monto en "Factura Simple"
- No se agregaron productos correctamente
- Hay un bug en el cálculo del total

## Solución

### Opción 1: Corregir las facturas existentes (Recomendado)

1. Ve a tu [proyecto Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** 
4. Copia y pega el siguiente SQL:

```sql
-- Ver todas las facturas con total = 0
SELECT id, invoice_number, total_amount, subtotal, discount_amount, created_at
FROM invoices 
WHERE total_amount = 0 
ORDER BY created_at DESC;

-- Recalcular totales basado en items de la factura
UPDATE invoices
SET total_amount = COALESCE(
  (SELECT SUM(line_total) FROM invoice_items WHERE invoice_id = invoices.id),
  0
)
WHERE total_amount = 0;
```

5. Ejecuta estas consultas
6. Recarga la aplicación en tu navegador

### Opción 2: Eliminar y recrear las facturas

1. Ve a **Facturas** en la aplicación
2. Elimina las 2 facturas con total $0,00
3. Crea nuevas facturas asegurándote de:
   - Ingresar productos con cantidad y precio
   - O usar "Factura Simple" e ingresar un monto válido
   - Verificar que el total sea mayor a $0

### Opción 3: Editar directamente en Supabase (sin eliminar)

Si deseas mantener los números de factura, puedes actualizar el total directamente:

1. Ve a **Table Editor** en Supabase
2. Selecciona la tabla **invoices**
3. Encuentra las facturas con `total_amount = 0`
4. Haz clic en cada una y edita el campo `total_amount` con el valor correcto

## Cambios Realizados para Prevenir Esto

✅ Se agregó validación en SalesPage para no permitir facturas con total = 0
✅ Se mejoraron los mensajes de error para indicar cuando el total es inválido

## Próximos Pasos

- Crear nuevas facturas con montos válidos
- El dashboard debe actualizar automáticamente cuando recargues la página
- Verifica que "Ventas Totales" y "Balance Neto" muestren valores correctos
