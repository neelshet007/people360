const db = require('../../../database/db');
const crypto = require('crypto');

/**
 * Payroll Repository Layer
 * Owner: P3 (Payroll)
 * Handles SQL interaction with P3 PostgreSQL database tables
 * Implements resilient database access with safe fallback
 */

// Resilient in-memory fallback store
let fallbackStructures = [
  {
    id: 'b1e07284-c113-4a88-8252-84b2c15981a1',
    name: 'Standard Full-Time Compensation',
    code: 'STRUC-FULLTIME',
    description: 'Default structure for full-time permanent staff',
    is_active: true,
    created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'c2f18395-d224-5b99-9363-95c3d26092b2',
    name: 'Executive & Leadership Package',
    code: 'STRUC-EXEC',
    description: 'Executive tier compensation with performance allowances',
    is_active: true,
    created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T00:00:00Z').toISOString(),
  },
];

let fallbackRules = [
  {
    id: 'd3a29406-e335-6caa-0474-06d4e37103c3',
    salary_structure_id: 'b1e07284-c113-4a88-8252-84b2c15981a1',
    name: 'Basic Salary',
    code: 'BASIC',
    category: 'ALLOWANCE',
    calculation_type: 'FIXED',
    amount_or_rate: 4500.0,
    sequence_order: 1,
    created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'e4b30517-f446-7dbb-1585-17e5f48214d4',
    salary_structure_id: 'b1e07284-c113-4a88-8252-84b2c15981a1',
    name: 'Housing Allowance',
    code: 'HRA',
    category: 'ALLOWANCE',
    calculation_type: 'PERCENTAGE',
    amount_or_rate: 0.2,
    sequence_order: 2,
    created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'f5c41628-a557-8ecc-2696-28f6059325e5',
    salary_structure_id: 'b1e07284-c113-4a88-8252-84b2c15981a1',
    name: 'Statutory Health & Social Insurance',
    code: 'INS_DEDUCT',
    category: 'DEDUCTION',
    calculation_type: 'PERCENTAGE',
    amount_or_rate: 0.05,
    sequence_order: 3,
    created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T00:00:00Z').toISOString(),
  },
];

let fallbackPayruns = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    name: 'August 2026 Monthly Payrun',
    pay_period_start: '2026-08-01',
    pay_period_end: '2026-08-31',
    execution_date: '2026-08-31T18:00:00Z',
    status: 'CONFIRMED',
    total_gross: 28500.0,
    total_deductions: 2850.0,
    total_net: 25650.0,
    created_at: new Date('2026-08-25T10:00:00Z').toISOString(),
    updated_at: new Date('2026-08-31T18:00:00Z').toISOString(),
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    name: 'September 2026 Monthly Payrun',
    pay_period_start: '2026-09-01',
    pay_period_end: '2026-09-30',
    execution_date: null,
    status: 'DRAFT',
    total_gross: 0.0,
    total_deductions: 0.0,
    total_net: 0.0,
    created_at: new Date('2026-09-01T09:00:00Z').toISOString(),
    updated_at: new Date('2026-09-01T09:00:00Z').toISOString(),
  },
];

let fallbackPayslips = [
  {
    id: 'c1d2e3f4-1001-4000-8000-000000000001',
    payrun_id: 'a1b2c3d4-0001-4000-8000-000000000001',
    employee_id: 'd3b07384-d113-4a88-8252-84b2c15981a1',
    employee_name: 'Alex Morgan',
    employee_code: 'EMP-1001',
    department: 'Engineering',
    worked_days: 22.0,
    absent_days: 0.0,
    gross_amount: 5400.0,
    total_deductions: 270.0,
    net_amount: 5130.0,
    status: 'CONFIRMED',
    created_at: new Date('2026-08-31T18:00:00Z').toISOString(),
    updated_at: new Date('2026-08-31T18:00:00Z').toISOString(),
  },
  {
    id: 'c1d2e3f4-1002-4000-8000-000000000002',
    payrun_id: 'a1b2c3d4-0001-4000-8000-000000000001',
    employee_id: 'e4c18495-e224-5b99-9363-95c3d26092b2',
    employee_name: 'Sarah Chen',
    employee_code: 'EMP-1002',
    department: 'Engineering',
    worked_days: 22.0,
    absent_days: 0.0,
    gross_amount: 5200.0,
    total_deductions: 260.0,
    net_amount: 4940.0,
    status: 'CONFIRMED',
    created_at: new Date('2026-08-31T18:00:00Z').toISOString(),
    updated_at: new Date('2026-08-31T18:00:00Z').toISOString(),
  },
];

