-- Corregir políticas RLS para permitir que vendedores borren sus propias facturas

-- Habilitar RLS si no está habilitado
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas RLS existentes
DROP POLICY IF EXISTS "Allow select all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow update own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow delete own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow all for admins" ON public.invoices;
DROP POLICY IF EXISTS "Allow all for service role" ON public.invoices;

-- Política 1: Todos pueden ver las facturas
CREATE POLICY "Allow select all invoices" ON public.invoices
FOR SELECT
USING (true);

-- Política 2: Usuarios autenticados pueden crear facturas
CREATE POLICY "Allow create invoices" ON public.invoices
FOR INSERT
WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Política 3: Los usuarios pueden actualizar sus propias facturas
CREATE POLICY "Allow update own invoices" ON public.invoices
FOR UPDATE
USING (auth.uid()::text = user_id OR auth.role() = 'service_role')
WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Política 4: Los usuarios pueden borrar sus propias facturas
CREATE POLICY "Allow delete own invoices" ON public.invoices
FOR DELETE
USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Política 5: Los administradores pueden hacer cualquier cosa
CREATE POLICY "Allow all for admins" ON public.invoices
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'Administrador')
  )
);

-- Política 6: Service role puede hacer cualquier cosa
CREATE POLICY "Allow all for service role" ON public.invoices
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
