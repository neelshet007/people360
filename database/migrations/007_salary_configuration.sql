-- =============================================================================
-- Migration: 007_salary_configuration.sql
-- Description: Salary Configuration enhancements (Rules Category, Percentage Base, Formula, Active state)
-- Owner: P3 (Payroll)
-- Follows strict database naming conventions: snake_case tables/columns, TIMESTAMPTZ, UUID PKs.
-- =============================================================================

-- 1. Drop existing category CHECK constraint on salary_rules if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'salary_rules_category_check' 
    AND conrelid = 'salary_rules'::regclass
  ) THEN
    ALTER TABLE salary_rules DROP CONSTRAINT salary_rules_category_check;
  END IF;
END $$;

-- 2. Re-create category CHECK constraint to support all standard salary categories
ALTER TABLE salary_rules 
  ADD CONSTRAINT salary_rules_category_check 
  CHECK (category IN ('BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET', 'COMPANY_CONTRIBUTION'));

-- 3. Add percentage_base column for PERCENTAGE calculation types (e.g., 'BASIC', 'GROSS')
ALTER TABLE salary_rules 
  ADD COLUMN IF NOT EXISTS percentage_base VARCHAR(100);

-- 4. Add formula column for FORMULA calculation types (e.g., 'BASIC + HRA + TRANSPORT + SPL_ALLOW')
ALTER TABLE salary_rules 
  ADD COLUMN IF NOT EXISTS formula TEXT;

-- 5. Add is_active column for active/inactive rule status
ALTER TABLE salary_rules 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 6. Add description column to salary_rules if not present
ALTER TABLE salary_rules 
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 7. Ensure salary_structures has description and is_active columns
ALTER TABLE salary_structures 
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE salary_structures 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_salary_rules_structure_seq ON salary_rules(salary_structure_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_salary_rules_code ON salary_rules(code);
CREATE INDEX IF NOT EXISTS idx_salary_rules_category ON salary_rules(category);
