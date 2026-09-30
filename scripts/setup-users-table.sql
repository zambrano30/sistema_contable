-- Crear tabla users con todos los atributos necesarios
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  empresa_nombre TEXT,
  cargo TEXT,
  rol TEXT NOT NULL DEFAULT 'Vendedor',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agregar columnas faltantes si la tabla ya existe
DO $$ 
BEGIN
  -- Agregar cedula si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'cedula'
  ) THEN
    ALTER TABLE public.users ADD COLUMN cedula TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT;
  END IF;

  -- Agregar nombre si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'nombre'
  ) THEN
    ALTER TABLE public.users ADD COLUMN nombre TEXT NOT NULL DEFAULT '';
  END IF;

  -- Agregar email si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT;
  END IF;

  -- Agregar telefono si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'telefono'
  ) THEN
    ALTER TABLE public.users ADD COLUMN telefono TEXT;
  END IF;

  -- Agregar empresa_nombre si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'empresa_nombre'
  ) THEN
    ALTER TABLE public.users ADD COLUMN empresa_nombre TEXT;
  END IF;

  -- Agregar cargo si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'cargo'
  ) THEN
    ALTER TABLE public.users ADD COLUMN cargo TEXT;
  END IF;

  -- Agregar rol si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'rol'
  ) THEN
    ALTER TABLE public.users ADD COLUMN rol TEXT NOT NULL DEFAULT 'Vendedor';
  END IF;

  -- Agregar is_active si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Agregar created_at si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  -- Agregar updated_at si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_cedula ON public.users(cedula);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies para users
DROP POLICY IF EXISTS users_read_own ON public.users;
CREATE POLICY users_read_own ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Función para crear usuario automáticamente desde auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  cedula_extracted TEXT;
  nombre_extracted TEXT;
BEGIN
  -- Extraer cédula y nombre de los metadata del usuario (pasados durante signup)
  cedula_extracted := NEW.user_metadata->>'cedula';
  nombre_extracted := NEW.user_metadata->>'nombre';
  
  -- Si no hay metadata, usar valores por defecto
  IF cedula_extracted IS NULL THEN
    cedula_extracted := NEW.id::TEXT;
  END IF;
  
  IF nombre_extracted IS NULL THEN
    nombre_extracted := NEW.email;
  END IF;
  
  -- Insertar en tabla users si no existe
  INSERT INTO public.users (
    id, 
    cedula, 
    nombre, 
    email, 
    telefono,
    empresa_nombre,
    cargo,
    rol, 
    is_active
  )
  VALUES (
    NEW.id,
    cedula_extracted,
    nombre_extracted,
    NEW.email,
    NEW.user_metadata->>'telefono',
    NEW.user_metadata->>'empresa_nombre',
    NEW.user_metadata->>'cargo',
    'Vendedor',
    true
  )
  ON CONFLICT (cedula) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear usuario al registrarse
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
