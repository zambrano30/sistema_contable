-- SCRIPT CRÍTICO: Crear función para asignar vendedor a empresa
-- Ejecutar EN SUPABASE SQL EDITOR (una sola vez)
-- Esta función ejecuta con permisos SECURITY DEFINER, bypass de RLS

DROP FUNCTION IF EXISTS public.assign_vendor_to_company(UUID, UUID);

CREATE OR REPLACE FUNCTION public.assign_vendor_to_company(
  p_vendor_id UUID,
  p_company_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Validaciones básicas
  IF p_vendor_id IS NULL OR p_company_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Vendor ID and Company ID are required');
  END IF;

  -- Intentar INSERT (ignorar si ya existe)
  INSERT INTO public.company_memberships (company_id, user_id, role)
  VALUES (p_company_id, p_vendor_id, 'Vendedor')
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'message', 'Vendor assigned successfully');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Otorgar permisos para que cualquier usuario autenticado pueda llamar esta función
GRANT EXECUTE ON FUNCTION public.assign_vendor_to_company(UUID, UUID) TO authenticated, anon, service_role;

-- Verificación (deberías ver: 1 row)
SELECT COUNT(*) as "Función creada" FROM information_schema.routines 
WHERE routine_name = 'assign_vendor_to_company' AND routine_schema = 'public';
