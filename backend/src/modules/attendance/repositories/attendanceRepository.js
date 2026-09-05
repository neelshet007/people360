const db = require('../../../database/db');
const crypto = require('crypto');

/**
 * Attendance Repository Layer
 * Owner: P2 (HR Operations)
 * Raw SQL Data Access Layer with resilient storage
 */

let memoryAttendance = [];

const attendanceRepository = {
  findAttendance: async ({ employee_id, date, status, page = 1, limit = 20 } = {}) => {
    const offset = (page - 1) * limit;
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = `
          SELECT a.*, e.display_name as employee_name, e.employee_code, e.department
          FROM attendance a
          LEFT JOIN employees e ON a.employee_id = e.id
          WHERE 1=1
        `;
        const params = [];
        let pIdx = 1;

        if (employee_id) {
          sql += ` AND a.employee_id = $${pIdx}`;
          params.push(employee_id);
          pIdx++;
        }
        if (date) {
          sql += ` AND a.date = $${pIdx}`;
          params.push(date);
          pIdx++;
        }
        if (status) {
          sql += ` AND a.status = $${pIdx}`;
          params.push(status);
          pIdx++;
        }

        sql += ` ORDER BY a.date DESC, a.created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
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
    return filtered.slice(offset, offset + limit);
  },

  countAttendance: async ({ employee_id, date, status } = {}) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = 'SELECT COUNT(*) as total FROM attendance WHERE 1=1';
        const params = [];
        let pIdx = 1;

        if (employee_id) {
          sql += ` AND employee_id = $${pIdx}`;
          params.push(employee_id);
          pIdx++;
        }
        if (date) {
          sql += ` AND date = $${pIdx}`;
          params.push(date);
          pIdx++;
        }
        if (status) {
          sql += ` AND status = $${pIdx}`;
          params.push(status);
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
          SELECT a.*, e.display_name as employee_name, e.employee_code, e.department
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

  findByEmployeeAndDate: async (employee_id, date) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = 'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2';
        const res = await db.query(sql, [employee_id, date]);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findByEmployeeAndDate]:', e.message);
    }
    return memoryAttendance.find((a) => a.employee_id === employee_id && a.date === date) || null;
  },

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
      status: data.status || 'PRESENT',
      notes: data.notes || '',
      created_at: now,
      updated_at: now,
    };

    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          INSERT INTO attendance (id, employee_id, date, clock_in, clock_out, total_hours, status, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *;
        `;
        const res = await db.query(sql, [
          newRecord.id,
          newRecord.employee_id,
          newRecord.date,
          newRecord.clock_in,
          newRecord.clock_out,
          newRecord.total_hours,
          newRecord.status,
          newRecord.notes,
          newRecord.created_at,
          newRecord.updated_at,
        ]);
        return res.rows[0];
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

        if (data.clock_out !== undefined) {
          fields.push(`clock_out = $${pIdx}`);
          params.push(data.clock_out);
          pIdx++;
        }
        if (data.total_hours !== undefined) {
          fields.push(`total_hours = $${pIdx}`);
          params.push(data.total_hours);
          pIdx++;
        }
        if (data.status !== undefined) {
          fields.push(`status = $${pIdx}`);
          params.push(data.status);
          pIdx++;
        }
        if (data.notes !== undefined) {
          fields.push(`notes = $${pIdx}`);
          params.push(data.notes);
          pIdx++;
        }

        fields.push(`updated_at = $${pIdx}`);
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
