const assert = require('assert');
const attendanceService = require('../modules/attendance/services');
const attendanceRepository = require('../modules/attendance/repositories/attendanceRepository');
const db = require('../database/db');

/**
 * Automated Test Suite — Attendance Location Verification Behavior
 */
async function runTests() {
  console.log('--- Testing Attendance Location Verification Behavior ---');

  // 1. Fetch a demo employee to test with
  const empRes = await db.query("SELECT id, display_name FROM employees WHERE email = 'alex.morgan@peoplepay360.com' OR email = 'rahul.sharma@peoplepay360.com' LIMIT 1");
  const emp = empRes.rows[0];
  assert.ok(emp, 'Employee record found');
  console.log(`Using test employee: ${emp.display_name} (${emp.id})`);

  const testDate = '2026-11-20'; // isolated test date
  // Clean up any test attendance on CURRENT_DATE first
  await db.query('DELETE FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE', [emp.id]);

  // Office Location: New Delhi HQ (28.6139, 77.2090), Radius = 500m
  const OFFICE_LAT = 28.6139;
  const OFFICE_LON = 77.2090;

  // -------------------------------------------------------------
  // TEST 1: Inside Allowed Workplace Radius (e.g. ~180m away)
  // -------------------------------------------------------------
  // 180 meters north: ~ 0.0016 degrees latitude difference
  const insideLat = OFFICE_LAT + 0.0016; 
  const insideLon = OFFICE_LON;

  const recordInside = await attendanceService.checkIn(
    emp.id,
    '127.0.0.1',
    insideLat,
    insideLon,
    15 // accuracy
  );

  assert.ok(recordInside, 'Check-in record created');
  assert.strictEqual(recordInside.status, 'PRESENT', 'Status must be PRESENT');
  assert.strictEqual(recordInside.location_status, 'VERIFIED', 'location_status must be VERIFIED');
  assert.strictEqual(recordInside.is_out_of_bounds, false, 'is_out_of_bounds must be false');
  assert.ok(parseFloat(recordInside.distance_from_office_meters) <= 500, `Distance should be <= 500m (got ${recordInside.distance_from_office_meters}m)`);
  console.log(`[PASS] Test 1: Inside radius check-in succeeded. Status: ${recordInside.status}, Location: ${recordInside.location_status} (${recordInside.distance_from_office_meters}m)`);

  // Clean up Test 1
  await db.query('DELETE FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE', [emp.id]);

  // -------------------------------------------------------------
  // TEST 2: Outside Allowed Workplace Radius (e.g. ~2.5km away)
  // MUST NOT BLOCK, MUST NOT MARK ABSENT
  // -------------------------------------------------------------
  // ~2.5 km away: ~ 0.022 degrees latitude difference
  const outsideLat = OFFICE_LAT + 0.022;
  const outsideLon = OFFICE_LON;

  const recordOutside = await attendanceService.checkIn(
    emp.id,
    '127.0.0.1',
    outsideLat,
    outsideLon,
    20 // accuracy
  );

  assert.ok(recordOutside, 'Check-in record created even when outside radius');
  assert.strictEqual(recordOutside.status, 'PRESENT', 'Status must STILL be PRESENT');
  assert.strictEqual(recordOutside.location_status, 'OUTSIDE_RADIUS', 'location_status must be OUTSIDE_RADIUS');
  assert.strictEqual(recordOutside.is_out_of_bounds, true, 'is_out_of_bounds must be true');
  assert.ok(parseFloat(recordOutside.distance_from_office_meters) > 500, `Distance should be > 500m (got ${recordOutside.distance_from_office_meters}m)`);
  assert.ok(recordOutside.notes && recordOutside.notes.includes('outside the configured workplace radius'), 'Audit warning note preserved');
  console.log(`[PASS] Test 2: Outside radius check-in succeeded without blocker. Status: ${recordOutside.status}, Location: ${recordOutside.location_status} (${recordOutside.distance_from_office_meters}m)`);

  // Clean up Test 2
  await db.query('DELETE FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE', [emp.id]);

  // -------------------------------------------------------------
  // TEST 3: Location Unavailable (Permission Denied / No GPS)
  // -------------------------------------------------------------
  const recordNoGps = await attendanceService.checkIn(
    emp.id,
    '127.0.0.1',
    null,
    null
  );

  assert.ok(recordNoGps, 'Check-in succeeds without GPS');
  assert.strictEqual(recordNoGps.status, 'PRESENT', 'Status must be PRESENT');
  assert.strictEqual(recordNoGps.location_status, 'LOCATION_UNAVAILABLE', 'location_status must be LOCATION_UNAVAILABLE');
  assert.strictEqual(recordNoGps.distance_from_office_meters, null, 'Distance should be null');
  console.log(`[PASS] Test 3: Location unavailable check-in succeeded. Status: ${recordNoGps.status}, Location: ${recordNoGps.location_status}`);

  // Clean up Test 3
  await db.query('DELETE FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE', [emp.id]);

  // -------------------------------------------------------------
  // TEST 4: Historical Context Snapshot Preservation
  // -------------------------------------------------------------
  const recordSnapshot = await attendanceRepository.createAttendance({
    employee_id: emp.id,
    date: testDate,
    clock_in: new Date().toISOString(),
    status: 'PRESENT',
    latitude: outsideLat,
    longitude: outsideLon,
    distance_from_office_meters: 2450.50,
    is_out_of_bounds: true,
    location_status: 'OUTSIDE_RADIUS',
    location_verification_status: 'OUTSIDE_RADIUS',
    workplace_latitude: 28.6139,
    workplace_longitude: 77.2090,
    workplace_radius_meters: 500.00,
  });

  const fetched = await attendanceRepository.findAttendanceById(recordSnapshot.id);
  assert.strictEqual(fetched.location_status, 'OUTSIDE_RADIUS', 'Snapshot location_status preserved');
  assert.strictEqual(parseFloat(fetched.workplace_radius_meters), 500.00, 'Snapshot workplace_radius_meters preserved');
  assert.strictEqual(parseFloat(fetched.distance_from_office_meters), 2450.50, 'Snapshot distance preserved');
  console.log('[PASS] Test 4: Historical context snapshot correctly stored and retrieved');

  // -------------------------------------------------------------
  // TEST 5: HR Filter by Location Status
  // -------------------------------------------------------------
  const outsideFilterResults = await attendanceService.listAttendance({
    location_status: 'OUTSIDE_RADIUS',
    date: testDate,
  });
  assert.ok(outsideFilterResults.data.length >= 1, 'Should find at least 1 record with OUTSIDE_RADIUS');
  assert.strictEqual(outsideFilterResults.data[0].id, recordSnapshot.id, 'Found the snapshot record');
  console.log(`[PASS] Test 5: HR filter by location_status returned ${outsideFilterResults.data.length} warning record(s)`);

  // Final Cleanup
  await db.query('DELETE FROM attendance WHERE employee_id = $1 AND date = $2', [emp.id, testDate]);

  console.log('--- ALL ATTENDANCE LOCATION TESTS PASSED SUCCESSFULLY ---');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
