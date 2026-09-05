-- =============================================================================
-- Migration: 008_payruns_phase7.sql
-- Description: Enhance Payruns and Payslips schema for Phase 7 lifecycle & wizard
-- Owner: P3 (Payroll)
-- =============================================================================

-- 1. Relax/Update payruns status check to support full lifecycle
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payruns_status_check' 
    AND conrelid = 'payruns'::regclass
  ) THEN
    ALTER TABLE payruns DROP CONSTRAINT payruns_status_check;
  END IF;
END $$;

ALTER TABLE payruns 
  ADD CONSTRAINT payruns_status_check 
  CHECK (status IN ('DRAFT', 'COMPUTING', 'COMPUTED', 'VALIDATING', 'VALIDATED', 'CONFIRMED', 'PAID'));

-- 2. Relax/Update payslips status check to support lifecycle
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payslips_status_check' 
    AND conrelid = 'payslips'::regclass
  ) THEN
    ALTER TABLE payslips DROP CONSTRAINT payslips_status_check;
  END IF;
END $$;

ALTER TABLE payslips 
  ADD CONSTRAINT payslips_status_check 
  CHECK (status IN ('DRAFT', 'COMPUTED', 'VALIDATED', 'CONFIRMED', 'PAID'));

-- 3. Add columns to payruns table
ALTER TABLE payruns
  ADD COLUMN IF NOT EXISTS salary_structure_id UUID REFERENCES salary_structures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS employee_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS validation_notes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS warnings JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_employee_ids JSONB DEFAULT '[]'::jsonb;

-- 4. Add columns to payslips table
ALTER TABLE payslips
  ADD COLUMN IF NOT EXISTS salary_structure_id UUID REFERENCES salary_structures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS basic_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS allowances_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

-- 5. Add index on payrun period to facilitate period conflict checks
CREATE INDEX IF NOT EXISTS idx_payruns_period ON payruns(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payruns_structure ON payruns(salary_structure_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON payslips(employee_id);
