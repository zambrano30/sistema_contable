BEGIN;

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  legal_name TEXT,
  tax_id TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agregar columnas faltantes si la tabla ya existe
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.company_memberships (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Administrador',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, user_id)
);

CREATE OR REPLACE FUNCTION public.is_company_member(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships membership
    WHERE membership.company_id = target_company_id
      AND membership.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships membership
    WHERE membership.company_id = target_company_id
      AND membership.user_id = auth.uid()
      AND lower(membership.role) IN ('admin', 'administrador', 'owner')
  );
$$;

CREATE OR REPLACE FUNCTION public.create_company(
  p_name TEXT,
  p_legal_name TEXT DEFAULT NULL,
  p_tax_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  new_company_id UUID;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to create a company';
  END IF;

  IF p_name IS NULL OR char_length(trim(p_name)) NOT BETWEEN 2 AND 120 THEN
    RAISE EXCEPTION 'Company name must contain between 2 and 120 characters';
  END IF;

  INSERT INTO public.companies (name, legal_name, tax_id, created_by)
  VALUES (trim(p_name), NULLIF(trim(p_legal_name), ''), NULLIF(trim(p_tax_id), ''), current_user_id)
  RETURNING id INTO new_company_id;

  INSERT INTO public.company_memberships (company_id, user_id, role)
  VALUES (new_company_id, current_user_id, 'Administrador');

  RETURN new_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_company_member(
  p_company_id UUID,
  p_user_id UUID,
  p_role TEXT DEFAULT 'Vendedor'
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_company_admin(p_company_id) THEN
    RAISE EXCEPTION 'Only a company administrator can add members';
  END IF;

  IF p_role NOT IN ('Administrador', 'Vendedor', 'Contador', 'Gerente', 'Cocinero') THEN
    RAISE EXCEPTION 'Invalid company role';
  END IF;

  INSERT INTO public.company_memberships (company_id, user_id, role)
  VALUES (p_company_id, p_user_id, p_role)
  ON CONFLICT (company_id, user_id)
  DO UPDATE SET role = EXCLUDED.role;
END;
$$;

REVOKE ALL ON FUNCTION public.is_company_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_company_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_company(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_company_member(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_company_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_company(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_company_member(UUID, UUID, TEXT) TO authenticated;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_read_members ON public.companies;
CREATE POLICY companies_read_members ON public.companies
  FOR SELECT TO authenticated
  USING (public.is_company_member(id));

DROP POLICY IF EXISTS companies_update_admins ON public.companies;
CREATE POLICY companies_update_admins ON public.companies
  FOR UPDATE TO authenticated
  USING (public.is_company_admin(id))
  WITH CHECK (public.is_company_admin(id));

DROP POLICY IF EXISTS memberships_read_self_or_admin ON public.company_memberships;
CREATE POLICY memberships_read_self_or_admin ON public.company_memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_company_admin(company_id));

DROP POLICY IF EXISTS memberships_manage_admins ON public.company_memberships;
CREATE POLICY memberships_manage_admins ON public.company_memberships
  FOR ALL TO authenticated
  USING (public.is_company_admin(company_id))
  WITH CHECK (public.is_company_admin(company_id));

DO $$
DECLARE
  legacy_company_id UUID;
  tenant_table TEXT;
  existing_policy RECORD;
BEGIN
  SELECT id INTO legacy_company_id
  FROM public.companies
  WHERE name = 'Empresa principal' AND created_by IS NULL
  ORDER BY created_at
  LIMIT 1;

  IF legacy_company_id IS NULL THEN
    INSERT INTO public.companies (name)
    VALUES ('Empresa principal')
    RETURNING id INTO legacy_company_id;
  END IF;

  IF to_regclass('public.users') IS NOT NULL THEN
    INSERT INTO public.company_memberships (company_id, user_id, role)
    SELECT
      legacy_company_id,
      app_user.id,
      CASE lower(coalesce(app_user.role, ''))
        WHEN 'admin' THEN 'Administrador'
        WHEN 'administrator' THEN 'Administrador'
        WHEN 'administrador' THEN 'Administrador'
        WHEN 'seller' THEN 'Vendedor'
        WHEN 'saler' THEN 'Vendedor'
        WHEN 'vendedor' THEN 'Vendedor'
        WHEN 'accountant' THEN 'Contador'
        WHEN 'contador' THEN 'Contador'
        WHEN 'manager' THEN 'Gerente'
        WHEN 'gerente' THEN 'Gerente'
        WHEN 'cook' THEN 'Cocinero'
        WHEN 'cooker' THEN 'Cocinero'
        WHEN 'cocinero' THEN 'Cocinero'
        WHEN 'chef' THEN 'Cocinero'
        ELSE 'Vendedor'
      END
    FROM public.users app_user
    ON CONFLICT (company_id, user_id) DO NOTHING;
  ELSE
    INSERT INTO public.company_memberships (company_id, user_id, role)
    SELECT legacy_company_id, auth_user.id, 'Administrador'
    FROM auth.users auth_user
    ON CONFLICT (company_id, user_id) DO NOTHING;
  END IF;

  FOREACH tenant_table IN ARRAY ARRAY[
    'clients',
    'products',
    'invoices',
    'invoice_items',
    'inventory_movements',
    'expenses',
    'providers',
    'commands',
    'payments',
    'sale_transactions',
    'categories',
    'settings',
    'suppliers'
  ] LOOP
    IF to_regclass(format('public.%I', tenant_table)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE',
      tenant_table
    );
    EXECUTE format(
      'UPDATE public.%I SET company_id = $1 WHERE company_id IS NULL',
      tenant_table
    ) USING legacy_company_id;
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN company_id SET NOT NULL', tenant_table);
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (company_id)',
      'idx_' || tenant_table || '_company_id',
      tenant_table
    );

    FOR existing_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tenant_table
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', existing_policy.policyname, tenant_table);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format(
      'CREATE POLICY company_members_only ON public.%I FOR ALL TO authenticated USING (public.is_company_member(company_id)) WITH CHECK (public.is_company_member(company_id))',
      tenant_table
    );
  END LOOP;
END;
$$;

COMMIT;