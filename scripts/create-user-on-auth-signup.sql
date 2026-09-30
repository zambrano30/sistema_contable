-- Crear trigger que cree automáticamente un registro en 'users' cuando se registra en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Extraer datos del metadata de Supabase Auth (solo cedula y nombre están disponibles)
  INSERT INTO public.users (
    id,
    cedula,
    nombre,
    email,
    rol,
    is_active
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'cedula', 'TEMP-' || gen_random_uuid()::TEXT),
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    NEW.email,
    'Vendedor',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    cedula = EXCLUDED.cedula,
    nombre = EXCLUDED.nombre,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sincronizar usuarios existentes en Supabase Auth que no tengan registro en 'users'
INSERT INTO public.users (
  id,
  cedula,
  nombre,
  email,
  rol,
  is_active
)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'cedula', 'TEMP-' || gen_random_uuid()::TEXT),
  COALESCE(u.raw_user_meta_data->>'nombre', u.email),
  u.email,
  'Vendedor',
  true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = u.id
)
ON CONFLICT (id) DO NOTHING;

