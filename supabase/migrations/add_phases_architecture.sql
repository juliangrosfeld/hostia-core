CREATE TABLE IF NOT EXISTS phases (
  id text PRIMARY KEY,
  track text NOT NULL CHECK (track IN ('casual-dining', 'fine-dining', 'fast-casual')),
  phase_number int NOT NULL CHECK (phase_number >= 1 AND phase_number <= 6),
  title text NOT NULL,
  goal text NOT NULL,
  outcome text NOT NULL,
  certification_title text NOT NULL,
  order_index int NOT NULL,
  UNIQUE(track, phase_number)
);

CREATE INDEX IF NOT EXISTS idx_phases_track ON phases(track);

ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read phases" ON phases FOR SELECT USING (true);

-- Add phase_id and order_in_phase to modules (text, not FK yet — we'll seed phases first)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS phase_id text;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS order_in_phase int;

CREATE INDEX IF NOT EXISTS idx_modules_phase ON modules(phase_id);

-- Phase completions: tracks when a staff finishes a phase + passes its exam
CREATE TABLE IF NOT EXISTS phase_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  phase_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  exam_score int NOT NULL CHECK (exam_score >= 0 AND exam_score <= 100),
  certificate_issued boolean NOT NULL DEFAULT true,
  UNIQUE(staff_id, phase_id)
);

CREATE INDEX IF NOT EXISTS idx_phase_completions_staff ON phase_completions(staff_id);
CREATE INDEX IF NOT EXISTS idx_phase_completions_property ON phase_completions(property_id);
CREATE INDEX IF NOT EXISTS idx_phase_completions_phase ON phase_completions(phase_id);

ALTER TABLE phase_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read own phase completions" ON phase_completions
  FOR SELECT USING (
    staff_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Staff can insert own phase completions" ON phase_completions
  FOR INSERT WITH CHECK (
    staff_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Managers and admins can read property phase completions" ON phase_completions
  FOR SELECT USING (
    property_id IN (
      SELECT property_id FROM users WHERE auth_id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- Seed all phase rows for the three tracks. Modules can be assigned to phases later as content is built.

INSERT INTO phases (id, track, phase_number, title, goal, outcome, certification_title, order_index) VALUES
-- Fine Dining: 6 phases
('fine-dining-phase-1', 'fine-dining', 1, 'Foundation', 'Learn the standards and fundamentals required to work confidently in a fine dining restaurant.', 'Can independently perform at a professional fine dining standard.', 'Certified Fine Dining Team Member', 1),
('fine-dining-phase-2', 'fine-dining', 2, 'Consistency & Execution', 'Deliver flawless execution shift after shift.', 'Consistently performs at a high standard across every service.', 'Certified Fine Dining Professional', 2),
('fine-dining-phase-3', 'fine-dining', 3, 'Guest Experience Mastery', 'Create memorable guest experiences through anticipation and personalization.', 'Can deliver exceptional guest experiences independently.', 'Certified Guest Experience Specialist', 3),
('fine-dining-phase-4', 'fine-dining', 4, 'Culinary & Beverage Expertise', 'Master menu, wine, and beverage knowledge to guide guests with authority.', 'Can confidently recommend pairings and articulate the menu.', 'Certified Culinary & Beverage Expert', 4),
('fine-dining-phase-5', 'fine-dining', 5, 'Luxury Hospitality Excellence', 'Operate at a luxury hospitality level — discretion, intuition, and elegance.', 'Embodies luxury hospitality at every guest interaction.', 'Certified Luxury Hospitality Professional', 5),
('fine-dining-phase-6', 'fine-dining', 6, 'Leadership & Hospitality Excellence', 'Lead by example, mentor others, and uphold the highest standards.', 'Functions as a senior team member and team leader.', 'Senior Hospitality Professional', 6),

-- Casual Dining: 5 phases
('casual-dining-phase-1', 'casual-dining', 1, 'Foundation', 'Learn the standards and fundamentals required to work confidently in a casual dining restaurant.', 'Can independently perform at a casual dining standard.', 'Certified Casual Dining Team Member', 1),
('casual-dining-phase-2', 'casual-dining', 2, 'Service & Operational Foundations', 'Master the service flow and operational rhythms of a busy floor.', 'Operates the floor with confidence and consistency.', 'Certified Service Professional', 2),
('casual-dining-phase-3', 'casual-dining', 3, 'Guest Service & Loyalty', 'Build loyal guests through warm, personal service.', 'Builds repeat-guest relationships through memorable service.', 'Certified Guest Service Specialist', 3),
('casual-dining-phase-4', 'casual-dining', 4, 'Sales & Experience Excellence', 'Drive revenue through suggestive selling and elevated guest experience.', 'Sells confidently while raising the guest experience.', 'Certified Sales & Experience Professional', 4),
('casual-dining-phase-5', 'casual-dining', 5, 'Leadership & Hospitality Excellence', 'Lead the floor, mentor newer staff, and uphold the standard.', 'Functions as a senior team member.', 'Senior Hospitality Professional', 5),

-- Fast Casual: 4 phases
('fast-casual-phase-1', 'fast-casual', 1, 'Onboarding', 'Learn the essentials to start serving guests confidently.', 'Can independently serve guests at a fast casual standard.', 'Certified Fast Casual Team Member', 1),
('fast-casual-phase-2', 'fast-casual', 2, 'Guest Service & Operational Foundations', 'Master the operational rhythm and guest interactions.', 'Operates the counter and floor with confidence.', 'Certified Service Professional', 2),
('fast-casual-phase-3', 'fast-casual', 3, 'Speed & Consistency', 'Deliver fast, accurate, consistent service every shift.', 'Maintains speed and accuracy under pressure.', 'Certified Speed & Consistency Specialist', 3),
('fast-casual-phase-4', 'fast-casual', 4, 'Sales Excellence', 'Drive revenue through upselling at the point of order.', 'Sells confidently while keeping throughput high.', 'Certified Sales Professional', 4)
ON CONFLICT (id) DO NOTHING;

-- Assign existing Casual Dining modules to Casual Dining Phase 1
-- "Casual Dining Standard" → phase 1, order 1
-- "Running the Floor" → phase 1, order 2
-- Note: universal modules (greetings, service-flow, etc.) get assigned to phase 1 of casual dining for now since that's the only track with real content. When fine dining phase 1 is built, we'll handle multi-track module assignment via property_modules.

UPDATE modules SET phase_id = 'casual-dining-phase-1', order_in_phase = 1 WHERE id = 'casual-dining-standard';
UPDATE modules SET phase_id = 'casual-dining-phase-1', order_in_phase = 2 WHERE id = 'casual-dining-floor';
