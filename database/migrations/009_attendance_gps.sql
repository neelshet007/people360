-- =============================================================================
-- Migration: 009_attendance_gps.sql
-- Description: Add GPS coordinates and bounds checking to attendance
-- =============================================================================

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS distance_from_office_meters NUMERIC(10, 2);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_out_of_bounds BOOLEAN DEFAULT false;
