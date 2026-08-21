-- =====================================================
-- Habilitar actualización de avatar_url en tabla users
-- =====================================================

-- Opción 1: Deshabilitar RLS en tabla users (más permisivo para desarrollo)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Si quieres mantener RLS, usa esto en su lugar:
-- CREATE POLICY "Users can update their own profile"
-- ON users FOR UPDATE
-- USING (auth.uid() = id)
-- WITH CHECK (auth.uid() = id);

-- =====================================================
