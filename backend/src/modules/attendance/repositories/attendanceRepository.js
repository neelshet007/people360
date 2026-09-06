const db = require('../../../database/db');
const crypto = require('crypto');

/**
 * Attendance Repository Layer — Phase 5
 * Owner: P2 (HR Operations)
 * Raw SQL Data Access with in-memory fallback for offline environments.
 */

let memoryAttendance = [];

const attendanceRepository = {
  // ─────────────────────────────────────────────────────────────
  // EMPLOYEE SCHEDULE RESOLUTION (P1 integration)
  // ─────────────────────────────────────────────────────────────

  /**
   * Resolve working schedule for employee on a given date.
   * Path: employee → active contract → working_schedule
   * Returns: { standard_hours_per_day, start_time, end_time } or defaults.
   */
  getScheduleForEmployee: async (employeeId, date) => {
    const DEFAULT = { standard_hours_per_day: 8.0, start_time: '09:00', end_time: '18:00' };
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          SELECT
            ws.standard_hours_per_day,
            ws.days_config,
            ws.total_weekly_hours
          FROM contracts c
          JOIN working_schedules ws ON c.working_schedule_id = ws.id
          WHERE c.employee_id = $1
            AND c.status = 'ACTIVE'
            AND c.start_date <= $2
            AND (c.end_date IS NULL OR c.end_date >= $2)
          ORDER BY c.start_date DESC
          LIMIT 1
        `;
        const res = await db.query(sql, [employeeId, date]);
        if (res.rows.length > 0) {
          const row = res.rows[0];
          // Parse days_config to find today's schedule
          let daysConfig = row.days_config;
          if (typeof daysConfig === 'string') {
            try { daysConfig = JSON.parse(daysConfig); } catch (_) { daysConfig = null; }
          }
          if (Array.isArray(daysConfig)) {
            const dayName = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
            const dayEntry = daysConfig.find((d) => d.day === dayName && d.is_working);
            if (dayEntry) {
              return {
                standard_hours_per_day: parseFloat(row.standard_hours_per_day) || 8.0,
                start_time: dayEntry.start_time || '09:00',
                end_time: dayEntry.end_time || '18:00',
              };
            }
          }
          return {
            standard_hours_per_day: parseFloat(row.standard_hours_per_day) || 8.0,
            start_time: '09:00',
            end_time: '18:00',
          };
        }
      }
    } catch (e) {
      console.warn('[AttendanceRepository] getScheduleForEmployee fallback:', e.message);
    }
    return DEFAULT;
  },

  // ─────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────

  findAttendance: async ({ employee_id, date, status, location_status, search, page = 1, limit = 20 } = {}) => {
    const offset = (page - 1) * limit;
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = `
          SELECT
            a.*,
            e.display_name AS employee_name,
            e.employee_code,
            e.department,
            e.email AS employee_email
          FROM attendance a
          LEFT JOIN employees e ON a.employee_id = e.id
          WHERE 1=1
        `;
        const params = [];
        let pIdx = 1;

        if (employee_id) {
          sql += ` AND a.employee_id = $${pIdx++}`;
          params.push(employee_id);
        }
        if (date) {
          sql += ` AND a.date = $${pIdx++}`;
          params.push(date);
        }
        if (status) {
          sql += ` AND a.status = $${pIdx++}`;
          params.push(status);
        }
        if (location_status) {
          sql += ` AND (a.location_status = $${pIdx} OR a.location_verification_status = $${pIdx})`;
          params.push(location_status);
          pIdx++;
        }
        if (search) {
          sql += ` AND (
            LOWER(e.display_name) LIKE LOWER($${pIdx}) OR
            LOWER(e.employee_code) LIKE LOWER($${pIdx}) OR
            LOWER(e.email) LIKE LOWER($${pIdx})
          )`;
          params.push(`%${search}%`);
          pIdx++;
        }

        sql += ` ORDER BY a.date DESC, a.created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
        params.push(limit, offset);

        const res = await db.query(sql, params);
        return res.rows;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findAttendance]:', e.message);
    }

    let filtered = [...memoryAttendance];
    if (employee_id) filtered = filtered.filter((a) => a.employee_id === employee_id);
    if (date) filtered = filtered.filter((a) => a.date === date);
    if (status) filtered = filtered.filter((a) => a.status === status);
    if (location_status) filtered = filtered.filter((a) => a.location_status === location_status || a.location_verification_status === location_status);
    return filtered.slice(offset, offset + limit);
  },

  countAttendance: async ({ employee_id, date, status, location_status, search } = {}) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = `
          SELECT COUNT(*) AS total
          FROM attendance a
          LEFT JOIN employees e ON a.employee_id = e.id
          WHERE 1=1
        `;
        const params = [];
        let pIdx = 1;

        if (employee_id) {
          sql += ` AND a.employee_id = $${pIdx++}`;
          params.push(employee_id);
        }
        if (date) {
          sql += ` AND a.date = $${pIdx++}`;
          params.push(date);
        }
        if (status) {
          sql += ` AND a.status = $${pIdx++}`;
          params.push(status);
        }
        if (location_status) {
          sql += ` AND (a.location_status = $${pIdx} OR a.location_verification_status = $${pIdx})`;
          params.push(location_status);
          pIdx++;
        }
        if (search) {
          sql += ` AND (
            LOWER(e.display_name) LIKE LOWER($${pIdx}) OR
            LOWER(e.employee_code) LIKE LOWER($${pIdx}) OR
            LOWER(e.email) LIKE LOWER($${pIdx})
          )`;
          params.push(`%${search}%`);
          pIdx++;
        }

        const res = await db.query(sql, params);
        return parseInt(res.rows[0].total, 10);
      }
    } catch (e) {
      console.warn('[Repository DB Fallback countAttendance]:', e.message);
    }

    let filtered = [...memoryAttendance];
    if (employee_id) filtered = filtered.filter((a) => a.employee_id === employee_id);
    if (date) filtered = filtered.filter((a) => a.date === date);
    if (status) filtered = filtered.filter((a) => a.status === status);
    return filtered.length;
  },

  findAttendanceById: async (id) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          SELECT a.*, e.display_name AS employee_name, e.employee_code, e.department, e.email AS employee_email
          FROM attendance a
          LEFT JOIN employees e ON a.employee_id = e.id
          WHERE a.id = $1
        `;
        const res = await db.query(sql, [id]);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findAttendanceById]:', e.message);
    }
    return memoryAttendance.find((a) => a.id === id) || null;
  },

  findByEmployeeAndDate: async (employeeId, date) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query(
          'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
          [employeeId, date]
        );
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findByEmployeeAndDate]:', e.message);
    }
    return memoryAttendance.find((a) => a.employee_id === employeeId && a.date === date) || null;
  },

  /** Find today's active (checked-in but not checked-out) record */
  findActiveToday: async (employeeId, date) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query(
          'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 AND clock_in IS NOT NULL AND clock_out IS NULL',
          [employeeId, date]
        );
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findActiveToday]:', e.message);
    }
    return (
      memoryAttendance.find(
        (a) => a.employee_id === employeeId && a.date === date && a.clock_in && !a.clock_out
      ) || null
    );
  },

  /** History for a specific employee, optionally filtered by month/year */
  findByEmployeeHistory: async (employeeId, { month, year, page = 1, limit = 31 } = {}) => {
    const offset = (page - 1) * limit;
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = `
          SELECT a.*,
            e.display_name AS employee_name, e.employee_code
          FROM attendance a
          LEFT JOIN employees e ON a.employee_id = e.id
          WHERE a.employee_id = $1
        `;
        const params = [employeeId];
        let pIdx = 2;

        if (month && year) {
          sql += ` AND EXTRACT(MONTH FROM a.date) = $${pIdx++} AND EXTRACT(YEAR FROM a.date) = $${pIdx++}`;
          params.push(parseInt(month, 10), parseInt(year, 10));
        } else if (year) {
          sql += ` AND EXTRACT(YEAR FROM a.date) = $${pIdx++}`;
          params.push(parseInt(year, 10));
        }

        sql += ` ORDER BY a.date DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
        params.push(limit, offset);

        const res = await db.query(sql, params);
        return res.rows;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findByEmployeeHistory]:', e.message);
    }

    let filtered = memoryAttendance.filter((a) => a.employee_id === employeeId);
    if (month && year) {
      filtered = filtered.filter((a) => {
        const d = new Date(a.date);
        return d.getMonth() + 1 === parseInt(month, 10) && d.getFullYear() === parseInt(year, 10);
      });
    }
    return filtered.slice(offset, offset + limit);
  },

  // ─────────────────────────────────────────────────────────────
  // WRITE
  // ─────────────────────────────────────────────────────────────

  createAttendance: async (data) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `att-${Date.now()}`;
    const now = new Date().toISOString();
    const newRecord = {
      id,
      employee_id: data.employee_id,
      date: data.date,
      clock_in: data.clock_in || now,
      clock_out: data.clock_out || null,
      total_hours: parseFloat(data.total_hours || 0.0),
      expected_hours: parseFloat(data.expected_hours || 8.0),
      difference_hours: parseFloat(data.difference_hours || 0.0),
      status: data.status || 'PRESENT',
      notes: data.notes || null,
      latitude: data.latitude !== undefined ? data.latitude : null,
      longitude: data.longitude !== undefined ? data.longitude : null,
      distance_from_office_meters: data.distance_from_office_meters !== undefined ? data.distance_from_office_meters : null,
      is_out_of_bounds: Boolean(data.is_out_of_bounds),
      location_status: data.location_status || 'LOCATION_UNAVAILABLE',
      location_verification_status: data.location_verification_status || data.location_status || 'LOCATION_UNAVAILABLE',
      workplace_latitude: data.workplace_latitude !== undefined ? data.workplace_latitude : 28.6139,
      workplace_longitude: data.workplace_longitude !== undefined ? data.workplace_longitude : 77.2090,
      workplace_radius_meters: data.workplace_radius_meters !== undefined ? data.workplace_radius_meters : 500.00,
      location_accuracy: data.location_accuracy !== undefined ? data.location_accuracy : null,
      created_at: now,
      updated_at: now,
    };

    try {
      const isLive = await db.testConnection();
      if (isLive) {
        try {
          const sql = `
            INSERT INTO attendance
              (id, employee_id, date, clock_in, clock_out, total_hours, expected_hours, difference_hours, status, notes,
               latitude, longitude, distance_from_office_meters, is_out_of_bounds,
               location_status, location_verification_status,
               workplace_latitude, workplace_longitude, workplace_radius_meters, location_accuracy,
               created_at, updated_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
            RETURNING *
          `;
          const res = await db.query(sql, [
            newRecord.id, newRecord.employee_id, newRecord.date,
            newRecord.clock_in, newRecord.clock_out, newRecord.total_hours,
            newRecord.expected_hours, newRecord.difference_hours,
            newRecord.status, newRecord.notes,
            newRecord.latitude, newRecord.longitude, newRecord.distance_from_office_meters, newRecord.is_out_of_bounds,
            newRecord.location_status, newRecord.location_verification_status,
            newRecord.workplace_latitude, newRecord.workplace_longitude, newRecord.workplace_radius_meters,
            newRecord.location_accuracy,
            newRecord.created_at, newRecord.updated_at,
          ]);
          return res.rows[0];
        } catch (colErr) {
          // Fallback if legacy schema
          const fallbackSql = `
            INSERT INTO attendance (id, employee_id, date, clock_in, clock_out, total_hours, status, notes, created_at, updated_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *
          `;
          const res = await db.query(fallbackSql, [
            newRecord.id, newRecord.employee_id, newRecord.date,
            newRecord.clock_in, newRecord.clock_out, newRecord.total_hours,
            newRecord.status, newRecord.notes, newRecord.created_at, newRecord.updated_at,
          ]);
          return res.rows[0];
        }
      }
    } catch (e) {
      console.warn('[Repository DB Fallback createAttendance]:', e.message);
    }

    memoryAttendance.unshift(newRecord);
    return newRecord;
  },

  updateAttendance: async (id, data) => {
    const now = new Date().toISOString();
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const fields = [];
        const params = [id];
        let pIdx = 2;

        const addField = (col, val) => {
          fields.push(`${col} = $${pIdx++}`);
          params.push(val);
        };

        if (data.clock_in !== undefined) addField('clock_in', data.clock_in);
        if (data.clock_out !== undefined) addField('clock_out', data.clock_out);
        if (data.total_hours !== undefined) addField('total_hours', data.total_hours);
        if (data.expected_hours !== undefined) addField('expected_hours', data.expected_hours);
        if (data.difference_hours !== undefined) addField('difference_hours', data.difference_hours);
        if (data.status !== undefined) addField('status', data.status);
        if (data.location_status !== undefined) addField('location_status', data.location_status);
        if (data.location_verification_status !== undefined) addField('location_verification_status', data.location_verification_status);
        if (data.is_out_of_bounds !== undefined) addField('is_out_of_bounds', data.is_out_of_bounds);
        if (data.latitude !== undefined) addField('latitude', data.latitude);
        if (data.longitude !== undefined) addField('longitude', data.longitude);
        if (data.distance_from_office_meters !== undefined) addField('distance_from_office_meters', data.distance_from_office_meters);
        if (data.workplace_latitude !== undefined) addField('workplace_latitude', data.workplace_latitude);
        if (data.workplace_longitude !== undefined) addField('workplace_longitude', data.workplace_longitude);
        if (data.workplace_radius_meters !== undefined) addField('workplace_radius_meters', data.workplace_radius_meters);
        if (data.location_accuracy !== undefined) addField('location_accuracy', data.location_accuracy);

        fields.push(`updated_at = $${pIdx++}`);
        params.push(now);

        const sql = `UPDATE attendance SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
        const res = await db.query(sql, params);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback updateAttendance]:', e.message);
    }

    const idx = memoryAttendance.findIndex((a) => a.id === id);
    if (idx !== -1) {
      memoryAttendance[idx] = { ...memoryAttendance[idx], ...data, updated_at: now };
      return memoryAttendance[idx];
    }
    return null;
  },
};

module.exports = attendanceRepository;
