-- =============================================================================
-- Migration: 014_attendance_location_verification.sql
-- Description: Add location verification status, workplace location snapshots, and accuracy
-- =============================================================================

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS distance_from_office_meters NUMERIC(10, 2);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_out_of_bounds BOOLEAN DEFAULT false;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_status VARCHAR(50) DEFAULT 'LOCATION_UNAVAILABLE';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_verification_status VARCHAR(50) DEFAULT 'LOCATION_UNAVAILABLE';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS workplace_latitude NUMERIC(10, 7);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS workplace_longitude NUMERIC(10, 7);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS workplace_radius_meters NUMERIC(10, 2) DEFAULT 500.00;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_accuracy NUMERIC(10, 2);

-- Check constraint for valid location verification status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_attendance_location_status'
  ) THEN
    ALTER TABLE attendance 
    ADD CONSTRAINT chk_attendance_location_status 
    CHECK (location_status IN ('VERIFIED', 'OUTSIDE_RADIUS', 'LOCATION_UNAVAILABLE'));
  END IF;
END $$;

-- Update existing records to have consistent default snapshots
UPDATE attendance
SET 
  location_status = CASE 
    WHEN latitude IS NULL OR longitude IS NULL THEN 'LOCATION_UNAVAILABLE'
    WHEN is_out_of_bounds = true OR distance_from_office_meters > 500 THEN 'OUTSIDE_RADIUS'
    ELSE 'VERIFIED'
  END,
  location_verification_status = CASE 
    WHEN latitude IS NULL OR longitude IS NULL THEN 'LOCATION_UNAVAILABLE'
    WHEN is_out_of_bounds = true OR distance_from_office_meters > 500 THEN 'OUTSIDE_RADIUS'
    ELSE 'VERIFIED'
  END,
  workplace_latitude = COALESCE(workplace_latitude, 28.6139),
  workplace_longitude = COALESCE(workplace_longitude, 77.2090),
  workplace_radius_meters = COALESCE(workplace_radius_meters, 500.00)
WHERE location_status IS NULL OR location_status = 'LOCATION_UNAVAILABLE';
