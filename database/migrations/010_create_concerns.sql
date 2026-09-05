-- =============================================================================
-- Migration: 010_create_concerns.sql
-- Description: Structured HR Concern Communication & Case Management System
-- Follows strict database naming conventions: snake_case, TIMESTAMPTZ, UUID PKs.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sequence for human-readable concern code (e.g. CON-1001)
CREATE SEQUENCE IF NOT EXISTS concern_code_seq START WITH 1001;

-- 1. CONCERNS MASTER TABLE
CREATE TABLE IF NOT EXISTS concerns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concern_code VARCHAR(50) UNIQUE NOT NULL DEFAULT ('CON-' || nextval('concern_code_seq')),
    raised_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    subject_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('ATTENDANCE', 'TIME_OFF', 'PAYROLL', 'CONTRACT', 'WORKPLACE', 'POLICY', 'OTHER')),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'WAITING_FOR_EMPLOYEE', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    related_entity_type VARCHAR(50) CHECK (related_entity_type IN ('ATTENDANCE', 'TIME_OFF_REQUEST', 'PAYSLIP', 'CONTRACT', 'OTHER') OR related_entity_type IS NULL),
    related_entity_id UUID,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for optimal lookup & filtering
CREATE INDEX IF NOT EXISTS idx_concerns_raised_by ON concerns(raised_by_user_id);
CREATE INDEX IF NOT EXISTS idx_concerns_subject_emp ON concerns(subject_employee_id);
CREATE INDEX IF NOT EXISTS idx_concerns_status ON concerns(status);
CREATE INDEX IF NOT EXISTS idx_concerns_category ON concerns(category);
CREATE INDEX IF NOT EXISTS idx_concerns_priority ON concerns(priority);
CREATE INDEX IF NOT EXISTS idx_concerns_assigned_to ON concerns(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_concerns_created_at ON concerns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_concerns_related ON concerns(related_entity_type, related_entity_id);

-- Trigger for concerns updated_at
DROP TRIGGER IF EXISTS trg_concerns_updated_at ON concerns;
CREATE TRIGGER trg_concerns_updated_at
BEFORE UPDATE ON concerns
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- 2. CONCERN MESSAGES TABLE
CREATE TABLE IF NOT EXISTS concern_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concern_id UUID NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_concern_messages_concern_id ON concern_messages(concern_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_concern_messages_sender ON concern_messages(sender_user_id);

-- Trigger for concern_messages updated_at
DROP TRIGGER IF EXISTS trg_concern_messages_updated_at ON concern_messages;
CREATE TRIGGER trg_concern_messages_updated_at
BEFORE UPDATE ON concern_messages
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- 3. CONCERN STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS concern_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concern_id UUID NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_concern_status_history_concern_id ON concern_status_history(concern_id, created_at ASC);
