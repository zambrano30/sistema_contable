-- Corregir políticas RLS para permitir que el RPC inserte vendedores y cocineros

-- Eliminar políticas RLS existentes en la tabla users
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow all for service role" ON public.users;

-- Habilitar RLS si no está habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política 1: El RPC (SECURITY DEFINER) puede insertar sin restricciones
CREATE POLICY "SECURITY DEFINER functions can insert" ON public.users
FOR INSERT
WITH CHECK (true);

-- Política 2: Los usuarios pueden leer y actualizar sus propios datos
CREATE POLICY "Users can manage their own data" ON public.users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política 3: Service role puede hacer cualquier cosa (para migraciones/admin)
CREATE POLICY "Service role can do anything" ON public.users
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Política 4: Administradores pueden ver todos
CREATE POLICY "Admins can view all users" ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'Administrador'
  )
);
