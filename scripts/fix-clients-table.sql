-- 🔧 SCRIPT PARA REPARAR LA TABLA DE CLIENTES
-- Resuelve el error: "duplicate key value violates unique constraint clients_pkey"

-- ============================================
-- PASO 1: Verificar estructura actual
-- ============================================
-- Descomenta esto para ver la estructura:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'clients'
-- ORDER BY ordinal_position;

-- ============================================
-- PASO 2: OPCIÓN A - Reparar la secuencia (SIN perder datos)
-- ============================================
-- Si quieres mantener los datos existentes, ejecuta esto:

-- Encuentra el ID máximo actual
SELECT MAX(id) as max_id FROM clients;

-- Luego ejecuta esto (reemplaza XXXXX con el valor del max_id + 1):
-- ALTER SEQUENCE clients_id_seq RESTART WITH XXXXX;

-- Ejemplo: si el max_id es 15, entonces:
-- ALTER SEQUENCE clients_id_seq RESTART WITH 16;

-- ============================================
-- PASO 3: OPCIÓN B - Limpiar la tabla completamente (BORRAR TODOS LOS DATOS)
-- ============================================
-- ⚠️ ADVERTENCIA: Esto borrará TODOS los clientes. Úsalo solo si:
--    - No hay datos importantes
--    - Necesitas empezar desde cero
--    - Los datos existentes están corruptos

-- Descomenta para ejecutar:
/*
-- Primero, desactiva las restricciones de clave foránea
ALTER TABLE IF EXISTS invoices DISABLE TRIGGER ALL;

-- Borra todos los clientes
TRUNCATE TABLE clients RESTART IDENTITY CASCADE;

-- Reactiva los disparadores
ALTER TABLE IF EXISTS invoices ENABLE TRIGGER ALL;

-- Verifica que está vacío
SELECT COUNT(*) as client_count FROM clients;
*/

-- ============================================
-- PASO 4: Crear la tabla correctamente (si no existe)
-- ============================================
-- Si necesitas crear la tabla desde cero:

/*
CREATE TABLE IF NOT EXISTS clients (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Colombia',
  tax_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_clients_tax_id ON clients(tax_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
*/

-- ============================================
-- INSTRUCCIONES DE USO:
-- ============================================
-- 1. Abre Supabase Dashboard → SQL Editor
-- 2. Crea una "New Query"
-- 3. Copia todo el contenido de este archivo
-- 4. Sigue las instrucciones según tu caso:
--
--    CASO A - Reparar sin perder datos:
--    - Descomenta "SELECT MAX(id)" para ver el max_id
--    - Ejecuta esa línea
--    - Toma el número del resultado
--    - Descomenta "ALTER SEQUENCE" y reemplaza XXXXX con (max_id + 1)
--    - Ejecuta esa línea
--
--    CASO B - Limpiar TODO (⚠️ BORRAR DATOS):
--    - Descomenta el bloque /* ... */
--    - Ejecuta las líneas
--    - Esto borrará todos los clientes pero reiniciará el contador a 1
--
-- 5. Luego intenta crear un nuevo cliente desde la app

-- ============================================
-- VERIFICACIÓN FINAL:
-- ============================================
-- Después de aplicar cualquiera de los pasos anteriores, ejecuta esto:
SELECT 
  tablename,
  schemaname,
  indexname 
FROM pg_indexes 
WHERE tablename = 'clients'
ORDER BY indexname;

-- Y esto para verificar la secuencia:
SELECT 
  sequence_name,
  last_value,
  increment_by
FROM information_schema.sequences
WHERE sequence_name LIKE 'clients%';
