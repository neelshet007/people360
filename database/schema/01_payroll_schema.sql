-- =============================================================================
-- PeoplePay360 — P3 Payroll Domain Schema (Phase 1 Database Specification)
-- Owner: P3 (Payroll)
-- Follows database naming conventions: snake_case tables/columns, TIMESTAMPTZ.
-- =============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. SALARY STRUCTURES TABLE
-- Master blueprints grouping compensation components (e.g. Standard Full-Time)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salary_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. SALARY RULES TABLE
-- Specific calculation rules (Allowances, Deductions, Company Contributions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salary_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_structure_id UUID REFERENCES salary_structures(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('ALLOWANCE', 'DEDUCTION', 'COMPANY_CONTRIBUTION')),
  calculation_type VARCHAR(50) NOT NULL CHECK (calculation_type IN ('FIXED', 'PERCENTAGE', 'FORMULA')),
  amount_or_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  sequence_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_rules_structure_id ON salary_rules(salary_structure_id);

-- -----------------------------------------------------------------------------
-- 3. PAYRUNS TABLE
-- Batch periodic payroll execution cycles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payruns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  execution_date TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'COMPUTING', 'CONFIRMED', 'PAID')),
  total_gross NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_net NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. PAYSLIPS TABLE
-- Individual employee payroll statement generated during a payrun
-- Note: employee_id and contract_id reference P1 entities
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payrun_id UUID NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  contract_id UUID,
  worked_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  absent_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  gross_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'PAID')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payslips_payrun_id ON payslips(payrun_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON payslips(employee_id);

-- -----------------------------------------------------------------------------
-- 5. PAYSLIP LINES TABLE
-- Itemized line items calculated for an individual payslip
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payslip_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payslip_id UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
  salary_rule_id UUID REFERENCES salary_rules(id) ON DELETE SET NULL,
  rule_name VARCHAR(255) NOT NULL,
  rule_code VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  rate NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payslip_lines_payslip_id ON payslip_lines(payslip_id);
