-- Drop all existing policies first (if they exist)
-- PRODUCTS
DROP POLICY IF EXISTS "Allow users to view products" ON products;
DROP POLICY IF EXISTS "Allow users to create products" ON products;
DROP POLICY IF EXISTS "Allow users to update products" ON products;
DROP POLICY IF EXISTS "Allow users to delete products" ON products;

-- CLIENTS
DROP POLICY IF EXISTS "Allow users to view clients" ON clients;
DROP POLICY IF EXISTS "Allow users to create clients" ON clients;
DROP POLICY IF EXISTS "Allow users to update clients" ON clients;
DROP POLICY IF EXISTS "Allow users to delete clients" ON clients;

-- USERS
DROP POLICY IF EXISTS "Allow users to view their own record" ON users;
DROP POLICY IF EXISTS "Allow admins to view all users" ON users;
DROP POLICY IF EXISTS "Allow users to update their own record" ON users;
DROP POLICY IF EXISTS "Allow admins to update users" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own record" ON users;

-- Now recreate all policies
-- Enable RLS for all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============ PRODUCTS RLS ============
CREATE POLICY "Allow users to view products"
ON products
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to create products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to update products"
ON products
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow users to delete products"
ON products
FOR DELETE
TO authenticated
USING (true);

-- ============ CLIENTS RLS ============
CREATE POLICY "Allow users to view clients"
ON clients
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to create clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to update clients"
ON clients
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow users to delete clients"
ON clients
FOR DELETE
TO authenticated
USING (true);

-- ============ USERS RLS ============
CREATE POLICY "Allow users to view their own record"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow admins to view all users"
ON users
FOR SELECT
TO authenticated
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow users to update their own record"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admins to update users"
ON users
FOR UPDATE
TO authenticated
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
WITH CHECK (true);

CREATE POLICY "Allow users to insert their own record"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
