const db = require('../../../database/db');
const crypto = require('crypto');

/**
 * Bonus Allocation Repository
 * Owner: P3 (Payroll) — ExFeat
 *
 * Handles SQL for bonus_allocations table.
 * Falls back to in-memory store when DB is unavailable (same pattern as payrollRepository).
 */

let fallbackAllocations = [];

const bonusRepository = {
  // ---------------------------------------------------------------------------
  // BONUS ALLOCATIONS CRUD
  // ---------------------------------------------------------------------------

  /**
   * List all bonus_allocations for a given payrun, optionally filtered by status
   */
  async findAllocations({ payrun_id, employee_id, status } = {}) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = `
          SELECT ba.*,
            e.employee_code, e.display_name AS employee_name,
            e.department, e.designation,
            e.email AS employee_email,
            u.name AS approved_by_name
          FROM bonus_allocations ba
          JOIN employees e ON ba.employee_id = e.id
          LEFT JOIN users u ON ba.approved_by = u.id
          WHERE 1=1
        `;
        const params = [];
        let idx = 1;
        if (payrun_id) {
          sql += ` AND ba.payrun_id = $${idx++}`;
          params.push(payrun_id);
        }
        if (employee_id) {
          sql += ` AND ba.employee_id = $${idx++}`;
          params.push(employee_id);
        }
        if (status) {
          sql += ` AND ba.status = $${idx++}`;
          params.push(status);
        }
        sql += ' ORDER BY e.display_name ASC';
        const res = await db.query(sql, params);
        return res.rows;
      }
    } catch (err) {
      console.warn('[BonusRepo DB Fallback findAllocations]:', err.message);
    }
    let res = [...fallbackAllocations];
    if (payrun_id) res = res.filter((a) => a.payrun_id === payrun_id);
    if (employee_id) res = res.filter((a) => a.employee_id === employee_id);
    if (status) res = res.filter((a) => a.status === status);
    return res;
  },

  /**
   * Find a single bonus_allocation by id
   */
  async findAllocationById(id) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const sql = `
          SELECT ba.*,
            e.employee_code, e.display_name AS employee_name,
            e.department, e.designation, e.email AS employee_email
          FROM bonus_allocations ba
          JOIN employees e ON ba.employee_id = e.id
          WHERE ba.id = $1
        `;
        const res = await db.query(sql, [id]);
        return res.rows[0] || null;
      }
    } catch (err) {
      console.warn('[BonusRepo DB Fallback findAllocationById]:', err.message);
    }
    return fallbackAllocations.find((a) => a.id === id) || null;
  },

  /**
   * Bulk-create bonus_allocations for a payrun (one per employee)
   */
  async bulkCreateAllocations(payrunId, employees, bonusType, defaultAmount = 0) {
    const now = new Date().toISOString();
    const created = [];
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        for (const emp of employees) {
          const id = crypto.randomUUID();
          const res = await db.query(
            `INSERT INTO bonus_allocations
               (id, payrun_id, employee_id, bonus_type, amount, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, 'DRAFT', $6, $7)
             RETURNING *`,
            [id, payrunId, emp.id, bonusType, parseFloat(defaultAmount || 0), now, now]
          );
          created.push(res.rows[0]);
        }
        return created;
      }
    } catch (err) {
      console.warn('[BonusRepo DB Fallback bulkCreateAllocations]:', err.message);
    }
    for (const emp of employees) {
      const alloc = {
        id: crypto.randomUUID(),
        payrun_id: payrunId,
        employee_id: emp.id,
        employee_code: emp.employee_code,
        employee_name: emp.display_name || `${emp.first_name} ${emp.last_name}`,
        department: emp.department,
        designation: emp.designation,
        employee_email: emp.email,
        bonus_type: bonusType,
        amount: parseFloat(defaultAmount || 0),
        remarks: null,
        status: 'DRAFT',
        approved_by: null,
        approved_at: null,
        created_at: now,
        updated_at: now,
      };
      fallbackAllocations.push(alloc);
      created.push(alloc);
    }
    return created;
  },

  /**
   * Update a single bonus_allocation (amount, remarks, status)
   */
  async updateAllocation(id, data) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const fields = [];
        const params = [id];
        let idx = 2;

        if (data.amount !== undefined) {
          fields.push(`amount = $${idx++}`);
          params.push(parseFloat(data.amount));
        }
        if (data.remarks !== undefined) {
          fields.push(`remarks = $${idx++}`);
          params.push(data.remarks);
        }
        if (data.status !== undefined) {
          fields.push(`status = $${idx++}`);
          params.push(data.status);
        }
        if (data.bonus_type !== undefined) {
          fields.push(`bonus_type = $${idx++}`);
          params.push(data.bonus_type);
        }
        if (data.approved_by !== undefined) {
          fields.push(`approved_by = $${idx++}`);
          params.push(data.approved_by);
        }
        if (data.approved_at !== undefined) {
          fields.push(`approved_at = $${idx++}`);
          params.push(data.approved_at);
        }
        fields.push('updated_at = NOW()');

        const sql = `UPDATE bonus_allocations SET ${fields.join(', ')} WHERE id = $1 RETURNING *;`;
        const res = await db.query(sql, params);
        return res.rows[0] || null;
      }
    } catch (err) {
      console.warn('[BonusRepo DB Fallback updateAllocation]:', err.message);
    }
    const idx = fallbackAllocations.findIndex((a) => a.id === id);
    if (idx !== -1) {
      fallbackAllocations[idx] = { ...fallbackAllocations[idx], ...data, updated_at: new Date().toISOString() };
      return fallbackAllocations[idx];
    }
    return null;
  },

  /**
   * Bulk-approve all DRAFT allocations for a payrun
   */
  async bulkApproveAllocations(payrunId, approvedBy) {
    const now = new Date().toISOString();
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query(
          `UPDATE bonus_allocations
           SET status = 'APPROVED', approved_by = $1, approved_at = $2, updated_at = $2
           WHERE payrun_id = $3 AND status = 'DRAFT'
           RETURNING *`,
          [approvedBy, now, payrunId]
        );
        return res.rows;
      }
    } catch (err) {
      console.warn('[BonusRepo DB Fallback bulkApproveAllocations]:', err.message);
    }
    const updated = [];
    fallbackAllocations.forEach((a, i) => {
      if (a.payrun_id === payrunId && a.status === 'DRAFT') {
        fallbackAllocations[i] = { ...a, status: 'APPROVED', approved_by: approvedBy, approved_at: now, updated_at: now };
        updated.push(fallbackAllocations[i]);
      }
    });
    return updated;
  },

  /**
   * Mark all APPROVED allocations as DISBURSED for a payrun
   */
  async bulkMarkDisbursed(payrunId) {
    const now = new Date().toISOString();
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query(
          `UPDATE bonus_allocations
           SET status = 'DISBURSED', updated_at = $1
           WHERE payrun_id = $2 AND status = 'APPROVED'
           RETURNING *`,
          [now, payrunId]
        );
        return res.rows;
      }
    } catch (err) {
      console.warn('[BonusRepo DB Fallback bulkMarkDisbursed]:', err.message);
    }
    fallbackAllocations.forEach((a, i) => {
      if (a.payrun_id === payrunId && a.status === 'APPROVED') {
        fallbackAllocations[i] = { ...a, status: 'DISBURSED', updated_at: now };
      }
    });
    return fallbackAllocations.filter((a) => a.payrun_id === payrunId);
  },

  /**
   * Delete an individual allocation by ID (e.g. remove employee from draft bonus cycle)
   */
  async deleteAllocation(id) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query('DELETE FROM bonus_allocations WHERE id = $1 RETURNING *', [id]);
        return res.rows[0] || null;
      }
    } catch (err) {
      console.warn('[BonusRepo DB Fallback deleteAllocation]:', err.message);
    }
    const idx = fallbackAllocations.findIndex((a) => a.id === id);
    if (idx !== -1) {
      const deleted = fallbackAllocations[idx];
      fallbackAllocations.splice(idx, 1);
      return deleted;
    }
    return null;
  },

  /**
   * Delete all allocations for a payrun (used when resetting or deleting a DRAFT bonus cycle)
   */
  async deleteAllocationsForPayrun(payrunId) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        await db.query('DELETE FROM bonus_allocations WHERE payrun_id = $1', [payrunId]);
        return true;
      }
    } catch (err) {
      console.warn('[BonusRepo DB Fallback deleteAllocationsForPayrun]:', err.message);
    }
    fallbackAllocations = fallbackAllocations.filter((a) => a.payrun_id !== payrunId);
    return true;
  },

  /**
   * Aggregate bonus totals for a payrun
   */
  async getPayrunBonusTotals(payrunId) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query(
          `SELECT
             COUNT(*) AS total_count,
             COUNT(*) FILTER (WHERE status = 'DRAFT')      AS draft_count,
             COUNT(*) FILTER (WHERE status = 'APPROVED')   AS approved_count,
             COUNT(*) FILTER (WHERE status = 'REJECTED')   AS rejected_count,
             COUNT(*) FILTER (WHERE status = 'DISBURSED')  AS disbursed_count,
             COALESCE(SUM(amount), 0)                      AS total_amount,
             COALESCE(SUM(amount) FILTER (WHERE status IN ('APPROVED', 'DISBURSED')), 0) AS approved_amount
           FROM bonus_allocations
           WHERE payrun_id = $1`,
          [payrunId]
        );
        return res.rows[0];
      }
    } catch (err) {
      console.warn('[BonusRepo DB Fallback getPayrunBonusTotals]:', err.message);
    }
    const allocs = fallbackAllocations.filter((a) => a.payrun_id === payrunId);
    return {
      total_count: allocs.length,
      draft_count: allocs.filter((a) => a.status === 'DRAFT').length,
      approved_count: allocs.filter((a) => a.status === 'APPROVED').length,
      rejected_count: allocs.filter((a) => a.status === 'REJECTED').length,
      disbursed_count: allocs.filter((a) => a.status === 'DISBURSED').length,
      total_amount: allocs.reduce((s, a) => s + parseFloat(a.amount || 0), 0),
      approved_amount: allocs.filter((a) => ['APPROVED', 'DISBURSED'].includes(a.status))
        .reduce((s, a) => s + parseFloat(a.amount || 0), 0),
    };
  },
};

module.exports = bonusRepository;
