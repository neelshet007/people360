-- =============================================================================
-- Migration: 011_bonus_allocation.sql
-- Description: Bonus Allocation feature — new table and payrun type support
-- Owner: P3 (Payroll) — ExFeat branch
-- =============================================================================

-- 1. Add payrun_type to payruns table (REGULAR = normal salary, BONUS = bonus cycle)
ALTER TABLE payruns
  ADD COLUMN IF NOT EXISTS payrun_type VARCHAR(20) NOT NULL DEFAULT 'REGULAR';

-- Drop existing check if present, then add updated one
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payruns_type_check'
    AND conrelid = 'payruns'::regclass
  ) THEN
    ALTER TABLE payruns DROP CONSTRAINT payruns_type_check;
  END IF;
END $$;

ALTER TABLE payruns
  ADD CONSTRAINT payruns_type_check
  CHECK (payrun_type IN ('REGULAR', 'BONUS', 'ADHOC'));

-- 2. Create bonus_allocations table
CREATE TABLE IF NOT EXISTS bonus_allocations (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  payrun_id      UUID         NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
  employee_id    UUID         NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  bonus_type     VARCHAR(50)  NOT NULL DEFAULT 'PERFORMANCE',
  -- Allowed: PERFORMANCE, FESTIVAL, ANNUAL, RETENTION, SPOT, CUSTOM
  amount         NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  remarks        TEXT,
  status         VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  -- Allowed: DRAFT, APPROVED, REJECTED, DISBURSED
  approved_by    UUID         REFERENCES users(id) ON DELETE SET NULL,
  approved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_bonus_alloc_payrun   ON bonus_allocations(payrun_id);
CREATE INDEX IF NOT EXISTS idx_bonus_alloc_employee ON bonus_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_bonus_alloc_status   ON bonus_allocations(status);
CREATE INDEX IF NOT EXISTS idx_payruns_type         ON payruns(payrun_type);

-- 4. Updated_at trigger for bonus_allocations
CREATE OR REPLACE FUNCTION update_bonus_allocations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bonus_allocations_updated_at ON bonus_allocations;
CREATE TRIGGER trg_bonus_allocations_updated_at
  BEFORE UPDATE ON bonus_allocations
  FOR EACH ROW EXECUTE FUNCTION update_bonus_allocations_updated_at();
