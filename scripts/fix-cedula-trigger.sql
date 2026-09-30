-- FIX: Arreglar trigger para extraer cédula de raw_user_meta_data correctamente
-- Este script DEBE ejecutarse en Supabase SQL Editor

-- 1. Primero, limpiar cualquier dato incorrecto temporal
UPDATE public.users 
SET cedula = NULL 
WHERE cedula LIKE 'TEMP-%';

-- 2. Crear función mejorada que extraiga correctamente del metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  cedula_extracted TEXT;
  nombre_extracted TEXT;
BEGIN
  -- Extraer cédula y nombre de raw_user_meta_data (los metadata reales)
  cedula_extracted := NEW.raw_user_meta_data->>'cedula';
  nombre_extracted := NEW.raw_user_meta_data->>'nombre';
  
  -- Si no hay cedula en metadata, usar ID del usuario (fallback)
  IF cedula_extracted IS NULL OR cedula_extracted = '' THEN
    cedula_extracted := NEW.id::TEXT;
    RAISE WARNING 'No cedula found for user %, using ID as fallback', NEW.email;
  END IF;
  
  -- Si no hay nombre, usar email
  IF nombre_extracted IS NULL OR nombre_extracted = '' THEN
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
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    cedula_extracted,
    nombre_extracted,
    NEW.email,
    NEW.raw_user_meta_data->>'telefono',
    NEW.raw_user_meta_data->>'empresa_nombre',
    NEW.raw_user_meta_data->>'cargo',
    'Vendedor',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (cedula) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = COALESCE(NULLIF(EXCLUDED.nombre, ''), public.users.nombre),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Ver el resultado
SELECT 'Trigger actualizado correctamente' as resultado;
