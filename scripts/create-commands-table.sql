-- Crear tabla de comandas (órdenes de cocina)
CREATE TABLE IF NOT EXISTS commands (
  id BIGINT PRIMARY KEY DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
  invoice_id BIGINT NOT NULL,
  invoice_number VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, preparing, ready, delivered
  items JSONB NOT NULL DEFAULT '[]', -- Array de items: [{id, name, quantity, price}]
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
CREATE INDEX IF NOT EXISTS idx_commands_created_by ON commands(created_by);
CREATE INDEX IF NOT EXISTS idx_commands_created_at ON commands(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver comandas (cualquier usuario autenticado)
CREATE POLICY "Everyone can view commands"
  ON commands FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Solo el que creó la factura puede crear comandas
CREATE POLICY "Users can create commands for their invoices"
  ON commands FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Política: Todos pueden actualizar el estado de comandas
CREATE POLICY "Everyone can update command status"
  ON commands FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
