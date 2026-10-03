-- Script: Crear función RPC para asignar vendedores a empresas
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.assign_vendor_to_company(
  p_vendor_id UUID,
  p_company_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  vendor_exists BOOLEAN;
  company_exists BOOLEAN;
  already_assigned BOOLEAN;
BEGIN
  -- Validaciones
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Authentication is required'::TEXT;
    RETURN;
  END IF;

  IF p_vendor_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Vendor ID is required'::TEXT;
    RETURN;
  END IF;

  IF p_company_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Company ID is required'::TEXT;
    RETURN;
  END IF;

  -- Verificar que el user actual sea admin de la empresa
  IF NOT public.is_company_admin(p_company_id) THEN
    RETURN QUERY SELECT FALSE, 'You must be an admin of this company'::TEXT;
    RETURN;
  END IF;

  -- Verificar que el vendedor exista
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = p_vendor_id) INTO vendor_exists;
  IF NOT vendor_exists THEN
    RETURN QUERY SELECT FALSE, 'Vendor user does not exist'::TEXT;
    RETURN;
  END IF;

  -- Verificar que la empresa exista
  SELECT EXISTS(SELECT 1 FROM public.companies WHERE id = p_company_id) INTO company_exists;
  IF NOT company_exists THEN
    RETURN QUERY SELECT FALSE, 'Company does not exist'::TEXT;
    RETURN;
  END IF;

  -- Verificar que no esté ya asignado
  SELECT EXISTS(
    SELECT 1 FROM public.company_memberships 
    WHERE company_id = p_company_id AND user_id = p_vendor_id
  ) INTO already_assigned;
  
  IF already_assigned THEN
    RETURN QUERY SELECT TRUE, 'Vendor is already assigned to this company'::TEXT;
    RETURN;
  END IF;

  -- Asignar vendedor a empresa
  INSERT INTO public.company_memberships (company_id, user_id, role)
  VALUES (p_company_id, p_vendor_id, 'Vendedor')
  ON CONFLICT (company_id, user_id) DO NOTHING;

  RETURN QUERY SELECT TRUE, 'Vendor assigned successfully'::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, SQLERRM::TEXT;
END;
$$;

-- Otorgar permisos para llamar esta función
GRANT EXECUTE ON FUNCTION public.assign_vendor_to_company(UUID, UUID) TO authenticated, anon, service_role;

-- Comentario
COMMENT ON FUNCTION public.assign_vendor_to_company(UUID, UUID) IS
'Asigna un vendedor a una empresa. Solo admins de la empresa pueden ejecutar esta función. Se usa cuando se crea un vendedor desde AdminPage.';
