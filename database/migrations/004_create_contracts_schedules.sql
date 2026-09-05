-- =============================================================================
-- Migration: 004_create_contracts_schedules.sql
-- Description: Create P1 Working Schedules and Employment Contracts tables
-- Owner: P1 (Core HR)
-- Follows strict database naming conventions: snake_case tables/columns, TIMESTAMPTZ, UUID PKs.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WORKING SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS working_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  standard_hours_per_day NUMERIC(4, 2) NOT NULL DEFAULT 8.00,
  standard_days_per_week INTEGER NOT NULL DEFAULT 5,
  total_weekly_hours NUMERIC(5, 2) NOT NULL DEFAULT 40.00,
  break_duration_minutes INTEGER NOT NULL DEFAULT 60,
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  days_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CONTRACTS TABLE
-- Supports historical contracts with validity intervals [start_date, end_date]
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contract_type VARCHAR(50) NOT NULL DEFAULT 'PERMANENT' CHECK (contract_type IN ('PERMANENT', 'FIXED_TERM', 'PROBATION', 'INTERNSHIP', 'CONTRACTOR')),
  wage_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  wage_type VARCHAR(50) NOT NULL DEFAULT 'MONTHLY' CHECK (wage_type IN ('MONTHLY', 'HOURLY', 'WEEKLY', 'ANNUAL')),
  start_date DATE NOT NULL,
  end_date DATE,
  working_schedule_id UUID REFERENCES working_schedules(id) ON DELETE SET NULL,
  salary_structure_id UUID REFERENCES salary_structures(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DRAFT', 'EXPIRED', 'TERMINATED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_contract_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_contracts_employee_id ON contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_date_range ON contracts(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_schedule_id ON contracts(working_schedule_id);
