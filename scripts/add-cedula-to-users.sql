-- Agregar columna cedula a tabla users si no existe
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS cedula TEXT UNIQUE;

-- Crear índice en cedula para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_cedula ON public.users(cedula);

-- Permitir que users busque por cedula
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy para que usuarios autenticados puedan ver su propio registro por cedula
DROP POLICY IF EXISTS users_read_own ON public.users;
CREATE POLICY users_read_own ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Policy para que usuarios autenticados puedan actualizar su propio registro
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMIT;
