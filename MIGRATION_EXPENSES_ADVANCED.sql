-- 🔧 MIGRACIÓN: Tablas Avanzadas de Gastos
-- ⚠️ EJECUTAR UNA SOLA VEZ en Supabase SQL Editor
-- Si da error "ya existe", ignora y continúa

-- ============================================================
-- PASO 1: Crear tabla de empresas (si no existe)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PASO 2: Crear tabla de membresías de empresas (si no existe)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.company_memberships (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Administrador',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, user_id)
);

-- Crear alias para compatibilidad
CREATE OR REPLACE VIEW company_users AS
SELECT company_id, user_id FROM company_memberships;

-- ============================================================
-- PASO 3: Crear tabla de gastos (si no existe)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  amount DECIMAL(10, 2) NOT NULL,
  expense_date DATE NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PASO 4: Crear tabla para gastos recurrentes (sueldos, servicios, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  provider_id BIGINT, -- Opcional, sin referencia FK
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  frequency TEXT NOT NULL, -- 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
  day_of_month INT,
  next_due_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================================
-- Tabla para presupuestos de gastos con alertas
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_budgets (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  category TEXT NOT NULL,
  period TEXT NOT NULL, -- 'monthly', 'quarterly', 'yearly'
  budget_amount DECIMAL(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  alert_threshold INT DEFAULT 80, -- Alertar cuando alcanza 80% del presupuesto
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================================
-- Tabla para archivos adjuntos de gastos (facturas, recibos)
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_attachments (
  id BIGSERIAL PRIMARY KEY,
  expense_id BIGINT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  file_type TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by UUID REFERENCES auth.users(id),
  is_verified BOOLEAN DEFAULT false
);

-- ============================================================
-- Tabla para auditoría de gastos (quién cambió qué y cuándo)
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_audit_log (
  id BIGSERIAL PRIMARY KEY,
  expense_id BIGINT REFERENCES expenses(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject'
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ÍNDICES para mejor rendimiento
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_company ON recurring_expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_active ON recurring_expenses(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_due_date ON recurring_expenses(next_due_date);

CREATE INDEX IF NOT EXISTS idx_expense_budgets_company ON expense_budgets(company_id);
CREATE INDEX IF NOT EXISTS idx_expense_budgets_period ON expense_budgets(company_id, period, start_date);

CREATE INDEX IF NOT EXISTS idx_expense_attachments_expense ON expense_attachments(expense_id);

CREATE INDEX IF NOT EXISTS idx_expense_audit_expense ON expense_audit_log(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_audit_date ON expense_audit_log(created_at);

-- ============================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================

-- Habilitar RLS en la tabla de gastos
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view expenses of their company" ON expenses;
DROP POLICY IF EXISTS "Users can insert expenses for their company" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses of their company" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses of their company" ON expenses;

CREATE POLICY "Users can view expenses of their company" ON expenses
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM company_users WHERE company_id = expenses.company_id
    )
  );

CREATE POLICY "Users can insert expenses for their company" ON expenses
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM company_users WHERE company_id = expenses.company_id
    )
  );

CREATE POLICY "Users can update expenses of their company" ON expenses
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM company_users WHERE company_id = expenses.company_id
    )
  );

CREATE POLICY "Users can delete expenses of their company" ON expenses
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM company_users WHERE company_id = expenses.company_id
    )
  );

ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view recurring expenses of their company" ON recurring_expenses;
CREATE POLICY "Users can view recurring expenses of their company" ON recurring_expenses
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM company_users WHERE company_id = recurring_expenses.company_id
    )
  );

ALTER TABLE expense_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view budgets of their company" ON expense_budgets;
CREATE POLICY "Users can view budgets of their company" ON expense_budgets
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM company_users WHERE company_id = expense_budgets.company_id
    )
  );

ALTER TABLE expense_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view attachments" ON expense_attachments;
CREATE POLICY "Users can view attachments" ON expense_attachments FOR SELECT USING (true);

ALTER TABLE expense_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view audit logs" ON expense_audit_log;
CREATE POLICY "Users can view audit logs" ON expense_audit_log FOR SELECT USING (true);

-- ============================================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================================
-- Las nuevas tablas están listas para usar
-- La aplicación puede ahora:
-- - Crear gastos recurrentes (automáticos)
-- - Establecer presupuestos con alertas
-- - Adjuntar documentos a gastos
-- - Mantener auditoría completa de cambios
