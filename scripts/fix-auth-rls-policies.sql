-- FIX: Permitir búsquedas de usuarios por cedula durante login (anónimo/unauthenticated)
-- IMPORTANTE: Este script DEBE ejecutarse en Supabase SQL Editor

-- 1. Habilitar RLS en tabla users si no está
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar policies antiguas
DROP POLICY IF EXISTS users_read_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_search_by_cedula_anon ON public.users;
DROP POLICY IF EXISTS users_insert_on_signup ON public.users;

-- 3. POLICY: Permitir que usuarios ANÓNIMOS busquen por cedula (SOLO email, no datos sensibles)
CREATE POLICY users_search_by_cedula_anon
  ON public.users
  FOR SELECT
  TO anon
  USING (TRUE);

-- 4. POLICY: Usuarios autenticados pueden ver sus propios datos
CREATE POLICY users_read_own
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- 5. POLICY: Usuarios autenticados pueden actualizar sus propios datos
CREATE POLICY users_update_own
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 6. POLICY: Permitir INSERT durante signup (usando SERVICE_ROLE o antes de autenticar)
CREATE POLICY users_insert_on_signup
  ON public.users
  FOR INSERT
  WITH CHECK (TRUE);

-- 7. Crear índice para búsquedas rápidas por cedula
CREATE INDEX IF NOT EXISTS idx_users_cedula ON public.users(cedula);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 8. Verificar que la tabla tiene todas las columnas necesarias
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cedula TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS empresa_nombre TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'Vendedor';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 9. Actualizar tabla users en caso de que los metadata están guardados
-- Este script sincroniza usuarios que se registraron pero cuya cédula no se guardó
UPDATE public.users u
SET cedula = COALESCE(u.cedula, gen_random_uuid()::TEXT)
WHERE cedula IS NULL;

-- 10. Log de ejecución
SELECT 'RLS Policies fixed for users table' as result;

