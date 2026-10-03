-- Tabla para gastos recurrentes
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  provider_id BIGINT REFERENCES providers(id),
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

-- Tabla para presupuestos de gastos
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

-- Tabla para archivos adjuntos de gastos
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

-- Tabla para auditoría de gastos
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

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_company ON recurring_expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_active ON recurring_expenses(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_due_date ON recurring_expenses(next_due_date);

CREATE INDEX IF NOT EXISTS idx_expense_budgets_company ON expense_budgets(company_id);
CREATE INDEX IF NOT EXISTS idx_expense_budgets_period ON expense_budgets(company_id, period, start_date);

CREATE INDEX IF NOT EXISTS idx_expense_attachments_expense ON expense_attachments(expense_id);

CREATE INDEX IF NOT EXISTS idx_expense_audit_expense ON expense_audit_log(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_audit_date ON expense_audit_log(created_at);

-- Políticas RLS
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view recurring expenses of their company" ON recurring_expenses
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM company_users WHERE company_id = recurring_expenses.company_id
    )
  );

ALTER TABLE expense_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view budgets of their company" ON expense_budgets
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM company_users WHERE company_id = expense_budgets.company_id
    )
  );

ALTER TABLE expense_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view attachments" ON expense_attachments FOR SELECT USING (true);

ALTER TABLE expense_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view audit logs" ON expense_audit_log FOR SELECT USING (true);
