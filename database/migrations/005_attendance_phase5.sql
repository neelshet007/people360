-- =============================================================================
-- Migration: 005_attendance_phase5.sql
-- Description: Extend attendance table for Phase 5 Time & Attendance engine
-- Owner: P2 (HR Operations)
-- Adds expected_hours, difference_hours columns; expands status constraint
-- =============================================================================

-- 1. Add new numeric columns for expected/difference hours
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS expected_hours NUMERIC(5, 2) NOT NULL DEFAULT 8.00;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS difference_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.00;

-- 2. Drop old status constraint and add expanded one
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE attendance ADD CONSTRAINT attendance_status_check
  CHECK (status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE', 'OVERTIME', 'MISSING_CHECKOUT'));

-- 3. Add updated_at trigger (reusing function from employees migration)
DROP TRIGGER IF EXISTS trg_attendance_updated_at ON attendance;
CREATE TRIGGER trg_attendance_updated_at
BEFORE UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();
