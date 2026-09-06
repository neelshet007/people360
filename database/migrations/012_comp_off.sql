-- =============================================================================
-- Migration: 012_comp_off.sql
-- Description: Compensatory Off (Comp Off) — credits and redemption via timeoff
-- Owner: P2 (HR Operations) — ExFeat branch
-- =============================================================================

-- 1. Create comp_off_credits table
--    Tracks per-employee earned compensatory off (from working on holidays/weekends)
CREATE TABLE IF NOT EXISTS comp_off_credits (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID          NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date       DATE          NOT NULL,       -- the date the employee worked extra
  hours_worked    NUMERIC(5, 2) DEFAULT 8.00,
  reason          TEXT,                         -- "Worked on Diwali holiday", etc.
  days_credited   NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
  -- PENDING, APPROVED, REJECTED, EXPIRED, USED
  approved_by     UUID          REFERENCES users(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ,
  expires_at      DATE,                         -- 90 days from credit date by default
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_comp_off_employee ON comp_off_credits(employee_id);
CREATE INDEX IF NOT EXISTS idx_comp_off_status   ON comp_off_credits(status);
CREATE INDEX IF NOT EXISTS idx_comp_off_work_date ON comp_off_credits(work_date);

-- 3. Updated_at trigger
CREATE OR REPLACE FUNCTION update_comp_off_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comp_off_credits_updated_at ON comp_off_credits;
CREATE TRIGGER trg_comp_off_credits_updated_at
  BEFORE UPDATE ON comp_off_credits
  FOR EACH ROW EXECUTE FUNCTION update_comp_off_credits_updated_at();

-- 4. Seed COMP_OFF time_off_type if it doesn't exist
INSERT INTO time_off_types (name, code, is_paid, requires_approval, max_days_allowed)
SELECT
  'Compensatory Off',
  'COMP_OFF',
  true,   -- is_paid
  true,   -- requires_approval
  30      -- max 30 comp-off days per year
WHERE NOT EXISTS (
  SELECT 1 FROM time_off_types WHERE code = 'COMP_OFF'
);
