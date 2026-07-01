CREATE TABLE IF NOT EXISTS module_phase_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id text NOT NULL,
  phase_id text NOT NULL,
  order_in_phase int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(module_id, phase_id)
);

CREATE INDEX IF NOT EXISTS idx_mpa_module ON module_phase_assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_mpa_phase ON module_phase_assignments(phase_id);

ALTER TABLE module_phase_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read module phase assignments" ON module_phase_assignments FOR SELECT USING (true);
