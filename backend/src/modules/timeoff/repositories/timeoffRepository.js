const db = require('../../../database/db');
const crypto = require('crypto');

/**
 * Time Off Repository Layer
 * Owner: P2 (HR Operations)
 * Raw SQL Data Access Layer for Leave Types, Allocations, and Requests
 */

let memoryTypes = [
  {
    id: 't1e07284-c113-4a88-8252-84b2c15981a1',
    name: 'Annual Paid Leave',
    code: 'ANNUAL',
    is_paid: true,
    requires_approval: true,
    max_days_allowed: 20,
    created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 't2f18395-d224-5b99-9363-95c3d26092b2',
    name: 'Medical / Sick Leave',
    code: 'SICK',
    is_paid: true,
    requires_approval: true,
    max_days_allowed: 12,
    created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 't3a29406-e335-6caa-0474-06d4e37103c3',
    name: 'Unpaid Leave',
    code: 'UNPAID',
    is_paid: false,
    requires_approval: true,
    max_days_allowed: 30,
    created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T00:00:00Z').toISOString(),
  },
];

let memoryAllocations = [];
let memoryRequests = [];

const timeoffRepository = {
  // ---------------------------------------------------------------------------
  // TIME OFF TYPES
  // ---------------------------------------------------------------------------
  findTypes: async () => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query('SELECT * FROM time_off_types ORDER BY name ASC');
        if (res.rows.length > 0) return res.rows;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findTypes]:', e.message);
    }
    return memoryTypes;
  },

  createType: async (data) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `tot-${Date.now()}`;
    const now = new Date().toISOString();
    const newType = {
      id,
      name: data.name,
      code: data.code,
      is_paid: data.is_paid !== undefined ? Boolean(data.is_paid) : true,
      requires_approval: data.requires_approval !== undefined ? Boolean(data.requires_approval) : true,
      max_days_allowed: parseInt(data.max_days_allowed || '20', 10),
      created_at: now,
      updated_at: now,
    };
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          INSERT INTO time_off_types (id, name, code, is_paid, requires_approval, max_days_allowed, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `;
        const res = await db.query(sql, [
          newType.id,
          newType.name,
          newType.code,
          newType.is_paid,
          newType.requires_approval,
          newType.max_days_allowed,
          newType.created_at,
          newType.updated_at,
        ]);
        return res.rows[0];
      }
    } catch (e) {
      console.warn('[Repository DB Fallback createType]:', e.message);
    }
    memoryTypes.push(newType);
    return newType;
  },

  // ---------------------------------------------------------------------------
  // ALLOCATIONS
  // ---------------------------------------------------------------------------
  findAllocations: async ({
    employee_id,
    year,
    search,
    department,
    time_off_type_id,
    balance_status,
    employment_status,
  } = {}) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = `
          SELECT 
            a.*, 
            e.display_name as employee_name, 
            e.first_name,
            e.last_name,
            e.employee_code,
            e.department,
            e.status as employment_status,
            t.name as leave_type_name, 
            t.code as leave_type_code,
            COALESCE((
              SELECT SUM(r.total_days)
              FROM time_off_requests r
              WHERE r.employee_id = a.employee_id
                AND r.time_off_type_id = a.time_off_type_id
                AND r.status = 'PENDING'
                AND EXTRACT(YEAR FROM r.start_date) = a.year
            ), 0.00)::numeric(5,2) as pending_days,
            (a.allocated_days - a.used_days)::numeric(5,2) as remaining_days,
            CASE
              WHEN (a.allocated_days - a.used_days) < 0 THEN 'OVERDRAWN'
              WHEN (a.allocated_days - a.used_days) = 0 THEN 'EXHAUSTED'
              WHEN (a.allocated_days - a.used_days) <= 3 THEN 'LOW'
              ELSE 'HEALTHY'
            END as balance_status
          FROM time_off_allocations a
          JOIN employees e ON a.employee_id = e.id
          JOIN time_off_types t ON a.time_off_type_id = t.id
          WHERE 1=1
        `;
        const params = [];
        let pIdx = 1;

        if (employee_id) {
          sql += ` AND a.employee_id = $${pIdx}`;
          params.push(employee_id);
          pIdx++;
        }
        if (year) {
          sql += ` AND a.year = $${pIdx}`;
          params.push(parseInt(year, 10));
          pIdx++;
        }
        if (search && search.trim()) {
          const s = `%${search.trim()}%`;
          sql += ` AND (e.display_name ILIKE $${pIdx} OR e.first_name ILIKE $${pIdx} OR e.last_name ILIKE $${pIdx} OR e.employee_code ILIKE $${pIdx})`;
          params.push(s);
          pIdx++;
        }
        if (department && department.trim()) {
          sql += ` AND e.department = $${pIdx}`;
          params.push(department.trim());
          pIdx++;
        }
        if (time_off_type_id && time_off_type_id.trim()) {
          sql += ` AND a.time_off_type_id = $${pIdx}`;
          params.push(time_off_type_id.trim());
          pIdx++;
        }
        if (employment_status && employment_status.trim()) {
          sql += ` AND e.status = $${pIdx}`;
          params.push(employment_status.trim().toUpperCase());
          pIdx++;
        }
        if (balance_status && balance_status.trim()) {
          const bs = balance_status.trim().toUpperCase();
          if (bs === 'OVERDRAWN') {
            sql += ` AND (a.allocated_days - a.used_days) < 0`;
          } else if (bs === 'EXHAUSTED') {
            sql += ` AND (a.allocated_days - a.used_days) = 0`;
          } else if (bs === 'LOW') {
            sql += ` AND (a.allocated_days - a.used_days) > 0 AND (a.allocated_days - a.used_days) <= 3`;
          } else if (bs === 'HEALTHY') {
            sql += ` AND (a.allocated_days - a.used_days) > 3`;
          }
        }

        sql += ' ORDER BY a.year DESC, e.display_name ASC, t.name ASC';
        const res = await db.query(sql, params);
        return res.rows;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findAllocations]:', e.message);
    }
    let filtered = [...memoryAllocations];
    if (employee_id) filtered = filtered.filter((a) => a.employee_id === employee_id);
    if (year) filtered = filtered.filter((a) => a.year === parseInt(year, 10));
    if (department) filtered = filtered.filter((a) => a.department === department);
    if (time_off_type_id) filtered = filtered.filter((a) => a.time_off_type_id === time_off_type_id);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((a) => (a.employee_name || '').toLowerCase().includes(s) || (a.employee_code || '').toLowerCase().includes(s));
    }
    return filtered.map((a) => ({
      ...a,
      pending_days: a.pending_days || 0,
      remaining_days: parseFloat(a.allocated_days || 0) - parseFloat(a.used_days || 0),
      balance_status: (parseFloat(a.allocated_days || 0) - parseFloat(a.used_days || 0)) <= 0 ? 'EXHAUSTED' : (parseFloat(a.allocated_days || 0) - parseFloat(a.used_days || 0)) <= 3 ? 'LOW' : 'HEALTHY',
    }));
  },

  createAllocation: async (data) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `alloc-${Date.now()}`;
    const now = new Date().toISOString();
    const newAlloc = {
      id,
      employee_id: data.employee_id,
      time_off_type_id: data.time_off_type_id,
      year: parseInt(data.year || new Date().getFullYear(), 10),
      allocated_days: parseFloat(data.allocated_days || 0.0),
      used_days: 0.0,
      created_at: now,
      updated_at: now,
    };
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, year, allocated_days, used_days, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `;
        const res = await db.query(sql, [
          newAlloc.id,
          newAlloc.employee_id,
          newAlloc.time_off_type_id,
          newAlloc.year,
          newAlloc.allocated_days,
          newAlloc.used_days,
          newAlloc.created_at,
          newAlloc.updated_at,
        ]);
        return res.rows[0];
      }
    } catch (e) {
      console.warn('[Repository DB Fallback createAllocation]:', e.message);
    }
    memoryAllocations.push(newAlloc);
    return newAlloc;
  },

  // ---------------------------------------------------------------------------
  // TIME OFF REQUESTS
  // ---------------------------------------------------------------------------
  findRequests: async ({ employee_id, status, page = 1, limit = 20 } = {}) => {
    const offset = (page - 1) * limit;
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = `
          SELECT r.*, e.display_name as employee_name, e.employee_code, e.department,
                 t.name as leave_type_name, t.code as leave_type_code, t.is_paid
          FROM time_off_requests r
          JOIN employees e ON r.employee_id = e.id
          JOIN time_off_types t ON r.time_off_type_id = t.id
          WHERE 1=1
        `;
        const params = [];
        let pIdx = 1;

        if (employee_id) {
          sql += ` AND r.employee_id = $${pIdx}`;
          params.push(employee_id);
          pIdx++;
        }
        if (status) {
          sql += ` AND r.status = $${pIdx}`;
          params.push(status);
          pIdx++;
        }

        sql += ` ORDER BY r.start_date DESC, r.created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
        params.push(limit, offset);
        const res = await db.query(sql, params);
        return res.rows;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findRequests]:', e.message);
    }
    let filtered = [...memoryRequests];
    if (employee_id) filtered = filtered.filter((r) => r.employee_id === employee_id);
    if (status) filtered = filtered.filter((r) => r.status === status);
    return filtered.slice(offset, offset + limit);
  },

  countRequests: async ({ employee_id, status } = {}) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = 'SELECT COUNT(*) as total FROM time_off_requests WHERE 1=1';
        const params = [];
        let pIdx = 1;
        if (employee_id) {
          sql += ` AND employee_id = $${pIdx}`;
          params.push(employee_id);
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
      console.warn('[Repository DB Fallback countRequests]:', e.message);
    }
    let filtered = [...memoryRequests];
    if (employee_id) filtered = filtered.filter((r) => r.employee_id === employee_id);
    if (status) filtered = filtered.filter((r) => r.status === status);
    return filtered.length;
  },

  findRequestById: async (id) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          SELECT r.*, e.display_name as employee_name, e.employee_code, e.department,
                 t.name as leave_type_name, t.code as leave_type_code, t.is_paid
          FROM time_off_requests r
          JOIN employees e ON r.employee_id = e.id
          JOIN time_off_types t ON r.time_off_type_id = t.id
          WHERE r.id = $1
        `;
        const res = await db.query(sql, [id]);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findRequestById]:', e.message);
    }
    return memoryRequests.find((r) => r.id === id) || null;
  },

  createRequest: async (data) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}`;
    const now = new Date().toISOString();
    const newReq = {
      id,
      employee_id: data.employee_id,
      time_off_type_id: data.time_off_type_id,
      start_date: data.start_date,
      end_date: data.end_date,
      total_days: parseFloat(data.total_days || 1.0),
      reason: data.reason || '',
      status: 'PENDING',
      approver_id: null,
      approved_at: null,
      created_at: now,
      updated_at: now,
    };
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          INSERT INTO time_off_requests (id, employee_id, time_off_type_id, start_date, end_date, total_days, reason, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *;
        `;
        const res = await db.query(sql, [
          newReq.id,
          newReq.employee_id,
          newReq.time_off_type_id,
          newReq.start_date,
          newReq.end_date,
          newReq.total_days,
          newReq.reason,
          newReq.status,
          newReq.created_at,
          newReq.updated_at,
        ]);
        return res.rows[0];
      }
    } catch (e) {
      console.warn('[Repository DB Fallback createRequest]:', e.message);
    }
    memoryRequests.unshift(newReq);
    return newReq;
  },

  updateRequestStatus: async (id, { status, approver_id }) => {
    const now = new Date().toISOString();
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          UPDATE time_off_requests
          SET status = $1, approver_id = $2, approved_at = $3, updated_at = $3
          WHERE id = $4
          RETURNING *;
        `;
        const res = await db.query(sql, [status, approver_id || null, now, id]);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback updateRequestStatus]:', e.message);
    }
    const idx = memoryRequests.findIndex((r) => r.id === id);
    if (idx !== -1) {
      memoryRequests[idx] = {
        ...memoryRequests[idx],
        status,
        approver_id: approver_id || null,
        approved_at: now,
        updated_at: now,
      };
      return memoryRequests[idx];
    }
    return null;
  },
};

module.exports = timeoffRepository;
