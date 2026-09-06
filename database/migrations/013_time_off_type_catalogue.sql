-- =============================================================================
-- Migration: 013_time_off_type_catalogue.sql
-- Description: Configurable Time Off Type Catalogue & Flexible Comp Off (Earned, no fixed annual cap)
-- Owner: P2 (HR Operations)
-- =============================================================================

-- 1. Extend time_off_types table with full policy configuration columns
ALTER TABLE time_off_types
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS allocation_method VARCHAR(30) NOT NULL DEFAULT 'FIXED_ANNUAL',
  ADD COLUMN IF NOT EXISTS annual_allocation NUMERIC(5, 2) DEFAULT 20.00,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_employee_request BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_half_day BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS carry_forward_allowed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS carry_forward_limit NUMERIC(5, 2) DEFAULT 0.00;

-- 2. Add constraint for valid allocation methods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_time_off_types_allocation_method'
  ) THEN
    ALTER TABLE time_off_types
      ADD CONSTRAINT chk_time_off_types_allocation_method
      CHECK (allocation_method IN ('FIXED_ANNUAL', 'ACCRUED_MONTHLY', 'MANUAL', 'UNLIMITED', 'EARNED'));
  END IF;
END $$;

-- 3. Update existing standard leave types to respect exact enterprise policies
UPDATE time_off_types SET
  allocation_method = 'EARNED',
  annual_allocation = NULL,
  max_days_allowed = 0,
  is_paid = true,
  requires_approval = true,
  allow_employee_request = true,
  allow_half_day = true,
  description = 'Time off earned for approved qualifying extra work on non-working days or holidays'
WHERE code = 'COMP_OFF';

UPDATE time_off_types SET
  allocation_method = 'FIXED_ANNUAL',
  annual_allocation = 12.00,
  max_days_allowed = 12,
  is_paid = true,
  requires_approval = true,
  allow_employee_request = true,
  allow_half_day = true,
  description = 'Standard casual leave allowance for personal and family commitments'
WHERE code = 'CL';

UPDATE time_off_types SET
  allocation_method = 'FIXED_ANNUAL',
  annual_allocation = 10.00,
  max_days_allowed = 10,
  is_paid = true,
  requires_approval = true,
  allow_employee_request = true,
  allow_half_day = true,
  description = 'Medical leave for illness, medical appointments, and health recuperation'
WHERE code = 'SL';

UPDATE time_off_types SET
  allocation_method = 'FIXED_ANNUAL',
  annual_allocation = 18.00,
  max_days_allowed = 18,
  is_paid = true,
  requires_approval = true,
  allow_employee_request = true,
  allow_half_day = true,
  description = 'Annual privilege / earned leave accumulated over active tenure'
WHERE code = 'EL';

UPDATE time_off_types SET
  allocation_method = 'UNLIMITED',
  annual_allocation = NULL,
  max_days_allowed = 0,
  is_paid = false,
  requires_approval = true,
  allow_employee_request = true,
  allow_half_day = true,
  description = 'Leave without pay (unpaid) approved when paid quotas are exhausted'
WHERE code = 'LWP';

UPDATE time_off_types SET
  allocation_method = 'MANUAL',
  annual_allocation = 180.00,
  max_days_allowed = 180,
  is_paid = true,
  requires_approval = true,
  allow_employee_request = true,
  allow_half_day = false,
  description = 'Statutory maternity leave for eligible employees'
WHERE code = 'ML';

-- 4. Ensure COMP_OFF exists if it wasn't present
INSERT INTO time_off_types (
  name, code, description, is_paid, requires_approval,
  allocation_method, annual_allocation, max_days_allowed,
  allow_employee_request, allow_half_day, is_active
)
SELECT
  'Compensatory Off',
  'COMP_OFF',
  'Time off earned for approved qualifying extra work on non-working days or holidays',
  true,
  true,
  'EARNED',
  NULL,
  0,
  true,
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM time_off_types WHERE code = 'COMP_OFF'
);