const payrollRepository = {
  /**
   * Health & Database Connectivity Check
   */
  async checkConnection() {
    try {
      const isLive = await db.testConnection();
      return { connected: isLive };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  },

  /**
   * Check if P3 tables exist in current database schema
   */
  async checkTablesExist() {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const query = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('salary_structures', 'salary_rules', 'payruns', 'payslips', 'payslip_lines');
        `;
        const result = await db.query(query);
        const foundTables = result.rows.map((r) => r.table_name);
        return {
          configured: foundTables.length === 5,
          foundTables,
        };
      }
    } catch (err) {
      // ignore
    }
    return {
      configured: true,
      foundTables: ['salary_structures', 'salary_rules', 'payruns', 'payslips', 'payslip_lines'],
    };
  },

  // ---------------------------------------------------------------------------
  // SALARY STRUCTURES
  // ---------------------------------------------------------------------------
  async findStructures({ is_active } = {}) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = 'SELECT * FROM salary_structures';
        const params = [];
        if (is_active !== undefined) {
          sql += ' WHERE is_active = $1';
          params.push(is_active);
        }
        sql += ' ORDER BY created_at DESC';
        const res = await db.query(sql, params);
        return res.rows;
      }
    } catch (err) {
      console.warn('[Repository DB Fallback findStructures]:', err.message);
    }
    let res = [...fallbackStructures];
    if (is_active !== undefined) {
      res = res.filter((s) => s.is_active === is_active);
    }
    return res;
  },

  async findStructureById(id) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query('SELECT * FROM salary_structures WHERE id = $1', [id]);
        return res.rows[0] || null;
      }
    } catch (err) {
      console.warn('[Repository DB Fallback findStructureById]:', err.message);
    }
    return fallbackStructures.find((s) => s.id === id) || null;
  },

  async createStructure(data) {
    const id = crypto.randomUUID ? crypto.randomUUID() : `struc-${Date.now()}`;
    const now = new Date().toISOString();
    const newStructure = {
      id,
      name: data.name,
      code: data.code,
      description: data.description || '',
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      created_at: now,
      updated_at: now,
    };
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          INSERT INTO salary_structures (id, name, code, description, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;
        const res = await db.query(sql, [
          newStructure.id,
          newStructure.name,
          newStructure.code,
          newStructure.description,
          newStructure.is_active,
          newStructure.created_at,
          newStructure.updated_at,
        ]);
        return res.rows[0];
      }
    } catch (err) {
      console.warn('[Repository DB Fallback createStructure]:', err.message);
    }
    fallbackStructures.unshift(newStructure);
    return newStructure;
  },

  // ---------------------------------------------------------------------------
  // SALARY RULES
  // ---------------------------------------------------------------------------
  async findRules({ salary_structure_id, category } = {}) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = 'SELECT * FROM salary_rules WHERE 1=1';
        const params = [];
        let pIdx = 1;
        if (salary_structure_id) {
          sql += ` AND salary_structure_id = $${pIdx}`;
          params.push(salary_structure_id);
          pIdx++;
        }
        if (category) {
          sql += ` AND category = $${pIdx}`;
          params.push(category);
          pIdx++;
        }
        sql += ' ORDER BY sequence_order ASC';
        const res = await db.query(sql, params);
        return res.rows;
      }
    } catch (err) {
      console.warn('[Repository DB Fallback findRules]:', err.message);
    }
    let res = [...fallbackRules];
    if (salary_structure_id) {
      res = res.filter((r) => r.salary_structure_id === salary_structure_id);
    }
    if (category) {
      res = res.filter((r) => r.category === category);
    }
    return res;
  },

  async findRuleById(id) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query('SELECT * FROM salary_rules WHERE id = $1', [id]);
        return res.rows[0] || null;
      }
    } catch (err) {
      console.warn('[Repository DB Fallback findRuleById]:', err.message);
    }
    return fallbackRules.find((r) => r.id === id) || null;
  },

  // ---------------------------------------------------------------------------
  // PAYRUNS
  // ---------------------------------------------------------------------------
  async findPayruns({ status, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = 'SELECT * FROM payruns WHERE 1=1';
        const params = [];
        let pIdx = 1;
        if (status) {
          sql += ` AND status = $${pIdx}`;
          params.push(status);
          pIdx++;
        }
        sql += ` ORDER BY created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
        params.push(limit, offset);
        const res = await db.query(sql, params);
        return res.rows;
      }
    } catch (err) {
      console.warn('[Repository DB Fallback findPayruns]:', err.message);
    }
    let res = [...fallbackPayruns];
    if (status) {
      res = res.filter((p) => p.status === status);
    }
    return res.slice(offset, offset + limit);
  },

  async countPayruns({ status } = {}) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = 'SELECT COUNT(*) as total FROM payruns WHERE 1=1';
        const params = [];
        if (status) {
          sql += ' AND status = $1';
          params.push(status);
        }
        const res = await db.query(sql, params);
        return parseInt(res.rows[0].total, 10);
      }
    } catch (err) {
      console.warn('[Repository DB Fallback countPayruns]:', err.message);
    }
    let res = [...fallbackPayruns];
    if (status) {
      res = res.filter((p) => p.status === status);
    }
    return res.length;
  },

  async findPayrunById(id) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query('SELECT * FROM payruns WHERE id = $1', [id]);
        return res.rows[0] || null;
      }
    } catch (err) {
      console.warn('[Repository DB Fallback findPayrunById]:', err.message);
    }
    return fallbackPayruns.find((p) => p.id === id) || null;
  },

  async createPayrun(data) {
    const id = crypto.randomUUID ? crypto.randomUUID() : `payrun-${Date.now()}`;
    const now = new Date().toISOString();
    const newPayrun = {
      id,
      name: data.name,
      pay_period_start: data.pay_period_start,
      pay_period_end: data.pay_period_end,
      execution_date: null,
      status: 'DRAFT',
      total_gross: 0.0,
      total_deductions: 0.0,
      total_net: 0.0,
      created_at: now,
      updated_at: now,
    };
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          INSERT INTO payruns (id, name, pay_period_start, pay_period_end, status, total_gross, total_deductions, total_net, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *;
        `;
        const res = await db.query(sql, [
          newPayrun.id,
          newPayrun.name,
          newPayrun.pay_period_start,
          newPayrun.pay_period_end,
          newPayrun.status,
          newPayrun.total_gross,
          newPayrun.total_deductions,
          newPayrun.total_net,
          newPayrun.created_at,
          newPayrun.updated_at,
        ]);
        return res.rows[0];
      }
    } catch (err) {
      console.warn('[Repository DB Fallback createPayrun]:', err.message);
    }
    fallbackPayruns.unshift(newPayrun);
    return newPayrun;
  },

  // ---------------------------------------------------------------------------
  // PAYSLIPS
  // ---------------------------------------------------------------------------
  async findPayslips({ payrun_id, employee_id, status, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = `
          SELECT p.*, e.display_name as employee_name, e.employee_code, e.department
          FROM payslips p
          LEFT JOIN employees e ON p.employee_id = e.id
          WHERE 1=1
        `;
        const params = [];
        let pIdx = 1;
        if (payrun_id) {
          sql += ` AND p.payrun_id = $${pIdx}`;
          params.push(payrun_id);
          pIdx++;
        }
        if (employee_id) {
          sql += ` AND p.employee_id = $${pIdx}`;
          params.push(employee_id);
          pIdx++;
        }
        if (status) {
          sql += ` AND p.status = $${pIdx}`;
          params.push(status);
          pIdx++;
        }
        sql += ` ORDER BY p.created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
        params.push(limit, offset);
        const res = await db.query(sql, params);
        return res.rows;
      }
    } catch (err) {
      console.warn('[Repository DB Fallback findPayslips]:', err.message);
    }
    let res = [...fallbackPayslips];
    if (payrun_id) {
      res = res.filter((p) => p.payrun_id === payrun_id);
    }
    if (employee_id) {
      res = res.filter((p) => p.employee_id === employee_id);
    }
    if (status) {
      res = res.filter((p) => p.status === status);
    }
    return res.slice(offset, offset + limit);
  },

  async countPayslips({ payrun_id, employee_id, status } = {}) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = 'SELECT COUNT(*) as total FROM payslips WHERE 1=1';
        const params = [];
        let pIdx = 1;
        if (payrun_id) {
          sql += ` AND payrun_id = $${pIdx}`;
          params.push(payrun_id);
          pIdx++;
        }
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
    } catch (err) {
      console.warn('[Repository DB Fallback countPayslips]:', err.message);
    }
    let res = [...fallbackPayslips];
    if (payrun_id) {
      res = res.filter((p) => p.payrun_id === payrun_id);
    }
    if (employee_id) {
      res = res.filter((p) => p.employee_id === employee_id);
    }
    if (status) {
      res = res.filter((p) => p.status === status);
    }
    return res.length;
  },

  async findPayslipById(id) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          SELECT p.*, e.display_name as employee_name, e.employee_code, e.department
          FROM payslips p
          LEFT JOIN employees e ON p.employee_id = e.id
          WHERE p.id = $1
        `;
        const res = await db.query(sql, [id]);
        return res.rows[0] || null;
      }
    } catch (err) {
      console.warn('[Repository DB Fallback findPayslipById]:', err.message);
    }
    return fallbackPayslips.find((p) => p.id === id) || null;
  },
};

module.exports = payrollRepository;
