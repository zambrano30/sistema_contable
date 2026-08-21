-- =====================================================
-- Políticas de Seguridad para bucket 'avatars'
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =====================================================

-- Policy 1: Allow public read access to avatars
CREATE POLICY "Allow public read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy 2: Allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Policy 3: Allow authenticated users to update their avatars
CREATE POLICY "Allow authenticated update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Policy 4: Allow authenticated users to delete their avatars
CREATE POLICY "Allow authenticated delete avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- =====================================================
-- ¡LISTO! Ahora el sistema de avatares funciona completamente
-- =====================================================
