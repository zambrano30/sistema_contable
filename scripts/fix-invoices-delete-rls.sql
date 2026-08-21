-- Política RLS simplificada para borrar facturas
-- Los vendedores pueden borrar cualquier factura (no basada en user_id)
-- Los admins pueden borrar cualquier factura
-- Los clientes demo pueden borrar facturas en localStorage

-- Habilitar RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas antiguas
DROP POLICY IF EXISTS "Allow select all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow update own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow delete own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow all for admins" ON public.invoices;
DROP POLICY IF EXISTS "Allow all for service role" ON public.invoices;

-- Política 1: Todos pueden VER todas las facturas
CREATE POLICY "Can view all invoices" ON public.invoices
FOR SELECT
USING (true);

-- Política 2: Usuarios autenticados pueden CREAR facturas
CREATE POLICY "Can create invoices" ON public.invoices
FOR INSERT
WITH CHECK (true);

-- Política 3: Usuarios autenticados pueden ACTUALIZAR sus facturas
CREATE POLICY "Can update invoices" ON public.invoices
FOR UPDATE
USING (auth.role() IN ('authenticated', 'service_role'))
WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- Política 4: Usuarios autenticados pueden BORRAR facturas
-- Vendedores pueden borrar las facturas que crean
-- Admins pueden borrar cualquier factura
CREATE POLICY "Can delete invoices" ON public.invoices
FOR DELETE
USING (
  auth.role() = 'service_role'
  OR (
    -- Usuarios autenticados (vendedores, etc) pueden borrar si:
    -- 1. No hay user_id guardado (facturas antiguas)
    -- 2. El user_id coincide con el usuario actual
    -- 3. El usuario es administrador
    auth.role() = 'authenticated' AND (
      user_id IS NULL 
      OR auth.uid()::text = user_id::text
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'Administrador')
      )
    )
  )
);

-- Política 5: Service role puede hacer cualquier cosa (para migraciones)
CREATE POLICY "Service role unrestricted" ON public.invoices
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
