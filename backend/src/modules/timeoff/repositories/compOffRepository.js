const db = require('../../../database/db');
const crypto = require('crypto');

/**
 * Comp Off Repository
 * Owner: P2 (HR Operations) — ExFeat
 * Handles SQL for comp_off_credits table.
 * Falls back to in-memory store when DB is unavailable.
 */

let fallbackCredits = [];

const compOffRepository = {
  /**
   * List comp_off_credits with optional filters
   */
  async findCredits({ employee_id, status, page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = `
          SELECT c.*,
            e.employee_code, e.display_name AS employee_name,
            e.department, e.designation,
            u.name AS approved_by_name
          FROM comp_off_credits c
          JOIN employees e ON c.employee_id = e.id
          LEFT JOIN users u ON c.approved_by = u.id
          WHERE 1=1
        `;
        const params = [];
        let idx = 1;
        if (employee_id) { sql += ` AND c.employee_id = $${idx++}`; params.push(employee_id); }
        if (status) { sql += ` AND c.status = $${idx++}`; params.push(status); }
        sql += ` ORDER BY c.work_date DESC LIMIT $${idx} OFFSET $${idx + 1}`;
        params.push(limit, offset);
        const res = await db.query(sql, params);
        return res.rows;
      }
    } catch (err) {
      console.warn('[CompOffRepo DB Fallback findCredits]:', err.message);
    }
    let res = [...fallbackCredits];
    if (employee_id) res = res.filter(c => c.employee_id === employee_id);
    if (status) res = res.filter(c => c.status === status);
    return res.slice(offset, offset + limit);
  },

  /**
   * Get a single credit by id
   */
  async findCreditById(id) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query(
          `SELECT c.*, e.employee_code, e.display_name AS employee_name, e.department
           FROM comp_off_credits c
           JOIN employees e ON c.employee_id = e.id
           WHERE c.id = $1`,
          [id]
        );
        return res.rows[0] || null;
      }
    } catch (err) {
      console.warn('[CompOffRepo DB Fallback findCreditById]:', err.message);
    }
    return fallbackCredits.find(c => c.id === id) || null;
  },

  /**
   * Create a new comp_off_credit (raised by employee or HR)
   */
  async createCredit(data) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    // Default expiry: 90 days from work_date
    const workDate = new Date(data.work_date);
    const expiresAt = new Date(workDate);
    expiresAt.setDate(expiresAt.getDate() + 90);
    const expiresAtStr = expiresAt.toISOString().split('T')[0];

    const newCredit = {
      id,
      employee_id: data.employee_id,
      work_date: data.work_date,
      hours_worked: parseFloat(data.hours_worked || 8),
      reason: data.reason || null,
      days_credited: parseFloat(data.days_credited || 1),
      status: 'PENDING',
      approved_by: null,
      approved_at: null,
      expires_at: expiresAtStr,
      created_at: now,
      updated_at: now,
    };

    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query(
          `INSERT INTO comp_off_credits
             (id, employee_id, work_date, hours_worked, reason, days_credited, status, expires_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8, $8)
           RETURNING *`,
          [id, newCredit.employee_id, newCredit.work_date, newCredit.hours_worked,
           newCredit.reason, newCredit.days_credited, expiresAtStr, now]
        );
        return res.rows[0];
      }
    } catch (err) {
      console.warn('[CompOffRepo DB Fallback createCredit]:', err.message);
    }
    fallbackCredits.unshift(newCredit);
    return newCredit;
  },

  /**
   * Update credit status (approve / reject / mark used / expire)
   */
  async updateCredit(id, data) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const fields = [];
        const params = [id];
        let idx = 2;
        if (data.status !== undefined)       { fields.push(`status = $${idx++}`);      params.push(data.status); }
        if (data.approved_by !== undefined)  { fields.push(`approved_by = $${idx++}`); params.push(data.approved_by); }
        if (data.approved_at !== undefined)  { fields.push(`approved_at = $${idx++}`); params.push(data.approved_at); }
        if (data.days_credited !== undefined){ fields.push(`days_credited = $${idx++}`); params.push(parseFloat(data.days_credited)); }
        if (data.expires_at !== undefined)   { fields.push(`expires_at = $${idx++}`);  params.push(data.expires_at); }
        fields.push('updated_at = NOW()');
        const sql = `UPDATE comp_off_credits SET ${fields.join(', ')} WHERE id = $1 RETURNING *;`;
        const res = await db.query(sql, params);
        return res.rows[0] || null;
      }
    } catch (err) {
      console.warn('[CompOffRepo DB Fallback updateCredit]:', err.message);
    }
    const idx = fallbackCredits.findIndex(c => c.id === id);
    if (idx !== -1) {
      fallbackCredits[idx] = { ...fallbackCredits[idx], ...data, updated_at: new Date().toISOString() };
      return fallbackCredits[idx];
    }
    return null;
  },

  /**
   * Get available (APPROVED, not expired) comp-off balance for an employee
   */
  async getAvailableBalance(employeeId) {
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query(
          `SELECT COALESCE(SUM(days_credited), 0) AS available_days,
                  COUNT(*) AS credit_count
           FROM comp_off_credits
           WHERE employee_id = $1
             AND status = 'APPROVED'
             AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)`,
          [employeeId]
        );
        return {
          available_days: parseFloat(res.rows[0]?.available_days || 0),
          credit_count: parseInt(res.rows[0]?.credit_count || 0, 10),
        };
      }
    } catch (err) {
      console.warn('[CompOffRepo DB Fallback getAvailableBalance]:', err.message);
    }
    const now = new Date().toISOString().split('T')[0];
    const credits = fallbackCredits.filter(c =>
      c.employee_id === employeeId &&
      c.status === 'APPROVED' &&
      (!c.expires_at || c.expires_at >= now)
    );
    return {
      available_days: credits.reduce((s, c) => s + parseFloat(c.days_credited || 0), 0),
      credit_count: credits.length,
    };
  },

  /**
   * Consume approved comp-off credits for an employee when leave is approved
   */
  async consumeCredits(employeeId, daysNeeded) {
    let remaining = parseFloat(daysNeeded || 0);
    if (remaining <= 0) return;

    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const res = await db.query(
          `SELECT * FROM comp_off_credits
           WHERE employee_id = $1 AND status = 'APPROVED'
             AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
           ORDER BY work_date ASC`,
          [employeeId]
        );
        for (const credit of res.rows) {
          if (remaining <= 0) break;
          const creditDays = parseFloat(credit.days_credited);
          if (creditDays <= remaining) {
            await db.query(
              `UPDATE comp_off_credits SET status = 'USED', updated_at = NOW() WHERE id = $1`,
              [credit.id]
            );
            remaining -= creditDays;
          } else {
            const leftover = creditDays - remaining;
            await db.query(
              `UPDATE comp_off_credits SET days_credited = $1, updated_at = NOW() WHERE id = $2`,
              [leftover, credit.id]
            );
            await db.query(
              `INSERT INTO comp_off_credits (employee_id, work_date, hours_worked, reason, days_credited, status, expires_at, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, 'USED', $6, NOW(), NOW())`,
              [credit.employee_id, credit.work_date, credit.hours_worked, `Redeemed portion of ${credit.reason || ''}`, remaining, credit.expires_at]
            );
            remaining = 0;
          }
        }
        return;
      }
    } catch (err) {
      console.warn('[CompOffRepo DB Fallback consumeCredits]:', err.message);
    }

    for (const credit of fallbackCredits) {
      if (remaining <= 0) break;
      if (credit.employee_id === employeeId && credit.status === 'APPROVED') {
        const creditDays = parseFloat(credit.days_credited);
        if (creditDays <= remaining) {
          credit.status = 'USED';
          credit.updated_at = new Date().toISOString();
          remaining -= creditDays;
        } else {
          credit.days_credited = creditDays - remaining;
          credit.updated_at = new Date().toISOString();
          fallbackCredits.push({
            ...credit,
            id: crypto.randomUUID(),
            days_credited: remaining,
            status: 'USED',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          remaining = 0;
        }
      }
    }
  },
};

module.exports = compOffRepository;
