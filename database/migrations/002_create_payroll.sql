-- =============================================================================
-- Migration: 002_create_payroll.sql
-- Description: Create P3 Payroll tables (Salary Structures, Rules, Payruns, Payslips, Payslip Lines)
-- Owner: P3 (Payroll)
-- Follows strict database naming conventions: snake_case tables/columns, TIMESTAMPTZ, UUID PKs.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SALARY STRUCTURES TABLE
CREATE TABLE IF NOT EXISTS salary_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SALARY RULES TABLE
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

-- 3. PAYRUNS TABLE
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

CREATE INDEX IF NOT EXISTS idx_payruns_status ON payruns(status);

-- 4. PAYSLIPS TABLE
-- References authoritative employees entity with ON DELETE RESTRICT for financial record retention
CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payrun_id UUID NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
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
CREATE INDEX IF NOT EXISTS idx_payslips_status ON payslips(status);

-- 5. PAYSLIP LINES TABLE
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
