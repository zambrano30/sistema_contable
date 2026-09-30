-- Create audit_logs table for comprehensive logging
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL, -- Table where action occurred
  record_id UUID,
  old_data JSONB, -- Previous values for UPDATE/DELETE
  new_data JSONB, -- New values for CREATE/UPDATE
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Create indexes for fast queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_company_id ON public.audit_logs(company_id);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read audit logs from their company
CREATE POLICY audit_logs_read_own_company ON public.audit_logs
  FOR SELECT
  USING (
    company_id = get_active_company_id()
  );

-- RLS Policy: Only system can insert into audit_logs
CREATE POLICY audit_logs_insert_system ON public.audit_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- Function to log changes
CREATE OR REPLACE FUNCTION log_audit_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_data,
      company_id,
      created_at
    ) VALUES (
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      row_to_json(OLD),
      OLD.company_id,
      NOW()
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      company_id,
      created_at
    ) VALUES (
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      row_to_json(OLD),
      row_to_json(NEW),
      NEW.company_id,
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      new_data,
      company_id,
      created_at
    ) VALUES (
      auth.uid(),
      'CREATE',
      TG_TABLE_NAME,
      NEW.id,
      row_to_json(NEW),
      NEW.company_id,
      NOW()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers to main tables
-- Note: Execute these separately if tables don't exist yet

-- Example: CREATE TRIGGER invoices_audit_trigger
-- AFTER INSERT OR UPDATE OR DELETE ON public.invoices
-- FOR EACH ROW EXECUTE FUNCTION log_audit_change();

-- Example: CREATE TRIGGER clients_audit_trigger
-- AFTER INSERT OR UPDATE OR DELETE ON public.clients
-- FOR EACH ROW EXECUTE FUNCTION log_audit_change();

-- Example: CREATE TRIGGER products_audit_trigger
-- AFTER INSERT OR UPDATE OR DELETE ON public.products
-- FOR EACH ROW EXECUTE FUNCTION log_audit_change();

-- Example: CREATE TRIGGER expenses_audit_trigger
-- AFTER INSERT OR UPDATE OR DELETE ON public.expenses
-- FOR EACH ROW EXECUTE FUNCTION log_audit_change();
