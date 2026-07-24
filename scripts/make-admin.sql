-- Script para hacer un usuario ADMIN
-- Reemplaza 'usuario@facturacion.com' con tu email

-- Paso 1: Actualizar el rol del usuario a 'admin'
UPDATE users
SET role = 'admin'
WHERE email = 'usuario@facturacion.com';

-- Verificar que se actualizó correctamente
SELECT id, email, role FROM users WHERE email = 'usuario@facturacion.com';
