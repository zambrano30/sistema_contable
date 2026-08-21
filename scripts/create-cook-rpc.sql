-- Limpieza: Eliminar función anterior si existe
DROP FUNCTION IF EXISTS create_cook_user_direct(TEXT, TEXT, TEXT);

-- Crear extensión pgcrypto si no existe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función RPC: registra cocinero en tabla users con UUID válido de auth.users
-- El cliente primero crea el usuario en auth.users, luego llama esta función
CREATE OR REPLACE FUNCTION register_cook_user(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  user_id UUID,
  message TEXT
) AS $$
DECLARE
BEGIN
  -- Validaciones
  IF p_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'User ID is required'::TEXT;
    RETURN;
  END IF;

  IF p_email IS NULL OR p_email = '' THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Email is required'::TEXT;
    RETURN;
  END IF;

  IF p_name IS NULL OR p_name = '' THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Name is required'::TEXT;
    RETURN;
  END IF;

  -- Intentar crear usuario en tabla users con el UUID válido
  BEGIN
    -- Insertar en tabla users con el UUID de auth.users
    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      created_at
    ) VALUES (
      p_user_id,
      p_email,
      p_name,
      'cocinero',
      NOW()
    );

    RETURN QUERY SELECT TRUE, p_user_id, 'Cook user registered successfully!'::TEXT;

  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, SQLERRM::TEXT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para llamar esta función
GRANT EXECUTE ON FUNCTION register_cook_user(UUID, TEXT, TEXT) TO authenticated, anon, service_role;





