const db = require('../../../database/db');
const crypto = require('crypto');

/**
 * Contracts Repository Layer
 * Owner: P1 (Core HR)
 * Raw SQL Data Access Layer for Employment Contracts & Historical Records
 */

let memoryContracts = [
  {
    id: 'c1a01111-c113-4a88-8252-84b2c15981a1',
    employee_id: 'e1a07284-c113-4a88-8252-84b2c15981a1',
    contract_type: 'PERMANENT',
    wage_rate: 8500.0,
    wage_type: 'MONTHLY',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    working_schedule_id: 's1a07284-c113-4a88-8252-84b2c15981a1',
    salary_structure_id: null,
    status: 'EXPIRED',
    notes: 'Historical contract for 2025 calendar year',
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2025-12-31T23:59:59Z').toISOString(),
  },
  {
    id: 'c2b02222-d224-5b99-9363-95c3d26092b2',
    employee_id: 'e1a07284-c113-4a88-8252-84b2c15981a1',
    contract_type: 'PERMANENT',
    wage_rate: 9500.0,
    wage_type: 'MONTHLY',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    working_schedule_id: 's1a07284-c113-4a88-8252-84b2c15981a1',
    salary_structure_id: null,
    status: 'ACTIVE',
    notes: 'Active contract for 2026 calendar year',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
];

const contractRepository = {
  findContracts: async ({
    page = 1,
    limit = 20,
    employee_id,
    status,
    contract_type,
    date,
    period_start,
    period_end,
    search,
  } = {}) => {
    const offset = (page - 1) * limit;

    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = `
          SELECT 
            c.*,
            e.first_name,
            e.last_name,
            e.employee_code,
            e.email as employee_email,
            e.department as employee_department,
            e.designation as employee_designation,
            ws.name as schedule_name,
            ws.total_weekly_hours as schedule_weekly_hours,
            st.name as salary_structure_name,
            st.code as salary_structure_code
          FROM contracts c
          LEFT JOIN employees e ON c.employee_id = e.id
          LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
          LEFT JOIN salary_structures st ON c.salary_structure_id = st.id
          WHERE 1=1
        `;
        const params = [];
        let pIdx = 1;

        if (employee_id) {
          sql += ` AND c.employee_id = $${pIdx}`;
          params.push(employee_id);
          pIdx++;
        }

        if (status) {
          sql += ` AND c.status = $${pIdx}`;
          params.push(status);
          pIdx++;
        }

        if (contract_type) {
          sql += ` AND c.contract_type = $${pIdx}`;
          params.push(contract_type);
          pIdx++;
        }

        if (date) {
          sql += ` AND c.start_date <= $${pIdx}::DATE AND (c.end_date IS NULL OR c.end_date >= $${pIdx}::DATE)`;
          params.push(date);
          pIdx++;
        }

        if (period_start && period_end) {
          sql += ` AND c.start_date <= $${pIdx + 1}::DATE AND (c.end_date IS NULL OR c.end_date >= $${pIdx}::DATE)`;
          params.push(period_start, period_end);
          pIdx += 2;
        }

        if (search) {
          sql += ` AND (
            LOWER(e.first_name) LIKE LOWER($${pIdx}) OR 
            LOWER(e.last_name) LIKE LOWER($${pIdx}) OR 
            LOWER(e.employee_code) LIKE LOWER($${pIdx})
          )`;
          params.push(`%${search}%`);
          pIdx++;
        }

        sql += ` ORDER BY c.start_date DESC, c.created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
        params.push(limit, offset);

        const res = await db.query(sql, params);
        return res.rows.map((row) => ({
          ...row,
          employee_name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.employee_code,
          reference: `CNT-${row.id.substring(0, 8).toUpperCase()}`,
        }));
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findContracts]:', e.message);
    }

    // Memory fallback
    let filtered = [...memoryContracts];
    if (employee_id) filtered = filtered.filter((c) => c.employee_id === employee_id);
    if (status) filtered = filtered.filter((c) => c.status === status);
    if (contract_type) filtered = filtered.filter((c) => c.contract_type === contract_type);
    if (date) {
      filtered = filtered.filter((c) => c.start_date <= date && (!c.end_date || c.end_date >= date));
    }
    if (period_start && period_end) {
      filtered = filtered.filter((c) => c.start_date <= period_end && (!c.end_date || c.end_date >= period_start));
    }

    return filtered.slice(offset, offset + limit).map((c) => ({
      ...c,
      employee_name: `Employee #${c.employee_id ? c.employee_id.substring(0, 8) : '-'}`,
      reference: `CNT-${c.id.substring(0, 8).toUpperCase()}`,
    }));
  },

  countContracts: async ({
    employee_id,
    status,
    contract_type,
    date,
    period_start,
    period_end,
    search,
  } = {}) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = `
          SELECT COUNT(*) as total
          FROM contracts c
          LEFT JOIN employees e ON c.employee_id = e.id
          WHERE 1=1
        `;
        const params = [];
        let pIdx = 1;

        if (employee_id) {
          sql += ` AND c.employee_id = $${pIdx}`;
          params.push(employee_id);
          pIdx++;
        }
        if (status) {
          sql += ` AND c.status = $${pIdx}`;
          params.push(status);
          pIdx++;
        }
        if (contract_type) {
          sql += ` AND c.contract_type = $${pIdx}`;
          params.push(contract_type);
          pIdx++;
        }
        if (date) {
          sql += ` AND c.start_date <= $${pIdx}::DATE AND (c.end_date IS NULL OR c.end_date >= $${pIdx}::DATE)`;
          params.push(date);
          pIdx++;
        }
        if (period_start && period_end) {
          sql += ` AND c.start_date <= $${pIdx + 1}::DATE AND (c.end_date IS NULL OR c.end_date >= $${pIdx}::DATE)`;
          params.push(period_start, period_end);
          pIdx += 2;
        }
        if (search) {
          sql += ` AND (
            LOWER(e.first_name) LIKE LOWER($${pIdx}) OR 
            LOWER(e.last_name) LIKE LOWER($${pIdx}) OR 
            LOWER(e.employee_code) LIKE LOWER($${pIdx})
          )`;
          params.push(`%${search}%`);
          pIdx++;
        }

        const res = await db.query(sql, params);
        return parseInt(res.rows[0].total, 10);
      }
    } catch (e) {
      console.warn('[Repository DB Fallback countContracts]:', e.message);
    }

    let filtered = [...memoryContracts];
    if (employee_id) filtered = filtered.filter((c) => c.employee_id === employee_id);
    if (status) filtered = filtered.filter((c) => c.status === status);
    if (contract_type) filtered = filtered.filter((c) => c.contract_type === contract_type);
    if (date) {
      filtered = filtered.filter((c) => c.start_date <= date && (!c.end_date || c.end_date >= date));
    }
    return filtered.length;
  },

  findContractById: async (id) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          SELECT 
            c.*,
            e.first_name,
            e.last_name,
            e.employee_code,
            e.email as employee_email,
            e.department as employee_department,
            e.designation as employee_designation,
            ws.name as schedule_name,
            ws.total_weekly_hours as schedule_weekly_hours,
            ws.days_config as schedule_days_config,
            st.name as salary_structure_name,
            st.code as salary_structure_code
          FROM contracts c
          LEFT JOIN employees e ON c.employee_id = e.id
          LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
          LEFT JOIN salary_structures st ON c.salary_structure_id = st.id
          WHERE c.id = $1
        `;
        const res = await db.query(sql, [id]);
        if (res.rows[0]) {
          const row = res.rows[0];
          return {
            ...row,
            employee_name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.employee_code,
            reference: `CNT-${row.id.substring(0, 8).toUpperCase()}`,
          };
        }
        return null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findContractById]:', e.message);
    }

    const found = memoryContracts.find((c) => c.id === id);
    if (!found) return null;
    return {
      ...found,
      employee_name: `Employee #${found.employee_id ? found.employee_id.substring(0, 8) : '-'}`,
      reference: `CNT-${found.id.substring(0, 8).toUpperCase()}`,
    };
  },

  findActiveContractForDate: async (employee_id, date) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          SELECT 
            c.*,
            e.first_name,
            e.last_name,
            e.employee_code,
            e.email as employee_email,
            ws.name as schedule_name,
            ws.total_weekly_hours as schedule_weekly_hours,
            st.name as salary_structure_name,
            st.code as salary_structure_code
          FROM contracts c
          LEFT JOIN employees e ON c.employee_id = e.id
          LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
          LEFT JOIN salary_structures st ON c.salary_structure_id = st.id
          WHERE c.employee_id = $1
            AND c.status = 'ACTIVE'
            AND c.start_date <= $2::DATE
            AND (c.end_date IS NULL OR c.end_date >= $2::DATE)
          ORDER BY c.start_date DESC
          LIMIT 1;
        `;
        const res = await db.query(sql, [employee_id, date]);
        if (res.rows[0]) {
          const row = res.rows[0];
          return {
            ...row,
            employee_name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.employee_code,
            reference: `CNT-${row.id.substring(0, 8).toUpperCase()}`,
          };
        }
        return null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findActiveContractForDate]:', e.message);
    }

    const found = memoryContracts
      .filter(
        (c) =>
          c.employee_id === employee_id &&
          c.status === 'ACTIVE' &&
          c.start_date <= date &&
          (!c.end_date || c.end_date >= date)
      )
      .sort((a, b) => (b.start_date > a.start_date ? 1 : -1))[0];

    return found || null;
  },

  findActiveContractForPeriod: async (employee_id, period_start, period_end) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          SELECT 
            c.*,
            e.first_name,
            e.last_name,
            e.employee_code,
            e.email as employee_email,
            ws.name as schedule_name,
            ws.total_weekly_hours as schedule_weekly_hours,
            st.name as salary_structure_name,
            st.code as salary_structure_code
          FROM contracts c
          LEFT JOIN employees e ON c.employee_id = e.id
          LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
          LEFT JOIN salary_structures st ON c.salary_structure_id = st.id
          WHERE c.employee_id = $1
            AND c.status = 'ACTIVE'
            AND c.start_date <= $3::DATE
            AND (c.end_date IS NULL OR c.end_date >= $2::DATE)
          ORDER BY c.start_date DESC
          LIMIT 1;
        `;
        const res = await db.query(sql, [employee_id, period_start, period_end]);
        if (res.rows[0]) {
          const row = res.rows[0];
          return {
            ...row,
            employee_name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.employee_code,
            reference: `CNT-${row.id.substring(0, 8).toUpperCase()}`,
          };
        }
        return null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findActiveContractForPeriod]:', e.message);
    }

    const found = memoryContracts
      .filter(
        (c) =>
          c.employee_id === employee_id &&
          c.status === 'ACTIVE' &&
          c.start_date <= period_end &&
          (!c.end_date || c.end_date >= period_start)
      )
      .sort((a, b) => (b.start_date > a.start_date ? 1 : -1))[0];

    return found || null;
  },

  checkOverlap: async (employee_id, start_date, end_date, excludeContractId = null) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = `
          SELECT id, start_date, end_date, status
          FROM contracts
          WHERE employee_id = $1
            AND status = 'ACTIVE'
            AND start_date <= COALESCE($3::DATE, '9999-12-31'::DATE)
            AND COALESCE(end_date, '9999-12-31'::DATE) >= $2::DATE
        `;
        const params = [employee_id, start_date, end_date || null];
        if (excludeContractId) {
          sql += ` AND id != $4`;
          params.push(excludeContractId);
        }
        const res = await db.query(sql, params);
        return res.rows;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback checkOverlap]:', e.message);
    }

    const targetEnd = end_date || '9999-12-31';
    return memoryContracts.filter((c) => {
      if (c.employee_id !== employee_id || c.status !== 'ACTIVE') return false;
      if (excludeContractId && c.id === excludeContractId) return false;
      const cEnd = c.end_date || '9999-12-31';
      return c.start_date <= targetEnd && cEnd >= start_date;
    });
  },

  createContract: async (data) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `cnt-${Date.now()}`;
    const now = new Date().toISOString();

    const newContract = {
      id,
      employee_id: data.employee_id,
      contract_type: data.contract_type || 'PERMANENT',
      wage_rate: parseFloat(data.wage_rate || 0.0),
      wage_type: data.wage_type || 'MONTHLY',
      start_date: data.start_date,
      end_date: data.end_date || null,
      working_schedule_id: data.working_schedule_id || null,
      salary_structure_id: data.salary_structure_id || null,
      status: data.status || 'ACTIVE',
      notes: data.notes || null,
      created_at: now,
      updated_at: now,
    };

    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          INSERT INTO contracts (
            id, employee_id, contract_type, wage_rate, wage_type,
            start_date, end_date, working_schedule_id, salary_structure_id,
            status, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *;
        `;
        const res = await db.query(sql, [
          newContract.id,
          newContract.employee_id,
          newContract.contract_type,
          newContract.wage_rate,
          newContract.wage_type,
          newContract.start_date,
          newContract.end_date,
          newContract.working_schedule_id,
          newContract.salary_structure_id,
          newContract.status,
          newContract.notes,
          newContract.created_at,
          newContract.updated_at,
        ]);
        return contractRepository.findContractById(res.rows[0].id);
      }
    } catch (e) {
      console.warn('[Repository DB Fallback createContract]:', e.message);
    }

    memoryContracts.unshift(newContract);
    return contractRepository.findContractById(newContract.id);
  },

  updateContract: async (id, data) => {
    const now = new Date().toISOString();

    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const fields = [];
        const params = [id];
        let pIdx = 2;

        if (data.contract_type !== undefined) {
          fields.push(`contract_type = $${pIdx}`);
          params.push(data.contract_type);
          pIdx++;
        }
        if (data.wage_rate !== undefined) {
          fields.push(`wage_rate = $${pIdx}`);
          params.push(parseFloat(data.wage_rate));
          pIdx++;
        }
        if (data.wage_type !== undefined) {
          fields.push(`wage_type = $${pIdx}`);
          params.push(data.wage_type);
          pIdx++;
        }
        if (data.start_date !== undefined) {
          fields.push(`start_date = $${pIdx}`);
          params.push(data.start_date);
          pIdx++;
        }
        if (data.end_date !== undefined) {
          fields.push(`end_date = $${pIdx}`);
          params.push(data.end_date || null);
          pIdx++;
        }
        if (data.working_schedule_id !== undefined) {
          fields.push(`working_schedule_id = $${pIdx}`);
          params.push(data.working_schedule_id || null);
          pIdx++;
        }
        if (data.salary_structure_id !== undefined) {
          fields.push(`salary_structure_id = $${pIdx}`);
          params.push(data.salary_structure_id || null);
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

        const sql = `UPDATE contracts SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
        await db.query(sql, params);
        return contractRepository.findContractById(id);
      }
    } catch (e) {
      console.warn('[Repository DB Fallback updateContract]:', e.message);
    }

    const idx = memoryContracts.findIndex((c) => c.id === id);
    if (idx !== -1) {
      memoryContracts[idx] = { ...memoryContracts[idx], ...data, updated_at: now };
      return contractRepository.findContractById(id);
    }
    return null;
  },

  deleteContract: async (id) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        await db.query('DELETE FROM contracts WHERE id = $1', [id]);
        return true;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback deleteContract]:', e.message);
    }

    const idx = memoryContracts.findIndex((c) => c.id === id);
    if (idx !== -1) {
      memoryContracts.splice(idx, 1);
      return true;
    }
    return false;
  },
};

module.exports = contractRepository;
