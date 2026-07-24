-- Enable RLS for all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============ PRODUCTS RLS ============
-- Allow authenticated users to view all products
CREATE POLICY "Allow users to view products"
ON products
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users and admins to create products
CREATE POLICY "Allow users to create products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users and admins to update products
CREATE POLICY "Allow users to update products"
ON products
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users and admins to delete products
CREATE POLICY "Allow users to delete products"
ON products
FOR DELETE
TO authenticated
USING (true);

-- ============ CLIENTS RLS ============
-- Allow authenticated users to view all clients
CREATE POLICY "Allow users to view clients"
ON clients
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users and admins to create clients
CREATE POLICY "Allow users to create clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users and admins to update clients
CREATE POLICY "Allow users to update clients"
ON clients
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users and admins to delete clients
CREATE POLICY "Allow users to delete clients"
ON clients
FOR DELETE
TO authenticated
USING (true);

-- ============ USERS RLS ============
-- Allow users to view their own user record
CREATE POLICY "Allow users to view their own record"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Allow admins to view all users
CREATE POLICY "Allow admins to view all users"
ON users
FOR SELECT
TO authenticated
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Allow users to update their own record
CREATE POLICY "Allow users to update their own record"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to update any user record
CREATE POLICY "Allow admins to update users"
ON users
FOR UPDATE
TO authenticated
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
WITH CHECK (true);

-- Allow new users to be inserted (during signup)
CREATE POLICY "Allow users to insert their own record"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
