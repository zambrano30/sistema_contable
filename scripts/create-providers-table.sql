-- Create providers used by expense records
CREATE TABLE IF NOT EXISTS providers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "providers_authenticated" ON providers;
CREATE POLICY "providers_authenticated" ON providers
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_active_name ON providers (LOWER(name)) WHERE is_active = true;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS provider_id BIGINT REFERENCES providers(id);
CREATE INDEX IF NOT EXISTS idx_expenses_provider_id ON expenses(provider_id);
