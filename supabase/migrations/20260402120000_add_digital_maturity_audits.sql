-- Digital Maturity Audit table
-- Stores the results of the interactive maturity diagnostic per project/client
CREATE TABLE IF NOT EXISTS digital_maturity_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Audit type based on company size
  audit_type TEXT NOT NULL CHECK (audit_type IN ('tpe', 'pme', 'startup', 'ge')),

  -- Overall score (0-100 percentage)
  maturity_score INTEGER DEFAULT 0,
  maturity_level TEXT CHECK (maturity_level IN ('critique', 'ameliorer', 'satisfaisant')),

  -- Per-category scores as JSONB: { "category_key": { "score": 9, "max": 12, "pct": 75, "level": "satisfaisant" } }
  category_scores JSONB DEFAULT '{}',

  -- Raw responses: { "q1_1": "A", "q1_2": "B", ... }
  responses JSONB DEFAULT '{}',

  -- AI-generated recommendations (populated after completion)
  recommendations JSONB DEFAULT '[]',

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE digital_maturity_audits ENABLE ROW LEVEL SECURITY;

-- Clients can read/insert/update their own audits
CREATE POLICY "Clients can view own audits"
  ON digital_maturity_audits FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can create own audits"
  ON digital_maturity_audits FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own audits"
  ON digital_maturity_audits FOR UPDATE
  USING (auth.uid() = client_id);

-- Admins/consultants can view all audits
CREATE POLICY "Staff can view all audits"
  ON digital_maturity_audits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin', 'consultant')
    )
  );

-- Index for fast lookups
CREATE INDEX idx_maturity_audits_project ON digital_maturity_audits(project_id);
CREATE INDEX idx_maturity_audits_client ON digital_maturity_audits(client_id);
