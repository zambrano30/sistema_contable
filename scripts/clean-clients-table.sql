-- 🗑️ LIMPIAR TABLA CLIENTES - BORRAR TODO Y REINICIAR
-- Este script respeta las restricciones foráneas de Supabase

-- PASO 1: Elimina facturas relacionadas (si existen)
DELETE FROM invoice_items 
WHERE invoice_id IN (SELECT id FROM invoices WHERE client_id IN (SELECT id FROM clients));

DELETE FROM invoices 
WHERE client_id IN (SELECT id FROM clients);

-- PASO 2: Elimina pagos relacionados (si existen)
DELETE FROM payments 
WHERE client_id IN (SELECT id FROM clients);

-- PASO 3: Elimina todos los clientes
DELETE FROM clients;

-- PASO 4: Reinicia el contador de secuencia a 1
ALTER SEQUENCE clients_id_seq RESTART WITH 1;

-- PASO 5: Verificación
SELECT 
  'TABLA LIMPIADA ✅' as estado,
  (SELECT COUNT(*) FROM clients) as clientes_totales,
  (SELECT COUNT(*) FROM invoices WHERE client_id IS NULL OR client_id NOT IN (SELECT id FROM clients)) as facturas_huerfanas
;
