const db = require('../../../database/db');
const crypto = require('crypto');

/**
 * Working Schedules Repository Layer
 * Owner: P1 (Core HR)
 * Raw SQL Data Access Layer with resilient storage
 */

const defaultScheduleDays = [
  { day: 'Monday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
  { day: 'Tuesday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
  { day: 'Wednesday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
  { day: 'Thursday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
  { day: 'Friday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
  { day: 'Saturday', is_working: false, start_time: '09:00', end_time: '18:00', break_duration_minutes: 0 },
  { day: 'Sunday', is_working: false, start_time: '09:00', end_time: '18:00', break_duration_minutes: 0 },
];

let memorySchedules = [
  {
    id: 's1a07284-c113-4a88-8252-84b2c15981a1',
    name: 'Standard 40-Hour Work Week',
    standard_hours_per_day: 8.0,
    standard_days_per_week: 5,
    total_weekly_hours: 40.0,
    break_duration_minutes: 60,
    timezone: 'America/Los_Angeles',
    is_active: true,
    days_config: defaultScheduleDays,
    created_at: new Date('2023-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2023-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 's2b18395-d224-5b99-9363-95c3d26092b2',
    name: 'Part-Time 20-Hour Shift Policy',
    standard_hours_per_day: 4.0,
    standard_days_per_week: 5,
    total_weekly_hours: 20.0,
    break_duration_minutes: 30,
    timezone: 'America/Los_Angeles',
    is_active: true,
    days_config: [
      { day: 'Monday', is_working: true, start_time: '09:00', end_time: '13:30', break_duration_minutes: 30 },
      { day: 'Tuesday', is_working: true, start_time: '09:00', end_time: '13:30', break_duration_minutes: 30 },
      { day: 'Wednesday', is_working: true, start_time: '09:00', end_time: '13:30', break_duration_minutes: 30 },
      { day: 'Thursday', is_working: true, start_time: '09:00', end_time: '13:30', break_duration_minutes: 30 },
      { day: 'Friday', is_working: true, start_time: '09:00', end_time: '13:30', break_duration_minutes: 30 },
      { day: 'Saturday', is_working: false, start_time: '', end_time: '', break_duration_minutes: 0 },
      { day: 'Sunday', is_working: false, start_time: '', end_time: '', break_duration_minutes: 0 },
    ],
    created_at: new Date('2023-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2023-01-01T00:00:00Z').toISOString(),
  },
];

const scheduleRepository = {
  findSchedules: async ({ page = 1, limit = 20, is_active } = {}) => {
    const offset = (page - 1) * limit;
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = 'SELECT * FROM working_schedules WHERE 1=1';
        const params = [];
        let pIdx = 1;
        if (is_active !== undefined) {
          sql += ` AND is_active = $${pIdx}`;
          params.push(is_active);
          pIdx++;
        }
        sql += ` ORDER BY created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
        params.push(limit, offset);
        const res = await db.query(sql, params);
        if (res.rows.length > 0) return res.rows;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findSchedules]:', e.message);
    }
    let res = [...memorySchedules];
    if (is_active !== undefined) {
      res = res.filter((s) => s.is_active === is_active);
    }
    return res.slice(offset, offset + limit);
  },

  countSchedules: async ({ is_active } = {}) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = 'SELECT COUNT(*) as total FROM working_schedules WHERE 1=1';
        const params = [];
        if (is_active !== undefined) {
          sql += ' AND is_active = $1';
          params.push(is_active);
        }
        const res = await db.query(sql, params);
        return parseInt(res.rows[0].total, 10);
      }
    } catch (e) {
      console.warn('[Repository DB Fallback countSchedules]:', e.message);
    }
    let res = [...memorySchedules];
    if (is_active !== undefined) {
      res = res.filter((s) => s.is_active === is_active);
    }
    return res.length;
  },

  findScheduleById: async (id) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query('SELECT * FROM working_schedules WHERE id = $1', [id]);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findScheduleById]:', e.message);
    }
    return memorySchedules.find((s) => s.id === id) || null;
  },

  createSchedule: async (data) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `sched-${Date.now()}`;
    const now = new Date().toISOString();
    const newSchedule = {
      id,
      name: data.name,
      standard_hours_per_day: parseFloat(data.standard_hours_per_day || 8.0),
      standard_days_per_week: parseInt(data.standard_days_per_week || 5, 10),
      total_weekly_hours: parseFloat(data.total_weekly_hours || 40.0),
      break_duration_minutes: parseInt(data.break_duration_minutes || 60, 10),
      timezone: data.timezone || 'UTC',
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      days_config: data.days_config || defaultScheduleDays,
      created_at: now,
      updated_at: now,
    };

    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          INSERT INTO working_schedules (id, name, standard_hours_per_day, standard_days_per_week, total_weekly_hours, break_duration_minutes, timezone, is_active, days_config, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *;
        `;
        const res = await db.query(sql, [
          newSchedule.id,
          newSchedule.name,
          newSchedule.standard_hours_per_day,
          newSchedule.standard_days_per_week,
          newSchedule.total_weekly_hours,
          newSchedule.break_duration_minutes,
          newSchedule.timezone,
          newSchedule.is_active,
          JSON.stringify(newSchedule.days_config),
          newSchedule.created_at,
          newSchedule.updated_at,
        ]);
        return res.rows[0];
      }
    } catch (e) {
      console.warn('[Repository DB Fallback createSchedule]:', e.message);
    }

    memorySchedules.unshift(newSchedule);
    return newSchedule;
  },

  updateSchedule: async (id, data) => {
    const now = new Date().toISOString();
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const fields = [];
        const params = [id];
        let pIdx = 2;

        if (data.name !== undefined) {
          fields.push(`name = $${pIdx}`);
          params.push(data.name);
          pIdx++;
        }
        if (data.standard_hours_per_day !== undefined) {
          fields.push(`standard_hours_per_day = $${pIdx}`);
          params.push(data.standard_hours_per_day);
          pIdx++;
        }
        if (data.standard_days_per_week !== undefined) {
          fields.push(`standard_days_per_week = $${pIdx}`);
          params.push(data.standard_days_per_week);
          pIdx++;
        }
        if (data.total_weekly_hours !== undefined) {
          fields.push(`total_weekly_hours = $${pIdx}`);
          params.push(data.total_weekly_hours);
          pIdx++;
        }
        if (data.break_duration_minutes !== undefined) {
          fields.push(`break_duration_minutes = $${pIdx}`);
          params.push(data.break_duration_minutes);
          pIdx++;
        }
        if (data.timezone !== undefined) {
          fields.push(`timezone = $${pIdx}`);
          params.push(data.timezone);
          pIdx++;
        }
        if (data.is_active !== undefined) {
          fields.push(`is_active = $${pIdx}`);
          params.push(data.is_active);
          pIdx++;
        }
        if (data.days_config !== undefined) {
          fields.push(`days_config = $${pIdx}`);
          params.push(JSON.stringify(data.days_config));
          pIdx++;
        }

        fields.push(`updated_at = $${pIdx}`);
        params.push(now);

        const sql = `UPDATE working_schedules SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
        const res = await db.query(sql, params);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback updateSchedule]:', e.message);
    }

    const idx = memorySchedules.findIndex((s) => s.id === id);
    if (idx !== -1) {
      memorySchedules[idx] = { ...memorySchedules[idx], ...data, updated_at: now };
      return memorySchedules[idx];
    }
    return null;
  },

  deleteSchedule: async (id) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        await db.query('DELETE FROM working_schedules WHERE id = $1', [id]);
        return true;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback deleteSchedule]:', e.message);
    }
    const idx = memorySchedules.findIndex((s) => s.id === id);
    if (idx !== -1) {
      memorySchedules.splice(idx, 1);
      return true;
    }
    return false;
  },
};

module.exports = scheduleRepository;
