const attendanceRepository = require('../repositories/attendanceRepository');
const ApiError = require('../../../utils/ApiError');

/**
 * Attendance Service Layer — Phase 5
 * Owner: P2 (HR Operations)
 * Complete business logic: check-in, check-out, status calc, history, HR management, correction.
 */

// ─── Status Thresholds ─────────────────────────────────────────
const LATE_GRACE_MINUTES = 15;       // >15 min after start_time = LATE
const HALF_DAY_THRESHOLD = 4.0;      // < 4 hrs worked = HALF_DAY
const OVERTIME_THRESHOLD = 0.5;      // > expected + 0.5 hrs = OVERTIME

/** Parse "HH:MM" string to minutes since midnight */
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/** Round to 2 decimal places */
function round2(n) {
  return Math.round(n * 100) / 100;
}

/** 
 * Calculate distance between two points in meters using the Haversine formula.
 * Simple, vanilla JS math implementation for hackathon requirements.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const toRad = (value) => (value * Math.PI) / 180;
  
  const R = 6371e3; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}

/**
 * Determine check-in status using server time vs schedule start.
 * PRESENT if within LATE_GRACE_MINUTES of schedule start, else LATE.
 */
function determineCheckInStatus(clockInTime, scheduleStartTime) {
  if (!scheduleStartTime) return 'PRESENT';
  const clockInDate = new Date(clockInTime);
  const clockInMinutes = clockInDate.getUTCHours() * 60 + clockInDate.getUTCMinutes();
  const startMinutes = parseTimeToMinutes(scheduleStartTime);
  if (startMinutes === null) return 'PRESENT';
  return clockInMinutes <= startMinutes + LATE_GRACE_MINUTES ? 'PRESENT' : 'LATE';
}

/**
 * Determine final status after check-out.
 * OVERTIME → HALF_DAY → LATE (preserved if was late) → PRESENT
 */
function determineFinalStatus(workedHours, expectedHours, wasLate) {
  if (workedHours >= expectedHours + OVERTIME_THRESHOLD) return 'OVERTIME';
  if (workedHours < HALF_DAY_THRESHOLD) return 'HALF_DAY';
  if (wasLate) return 'LATE';
  return 'PRESENT';
}

