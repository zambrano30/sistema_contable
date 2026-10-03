# Problema de Balance - Filtrado por Empresa

## Diagnóstico
El dashboard no está sumando las facturas y gastos porque:

1. Las facturas pueden tener un `company_id` NULL o incorrecto
2. O se crearon antes de que el sistema tuviera filtrado por empresa

## Cómo verificar en Supabase

1. Ve a tu proyecto en [Supabase](https://supabase.com/dashboard)
2. Abre **SQL Editor**
3. Ejecuta esta consulta:

```sql
-- Ver facturas actuales con sus company_ids
SELECT 
  id,
  invoice_number,
  company_id,
  total_amount,
  created_at
FROM invoices
ORDER BY created_at DESC
LIMIT 20;
```

### Posibles problemas:

**Problema 1: Facturas sin company_id (NULL)**
```
company_id = NULL
```
**Solución**: Ejecuta este SQL para asignarlo a tu empresa:
```sql
UPDATE invoices 
SET company_id = 'YOUR_COMPANY_ID'
WHERE company_id IS NULL;
```

**Problema 2: Facturas en empresa diferente**
- Las facturas tienen un `company_id` diferente al de la empresa seleccionada
- Verifica que en el dashboard muestre "Empresa: ABC123" en el debug info

## Cómo ver el debug info en el dashboard

1. Abre el dashboard en tu navegador
2. Bajo el título "Panel Principal", verás una línea gris con:
   ```
   DEBUG: Empresa: abc123def456... | Período: 2026-10-01 a 2026-10-31
   ```
3. Este `Empresa: abc123...` es el `company_id` que está usando

## Verificar que las facturas pertenecen a esa empresa

1. En SQL Editor, ejecuta:
```sql
SELECT company_id, COUNT(*) 
FROM invoices 
GROUP BY company_id;
```

2. Verifica que el `company_id` que ves en el debug sea uno de los que aparezca aquí

## Problemas comunes

### "No hay empresa seleccionada"
- Solución: Selecciona una empresa en el selector en el sidebar/header

### Debug muestra empresa pero total es $0
- Verifica que las facturas tengan el `company_id` correcto
- Las facturas creatadas ANTES del cambio de filtrado podrían tener NULL

### Múltiples empresas con facturas
- Cada empresa tiene sus propias facturas
- El dashboard solo muestra facturas de la empresa seleccionada actualmente

## Checklist

- [ ] Verificar company_id del debug info
- [ ] Ejecutar SQL para ver facturas con ese company_id
- [ ] Si hay facturas con NULL company_id, actualizar con UPDATE
- [ ] Recargar página del dashboard
- [ ] Verificar que "Ventas Totales" y "Balance" se actualizan
