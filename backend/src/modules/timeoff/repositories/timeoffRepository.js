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
  findTypes: async ({ is_active, allow_employee_request } = {}) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = 'SELECT * FROM time_off_types WHERE 1=1';
        const params = [];
        let idx = 1;
        if (is_active !== undefined) {
          sql += ` AND is_active = $${idx++}`;
          params.push(Boolean(is_active));
        }
        if (allow_employee_request !== undefined) {
          sql += ` AND allow_employee_request = $${idx++}`;
          params.push(Boolean(allow_employee_request));
        }
        sql += ' ORDER BY name ASC';
        const res = await db.query(sql, params);
        if (res.rows.length > 0) return res.rows;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findTypes]:', e.message);
    }
    let filtered = [...memoryTypes];
    if (is_active !== undefined) filtered = filtered.filter(t => t.is_active === is_active);
    if (allow_employee_request !== undefined) filtered = filtered.filter(t => t.allow_employee_request === allow_employee_request);
    return filtered;
  },

  findTypeById: async (id) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query('SELECT * FROM time_off_types WHERE id = $1', [id]);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findTypeById]:', e.message);
    }
    return memoryTypes.find(t => t.id === id) || null;
  },

  findTypeByCode: async (code) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query('SELECT * FROM time_off_types WHERE UPPER(code) = $1', [code.toUpperCase()]);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findTypeByCode]:', e.message);
    }
    return memoryTypes.find(t => (t.code || '').toUpperCase() === code.toUpperCase()) || null;
  },

  createType: async (data) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `tot-${Date.now()}`;
    const now = new Date().toISOString();
    const allocMethod = data.allocation_method || 'FIXED_ANNUAL';
    const isEarnedOrUnlimited = allocMethod === 'EARNED' || allocMethod === 'UNLIMITED';
    const annualAlloc = isEarnedOrUnlimited ? null : (data.annual_allocation !== undefined && data.annual_allocation !== null && data.annual_allocation !== '' ? parseFloat(data.annual_allocation) : 20.00);
    const maxDays = annualAlloc !== null ? Math.round(annualAlloc) : 0;

    const newType = {
      id,
      name: (data.name || '').trim(),
      code: (data.code || '').trim().toUpperCase(),
      description: data.description || '',
      is_paid: data.is_paid !== undefined ? Boolean(data.is_paid) : true,
      requires_approval: data.requires_approval !== undefined ? Boolean(data.requires_approval) : true,
      allocation_method: allocMethod,
      annual_allocation: annualAlloc,
      max_days_allowed: maxDays,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      allow_employee_request: data.allow_employee_request !== undefined ? Boolean(data.allow_employee_request) : true,
      allow_half_day: data.allow_half_day !== undefined ? Boolean(data.allow_half_day) : true,
      carry_forward_allowed: data.carry_forward_allowed !== undefined ? Boolean(data.carry_forward_allowed) : false,
      carry_forward_limit: parseFloat(data.carry_forward_limit || 0.00),
      created_at: now,
      updated_at: now,
    };
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          INSERT INTO time_off_types (
            id, name, code, description, is_paid, requires_approval,
            allocation_method, annual_allocation, max_days_allowed,
            is_active, allow_employee_request, allow_half_day,
            carry_forward_allowed, carry_forward_limit,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING *;
        `;
        const res = await db.query(sql, [
          newType.id,
          newType.name,
          newType.code,
          newType.description,
          newType.is_paid,
          newType.requires_approval,
          newType.allocation_method,
          newType.annual_allocation,
          newType.max_days_allowed,
          newType.is_active,
          newType.allow_employee_request,
          newType.allow_half_day,
          newType.carry_forward_allowed,
          newType.carry_forward_limit,
          newType.created_at,
          newType.updated_at,
        ]);
        return res.rows[0];
      }
    } catch (e) {
      console.warn('[Repository DB Fallback createType]:', e.message);
      throw e;
    }
    memoryTypes.push(newType);
    return newType;
  },

  updateType: async (id, data) => {
    const now = new Date().toISOString();
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const fields = [];
        const params = [id];
        let idx = 2;

        if (data.name !== undefined) { fields.push(`name = $${idx++}`); params.push(data.name.trim()); }
        if (data.code !== undefined) { fields.push(`code = $${idx++}`); params.push(data.code.trim().toUpperCase()); }
        if (data.description !== undefined) { fields.push(`description = $${idx++}`); params.push(data.description); }
        if (data.is_paid !== undefined) { fields.push(`is_paid = $${idx++}`); params.push(Boolean(data.is_paid)); }
        if (data.requires_approval !== undefined) { fields.push(`requires_approval = $${idx++}`); params.push(Boolean(data.requires_approval)); }
        if (data.allocation_method !== undefined) { fields.push(`allocation_method = $${idx++}`); params.push(data.allocation_method); }
        if (data.annual_allocation !== undefined) {
          const allocVal = (data.allocation_method === 'EARNED' || data.allocation_method === 'UNLIMITED')
            ? null
            : (data.annual_allocation !== null && data.annual_allocation !== '' ? parseFloat(data.annual_allocation) : null);
          fields.push(`annual_allocation = $${idx++}`);
          params.push(allocVal);
          fields.push(`max_days_allowed = $${idx++}`);
          params.push(allocVal !== null ? Math.round(allocVal) : 0);
        }
        if (data.is_active !== undefined) { fields.push(`is_active = $${idx++}`); params.push(Boolean(data.is_active)); }
        if (data.allow_employee_request !== undefined) { fields.push(`allow_employee_request = $${idx++}`); params.push(Boolean(data.allow_employee_request)); }
        if (data.allow_half_day !== undefined) { fields.push(`allow_half_day = $${idx++}`); params.push(Boolean(data.allow_half_day)); }
        if (data.carry_forward_allowed !== undefined) { fields.push(`carry_forward_allowed = $${idx++}`); params.push(Boolean(data.carry_forward_allowed)); }
        if (data.carry_forward_limit !== undefined) { fields.push(`carry_forward_limit = $${idx++}`); params.push(parseFloat(data.carry_forward_limit || 0)); }

        fields.push(`updated_at = $${idx++}`);
        params.push(now);

        const sql = `UPDATE time_off_types SET ${fields.join(', ')} WHERE id = $1 RETURNING *;`;
        const res = await db.query(sql, params);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback updateType]:', e.message);
      throw e;
    }
    const idx = memoryTypes.findIndex(t => t.id === id);
    if (idx !== -1) {
      memoryTypes[idx] = { ...memoryTypes[idx], ...data, updated_at: now };
      return memoryTypes[idx];
    }
    return null;
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
            t.allocation_method,
            t.is_paid,
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

        // Include COMP_OFF earned balances dynamically
        let compOffRows = [];
        try {
          const compOffType = await db.query("SELECT id, name, code, allocation_method, is_paid FROM time_off_types WHERE code = 'COMP_OFF'");
          if (compOffType.rows.length > 0) {
            const ct = compOffType.rows[0];
            if (!time_off_type_id || time_off_type_id === ct.id) {
              let compSql = `
                SELECT
                  c.id,
                  e.id as employee_id,
                  $1::uuid as time_off_type_id,
                  EXTRACT(YEAR FROM CURRENT_DATE)::int as year,
                  COALESCE(c.earned_days, 0.00)::numeric(5,2) as allocated_days,
                  COALESCE(c.used_days, 0.00)::numeric(5,2) as used_days,
                  NOW() as created_at,
                  NOW() as updated_at,
                  e.display_name as employee_name,
                  e.first_name,
                  e.last_name,
                  e.employee_code,
                  e.department,
                  e.status as employment_status,
                  $2 as leave_type_name,
                  $3 as leave_type_code,
                  $4 as allocation_method,
                  $5::boolean as is_paid,
                  COALESCE((
                    SELECT SUM(r.total_days)
                    FROM time_off_requests r
                    WHERE r.employee_id = e.id
                      AND r.time_off_type_id = $1::uuid
                      AND r.status = 'PENDING'
                  ), 0.00)::numeric(5,2) as pending_days,
                  COALESCE(c.available_days, 0.00)::numeric(5,2) as remaining_days,
                  CASE
                    WHEN COALESCE(c.available_days, 0.00) <= 0 THEN 'EXHAUSTED'
                    WHEN COALESCE(c.available_days, 0.00) <= 1 THEN 'LOW'
                    ELSE 'HEALTHY'
                  END as balance_status
                FROM employees e
                JOIN LATERAL (
                  SELECT
                    gen_random_uuid() as id,
                    SUM(days_credited) FILTER (WHERE status IN ('APPROVED', 'USED')) as earned_days,
                    SUM(days_credited) FILTER (WHERE status = 'USED') as used_days,
                    SUM(days_credited) FILTER (WHERE status = 'APPROVED' AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)) as available_days
                  FROM comp_off_credits coc
                  WHERE coc.employee_id = e.id
                ) c ON true
                WHERE (c.earned_days > 0 OR c.available_days > 0)
              `;
              const compParams = [ct.id, ct.name, ct.code, ct.allocation_method, ct.is_paid];
              let cIdx = 6;
              if (employee_id) { compSql += ` AND e.id = $${cIdx++}`; compParams.push(employee_id); }
              if (search && search.trim()) {
                compSql += ` AND (e.display_name ILIKE $${cIdx} OR e.first_name ILIKE $${cIdx} OR e.last_name ILIKE $${cIdx} OR e.employee_code ILIKE $${cIdx})`;
                compParams.push(`%${search.trim()}%`);
                cIdx++;
              }
              if (department && department.trim()) { compSql += ` AND e.department = $${cIdx++}`; compParams.push(department.trim()); }
              if (employment_status && employment_status.trim()) { compSql += ` AND e.status = $${cIdx++}`; compParams.push(employment_status.trim().toUpperCase()); }
              if (balance_status && balance_status.trim()) {
                const bs = balance_status.trim().toUpperCase();
                if (bs === 'EXHAUSTED') compSql += ` AND COALESCE(c.available_days, 0.00) <= 0`;
                else if (bs === 'LOW') compSql += ` AND COALESCE(c.available_days, 0.00) > 0 AND COALESCE(c.available_days, 0.00) <= 1`;
                else if (bs === 'HEALTHY') compSql += ` AND COALESCE(c.available_days, 0.00) > 1`;
              }
              compSql += ' ORDER BY e.display_name ASC';
              const compRes = await db.query(compSql, compParams);
              compOffRows = compRes.rows;
            }
          }
        } catch (cErr) {
          console.warn('[Repository findAllocations CompOff query]:', cErr.message);
        }

        return [...res.rows, ...compOffRows];
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
