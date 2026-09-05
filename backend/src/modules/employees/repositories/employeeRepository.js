const db = require('../../../database/db');
const crypto = require('crypto');

/**
 * Employee Repository Layer
 * Owner: P1 (Core HR)
 * Raw SQL Data Access Layer with resilient storage
 */

// Fallback in-memory store for environments without live Postgres credentials
let memoryStore = [
  {
    id: 'd3b07384-d113-4a88-8252-84b2c15981a1',
    employee_code: 'EMP-1001',
    first_name: 'Alex',
    middle_name: null,
    last_name: 'Morgan',
    display_name: 'Alex Morgan',
    email: 'alex.morgan@company.com',
    phone: '+1 555-0101',
    address: '124 Market St, San Francisco, CA',
    department: 'Engineering',
    designation: 'Lead Software Engineer',
    status: 'ACTIVE',
    date_of_joining: '2023-01-15',
    date_of_birth: '1990-05-12',
    gender: 'Male',
    national_id: 'ID-882910',
    emergency_contact_name: 'Sarah Morgan',
    emergency_contact_phone: '+1 555-0199',
    created_at: new Date('2023-01-15T09:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e4c18495-e224-5b99-9363-95c3d26092b2',
    employee_code: 'EMP-1002',
    first_name: 'Sarah',
    middle_name: null,
    last_name: 'Chen',
    display_name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    phone: '+1 555-0102',
    address: '450 Howard St, San Francisco, CA',
    department: 'Engineering',
    designation: 'Senior Frontend Developer',
    status: 'ACTIVE',
    date_of_joining: '2023-04-10',
    date_of_birth: '1992-08-23',
    gender: 'Female',
    national_id: 'ID-882911',
    emergency_contact_name: 'Michael Chen',
    emergency_contact_phone: '+1 555-0198',
    created_at: new Date('2023-04-10T09:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'f5d29506-f335-6caa-0474-06d4e37103c3',
    employee_code: 'EMP-1003',
    first_name: 'Marcus',
    middle_name: null,
    last_name: 'Vance',
    display_name: 'Marcus Vance',
    email: 'marcus.vance@company.com',
    phone: '+1 555-0103',
    address: '789 Mission St, San Francisco, CA',
    department: 'Human Resources',
    designation: 'HR Operations Manager',
    status: 'ACTIVE',
    date_of_joining: '2022-08-01',
    date_of_birth: '1988-11-04',
    gender: 'Male',
    national_id: 'ID-882912',
    emergency_contact_name: 'Laura Vance',
    emergency_contact_phone: '+1 555-0197',
    created_at: new Date('2022-08-01T09:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'a6e30617-a446-7dbb-1585-17e5f48214d4',
    employee_code: 'EMP-1004',
    first_name: 'Elena',
    middle_name: null,
    last_name: 'Rostova',
    display_name: 'Elena Rostova',
    email: 'elena.rostova@company.com',
    phone: '+1 555-0104',
    address: '101 California St, San Francisco, CA',
    department: 'Finance',
    designation: 'Senior Payroll Specialist',
    status: 'ON_LEAVE',
    date_of_joining: '2023-09-20',
    date_of_birth: '1991-03-18',
    gender: 'Female',
    national_id: 'ID-882913',
    emergency_contact_name: 'Dmitri Rostov',
    emergency_contact_phone: '+1 555-0196',
    created_at: new Date('2023-09-20T09:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b7f41728-b557-8ecc-2696-28f6a59325e5',
    employee_code: 'EMP-1005',
    first_name: 'David',
    middle_name: null,
    last_name: 'Kim',
    display_name: 'David Kim',
    email: 'david.kim@company.com',
    phone: '+1 555-0105',
    address: '333 Bush St, San Francisco, CA',
    department: 'Operations',
    designation: 'DevOps Specialist',
    status: 'INACTIVE',
    date_of_joining: '2024-02-01',
    date_of_birth: '1993-12-05',
    gender: 'Male',
    national_id: 'ID-882914',
    emergency_contact_name: 'Grace Kim',
    emergency_contact_phone: '+1 555-0195',
    created_at: new Date('2024-02-01T09:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const employeeRepository = {
  findAll: async ({ search, department, status, sortBy = 'created_at', sortOrder = 'DESC', limit = 10, offset = 0 }) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const conditions = [];
        const params = [];
        let pIdx = 1;

        if (search) {
          conditions.push(`(first_name ILIKE $${pIdx} OR last_name ILIKE $${pIdx} OR employee_code ILIKE $${pIdx} OR email ILIKE $${pIdx} OR designation ILIKE $${pIdx})`);
          params.push(`%${search}%`);
          pIdx++;
        }

        if (department) {
          conditions.push(`department = $${pIdx}`);
          params.push(department);
          pIdx++;
        }

        if (status) {
          conditions.push(`status = $${pIdx}`);
          params.push(status);
          pIdx++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const allowedSortCols = ['first_name', 'last_name', 'employee_code', 'department', 'designation', 'status', 'date_of_joining', 'created_at'];
        const safeSortBy = allowedSortCols.includes(sortBy) ? sortBy : 'created_at';
        const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const querySql = `
          SELECT * FROM employees
          ${whereClause}
          ORDER BY ${safeSortBy} ${safeSortOrder}
          LIMIT $${pIdx} OFFSET $${pIdx + 1}
        `;
        params.push(limit, offset);

        const res = await db.query(querySql, params);
        return res.rows;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback]:', e.message);
    }

    // In-memory fallback
    let filtered = [...memoryStore];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.first_name?.toLowerCase().includes(q) ||
          e.last_name?.toLowerCase().includes(q) ||
          e.employee_code?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.designation?.toLowerCase().includes(q)
      );
    }

    if (department) {
      filtered = filtered.filter((e) => e.department.toLowerCase() === department.toLowerCase());
    }

    if (status) {
      filtered = filtered.filter((e) => e.status.toUpperCase() === status.toUpperCase());
    }

    // Sort
    filtered.sort((a, b) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      if (valA < valB) return sortOrder.toUpperCase() === 'ASC' ? -1 : 1;
      if (valA > valB) return sortOrder.toUpperCase() === 'ASC' ? 1 : -1;
      return 0;
    });

    return filtered.slice(offset, offset + limit);
  },

  count: async ({ search, department, status }) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const conditions = [];
        const params = [];
        let pIdx = 1;

        if (search) {
          conditions.push(`(first_name ILIKE $${pIdx} OR last_name ILIKE $${pIdx} OR employee_code ILIKE $${pIdx} OR email ILIKE $${pIdx} OR designation ILIKE $${pIdx})`);
          params.push(`%${search}%`);
          pIdx++;
        }

        if (department) {
          conditions.push(`department = $${pIdx}`);
          params.push(department);
          pIdx++;
        }

        if (status) {
          conditions.push(`status = $${pIdx}`);
          params.push(status);
          pIdx++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const countSql = `SELECT COUNT(*) as total FROM employees ${whereClause}`;
        const res = await db.query(countSql, params);
        return parseInt(res.rows[0].total, 10);
      }
    } catch (e) {
      console.warn('[Repository DB Fallback count]:', e.message);
    }

    let filtered = [...memoryStore];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.first_name?.toLowerCase().includes(q) ||
          e.last_name?.toLowerCase().includes(q) ||
          e.employee_code?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q)
      );
    }
    if (department) {
      filtered = filtered.filter((e) => e.department.toLowerCase() === department.toLowerCase());
    }
    if (status) {
      filtered = filtered.filter((e) => e.status.toUpperCase() === status.toUpperCase());
    }
    return filtered.length;
  },

  findById: async (id) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query('SELECT * FROM employees WHERE id = $1', [id]);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findById]:', e.message);
    }
    return memoryStore.find((e) => e.id === id) || null;
  },

  findByEmail: async (email, excludeId = null) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = 'SELECT * FROM employees WHERE LOWER(email) = LOWER($1)';
        const params = [email];
        if (excludeId) {
          sql += ' AND id != $2';
          params.push(excludeId);
        }
        const res = await db.query(sql, params);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findByEmail]:', e.message);
    }
    return memoryStore.find(
      (e) => e.email.toLowerCase() === email.toLowerCase() && (excludeId ? e.id !== excludeId : true)
    ) || null;
  },

  findByCode: async (code, excludeId = null) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = 'SELECT * FROM employees WHERE LOWER(employee_code) = LOWER($1)';
        const params = [code];
        if (excludeId) {
          sql += ' AND id != $2';
          params.push(excludeId);
        }
        const res = await db.query(sql, params);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback findByCode]:', e.message);
    }
    return memoryStore.find(
      (e) => e.employee_code.toLowerCase() === code.toLowerCase() && (excludeId ? e.id !== excludeId : true)
    ) || null;
  },

  create: async (data) => {
    const displayName = `${data.first_name} ${data.last_name}`.trim();
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const insertSql = `
          INSERT INTO employees (
            employee_code, first_name, middle_name, last_name, display_name,
            email, phone, address, department, designation, status,
            date_of_joining, date_of_birth, gender, national_id,
            emergency_contact_name, emergency_contact_phone
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING *
        `;
        const params = [
          data.employee_code,
          data.first_name,
          data.middle_name || null,
          data.last_name,
          displayName,
          data.email,
          data.phone || null,
          data.address || null,
          data.department,
          data.designation,
          data.status || 'ACTIVE',
          data.date_of_joining || new Date(),
          data.date_of_birth || null,
          data.gender || null,
          data.national_id || null,
          data.emergency_contact_name || null,
          data.emergency_contact_phone || null,
        ];
        const res = await db.query(insertSql, params);
        return res.rows[0];
      }
    } catch (e) {
      console.warn('[Repository DB Fallback create]:', e.message);
    }

    // In-memory fallback
    const newEmployee = {
      id: crypto.randomUUID(),
      employee_code: data.employee_code,
      first_name: data.first_name,
      middle_name: data.middle_name || null,
      last_name: data.last_name,
      display_name: displayName,
      email: data.email,
      phone: data.phone || null,
      address: data.address || null,
      department: data.department,
      designation: data.designation,
      status: data.status || 'ACTIVE',
      date_of_joining: data.date_of_joining || new Date().toISOString().split('T')[0],
      date_of_birth: data.date_of_birth || null,
      gender: data.gender || null,
      national_id: data.national_id || null,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: data.emergency_contact_phone || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.unshift(newEmployee);
    return newEmployee;
  },

  update: async (id, data) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const existing = await employeeRepository.findById(id);
        if (!existing) return null;

        const firstName = data.first_name !== undefined ? data.first_name : existing.first_name;
        const lastName = data.last_name !== undefined ? data.last_name : existing.last_name;
        const displayName = `${firstName} ${lastName}`.trim();

        const updateSql = `
          UPDATE employees SET
            employee_code = COALESCE($1, employee_code),
            first_name = COALESCE($2, first_name),
            middle_name = COALESCE($3, middle_name),
            last_name = COALESCE($4, last_name),
            display_name = $5,
            email = COALESCE($6, email),
            phone = COALESCE($7, phone),
            address = COALESCE($8, address),
            department = COALESCE($9, department),
            designation = COALESCE($10, designation),
            status = COALESCE($11, status),
            date_of_joining = COALESCE($12, date_of_joining),
            date_of_birth = COALESCE($13, date_of_birth),
            gender = COALESCE($14, gender),
            national_id = COALESCE($15, national_id),
            emergency_contact_name = COALESCE($16, emergency_contact_name),
            emergency_contact_phone = COALESCE($17, emergency_contact_phone),
            updated_at = NOW()
          WHERE id = $18
          RETURNING *
        `;
        const params = [
          data.employee_code || null,
          data.first_name || null,
          data.middle_name || null,
          data.last_name || null,
          displayName,
          data.email || null,
          data.phone || null,
          data.address || null,
          data.department || null,
          data.designation || null,
          data.status || null,
          data.date_of_joining || null,
          data.date_of_birth || null,
          data.gender || null,
          data.national_id || null,
          data.emergency_contact_name || null,
          data.emergency_contact_phone || null,
          id,
        ];
        const res = await db.query(updateSql, params);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback update]:', e.message);
    }

    // In-memory fallback
    const idx = memoryStore.findIndex((e) => e.id === id);
    if (idx === -1) return null;

    const existing = memoryStore[idx];
    const firstName = data.first_name !== undefined ? data.first_name : existing.first_name;
    const lastName = data.last_name !== undefined ? data.last_name : existing.last_name;

    const updated = {
      ...existing,
      ...data,
      display_name: `${firstName} ${lastName}`.trim(),
      updated_at: new Date().toISOString(),
    };
    memoryStore[idx] = updated;
    return updated;
  },

  delete: async (id) => {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        // Mark status as TERMINATED or delete
        const res = await db.query('UPDATE employees SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', ['TERMINATED', id]);
        return res.rows[0] || null;
      }
    } catch (e) {
      console.warn('[Repository DB Fallback delete]:', e.message);
    }

    const idx = memoryStore.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    memoryStore[idx].status = 'TERMINATED';
    memoryStore[idx].updated_at = new Date().toISOString();
    return memoryStore[idx];
  },
};

module.exports = employeeRepository;