const attendanceService = {
  // ─────────────────────────────────────────────────────────────
  // EMPLOYEE: CHECK IN
  // ─────────────────────────────────────────────────────────────
  async checkIn(employeeId, ipAddress, latitude, longitude) {
    if (!employeeId) throw ApiError.badRequest('Employee ID is required');

    const now = new Date();
    const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD UTC

    // Check if already currently checked in without check-out
    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, todayDate);
    if (existing) {
      if (existing.clock_in && !existing.clock_out) {
        throw ApiError.conflict('You are already checked in.');
      }
      if (existing.clock_in && existing.clock_out) {
        // Allow re-checking in for overtime, extra shift, or flexible hours
        const schedule = await attendanceRepository.getScheduleForEmployee(employeeId, todayDate);
        const checkInStatus = determineCheckInStatus(now.toISOString(), schedule.start_time);
        const updated = await attendanceRepository.updateAttendance(existing.id, {
          clock_in: now.toISOString(),
          clock_out: null,
          status: checkInStatus,
        });
        return updated;
      }
    }

    // Resolve working schedule
    const schedule = await attendanceRepository.getScheduleForEmployee(employeeId, todayDate);
    const expectedHours = schedule.standard_hours_per_day || 8.0;
    const checkInStatus = determineCheckInStatus(now.toISOString(), schedule.start_time);

    // GPS Bounds Check (Hardcoded Office Location for simplicity)
    const OFFICE_LAT = 28.6139; // Example: New Delhi
    const OFFICE_LON = 77.2090;
    const ALLOWED_RADIUS_METERS = 200;

    let distanceMeters = null;
    let isOutOfBounds = false;

    if (latitude && longitude) {
      distanceMeters = haversineDistance(latitude, longitude, OFFICE_LAT, OFFICE_LON);
      if (distanceMeters > ALLOWED_RADIUS_METERS) {
        isOutOfBounds = true;
      } else {
        isOutOfBounds = false;
      }
    }

    const record = await attendanceRepository.createAttendance({
      employee_id: employeeId,
      date: todayDate,
      clock_in: now.toISOString(),
      clock_out: null,
      total_hours: 0.0,
      expected_hours: expectedHours,
      difference_hours: -expectedHours,
      status: checkInStatus,
      notes: null,
      latitude: latitude || null,
      longitude: longitude || null,
      distance_from_office_meters: distanceMeters ? round2(distanceMeters) : null,
      is_out_of_bounds: isOutOfBounds,
    });

    return record;
  },

  // ─────────────────────────────────────────────────────────────
  // EMPLOYEE: CHECK OUT
  // ─────────────────────────────────────────────────────────────
  async checkOut(employeeId) {
    if (!employeeId) throw ApiError.badRequest('Employee ID is required');

    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];

    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, todayDate);
    if (!existing) {
      throw ApiError.badRequest('You need to check in before checking out.');
    }
    if (!existing.clock_in) {
      throw ApiError.badRequest('You need to check in before checking out.');
    }
    if (existing.clock_out) {
      throw ApiError.conflict('You have already checked out for today.');
    }

    const clockIn = new Date(existing.clock_in);
    const clockOut = now;
    const sessionWorkedMs = Math.max(0, clockOut.getTime() - clockIn.getTime());
    const sessionHours = round2(sessionWorkedMs / (1000 * 60 * 60));
    const workedHours = round2(parseFloat(existing.total_hours || 0) + sessionHours);
    const expectedHours = parseFloat(existing.expected_hours || 8.0);
    const differenceHours = round2(workedHours - expectedHours);
    const wasLate = existing.status === 'LATE';
    const finalStatus = determineFinalStatus(workedHours, expectedHours, wasLate);

    const updated = await attendanceRepository.updateAttendance(existing.id, {
      clock_out: clockOut.toISOString(),
      total_hours: workedHours,
      difference_hours: differenceHours,
      status: finalStatus,
    });

    return updated;
  },

  // ─────────────────────────────────────────────────────────────
  // EMPLOYEE: ACTIVE ATTENDANCE STATE
  // ─────────────────────────────────────────────────────────────
  async getActiveAttendance(employeeId) {
    if (!employeeId) throw ApiError.badRequest('Employee ID is required');

    const todayDate = new Date().toISOString().split('T')[0];
    const record = await attendanceRepository.findByEmployeeAndDate(employeeId, todayDate);

    if (!record || !record.clock_in) {
      return { isCheckedIn: false, checkInTime: null, checkOutTime: null, elapsedSeconds: 0, record: null };
    }

    const checkIn = new Date(record.clock_in);
    const isCheckedIn = !record.clock_out;
    const elapsedSeconds = isCheckedIn
      ? Math.floor((Date.now() - checkIn.getTime()) / 1000)
      : 0;

    return {
      isCheckedIn,
      checkInTime: record.clock_in,
      checkOutTime: record.clock_out || null,
      elapsedSeconds,
      workedHours: parseFloat(record.total_hours || 0),
      expectedHours: parseFloat(record.expected_hours || 8.0),
      status: record.status,
      record,
    };
  },

  // ─────────────────────────────────────────────────────────────
  // EMPLOYEE: MY HISTORY
  // ─────────────────────────────────────────────────────────────
  async getMyHistory(employeeId, { month, year, page = 1, limit = 31 } = {}) {
    if (!employeeId) throw ApiError.badRequest('Employee ID is required');
    return attendanceRepository.findByEmployeeHistory(employeeId, { month, year, page, limit });
  },

  // ─────────────────────────────────────────────────────────────
  // HR: LIST ALL ATTENDANCE
  // ─────────────────────────────────────────────────────────────
  async listAttendance(query = {}) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const { employee_id, date, status, search } = query;

    const [data, total] = await Promise.all([
      attendanceRepository.findAttendance({ employee_id, date, status, search, page, limit }),
      attendanceRepository.countAttendance({ employee_id, date, status, search }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  // ─────────────────────────────────────────────────────────────
  // HR: GET BY ID
  // ─────────────────────────────────────────────────────────────
  async getAttendanceById(id) {
    const record = await attendanceRepository.findAttendanceById(id);
    if (!record) throw ApiError.notFound(`Attendance record '${id}' not found`);
    return record;
  },

  // ─────────────────────────────────────────────────────────────
  // HR: MANUAL LOG (legacy "recordAttendance" kept for compat)
  // ─────────────────────────────────────────────────────────────
  async recordAttendance(data) {
    if (!data.employee_id) throw ApiError.badRequest('Employee ID is required');
    if (!data.date) throw ApiError.badRequest('Attendance date is required');

    const existing = await attendanceRepository.findByEmployeeAndDate(data.employee_id, data.date);
    if (existing) throw ApiError.conflict(`Attendance for employee on ${data.date} is already recorded`);

    return attendanceRepository.createAttendance(data);
  },

  // ─────────────────────────────────────────────────────────────
  // HR: MANUAL CORRECTION
  // ─────────────────────────────────────────────────────────────
  async correctAttendance(id, data, correctedByName) {
    const existing = await attendanceRepository.findAttendanceById(id);
    if (!existing) throw ApiError.notFound(`Attendance record '${id}' not found`);

    // Determine new timestamps
    const newClockIn = data.clock_in !== undefined ? data.clock_in : existing.clock_in;
    const newClockOut = data.clock_out !== undefined ? data.clock_out : existing.clock_out;

    // Validate: clock_out must be after clock_in
    if (newClockIn && newClockOut) {
      const inTime = new Date(newClockIn).getTime();
      const outTime = new Date(newClockOut).getTime();
      if (outTime <= inTime) {
        throw ApiError.badRequest('Check-out time cannot be earlier than or equal to check-in time');
      }
    }

    // Recalculate hours if times changed
    let workedHours = parseFloat(existing.total_hours || 0);
    let expectedHours = parseFloat(existing.expected_hours || 8.0);
    let differenceHours = parseFloat(existing.difference_hours || 0);
    let finalStatus = data.status || existing.status;

    if (newClockIn && newClockOut) {
      const inTime = new Date(newClockIn).getTime();
      const outTime = new Date(newClockOut).getTime();
      workedHours = round2((outTime - inTime) / (1000 * 60 * 60));

      // Get schedule for expected hours if not overridden
      if (data.expected_hours !== undefined) {
        expectedHours = parseFloat(data.expected_hours);
      } else {
        const schedule = await attendanceRepository.getScheduleForEmployee(
          existing.employee_id,
          typeof existing.date === 'string' ? existing.date : existing.date.toISOString().split('T')[0]
        );
        expectedHours = schedule.standard_hours_per_day || expectedHours;
      }

      differenceHours = round2(workedHours - expectedHours);

      // Auto-recalculate status if not manually overridden
      if (data.status === undefined) {
        finalStatus = determineFinalStatus(workedHours, expectedHours, false);
      }
    }

    // Build audit note
    const timestamp = new Date().toLocaleString();
    const auditNote = `[Correction by ${correctedByName || 'HR'} at ${timestamp}]${data.notes ? ': ' + data.notes : ''}`;
    const combinedNotes = existing.notes
      ? `${existing.notes}\n${auditNote}`
      : auditNote;

    const updates = {
      clock_in: newClockIn,
      clock_out: newClockOut,
      total_hours: workedHours,
      expected_hours: expectedHours,
      difference_hours: differenceHours,
      status: finalStatus,
      notes: data.notes !== undefined ? combinedNotes : existing.notes,
    };

    // Validate status value
    const validStatuses = ['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'OVERTIME', 'MISSING_CHECKOUT'];
    if (!validStatuses.includes(updates.status)) {
      throw ApiError.badRequest(`Invalid status '${updates.status}'`);
    }

    const updated = await attendanceRepository.updateAttendance(id, updates);
    return updated;
  },
};

module.exports = attendanceService;
