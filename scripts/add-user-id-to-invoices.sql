-- Agregar columna user_id a la tabla invoices si no existe
-- Esta columna es necesaria para las políticas RLS y para registrar quién creó cada factura

-- Verificar si la columna existe antes de agregarla
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.invoices 
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear un índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
