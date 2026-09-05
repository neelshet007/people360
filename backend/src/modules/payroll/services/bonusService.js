const payrollRepository = require('../repositories/payrollRepository');
const bonusRepository = require('../repositories/bonusRepository');
const employeeRepository = require('../../employees/repositories/employeeRepository');
const contractRepository = require('../../contracts/repositories/contractRepository');
const ApiError = require('../../../utils/ApiError');
const crypto = require('crypto');

/**
 * Bonus Allocation Service
 * Owner: P3 (Payroll) — ExFeat
 *
 * Orchestrates the Bonus Allocation lifecycle:
 *   Setup → Allocation → Approval → Compute (BONUS payrun) → Disbursement
 */
class BonusService {
  /**
   * Create a new Bonus Cycle
   *
   * Creates a payrun with payrun_type='BONUS' and pre-populates
   * bonus_allocations for all eligible employees (active + has contract).
   *
   * @param {object} data
   *   - name: string (e.g. "Diwali Bonus 2026")
   *   - bonus_type: 'PERFORMANCE'|'FESTIVAL'|'ANNUAL'|'RETENTION'|'SPOT'|'CUSTOM'
   *   - pay_period_start: ISO date string
   *   - pay_period_end:   ISO date string
   *   - default_amount:   number (0 = let HR fill in per-employee)
   *   - created_by:       user id (optional)
   *   - employee_ids:     array of employee UUIDs (optional — if empty, all eligible)
   */
  async createBonusCycle(data) {
    const { name, bonus_type, pay_period_start, pay_period_end, default_amount = 0, created_by, employee_ids = [] } = data;

    if (!name || !pay_period_start || !pay_period_end) {
      throw ApiError.badRequest('Bonus cycle name, period start, and period end are required');
    }

    const validBonusTypes = ['PERFORMANCE', 'FESTIVAL', 'ANNUAL', 'RETENTION', 'SPOT', 'CUSTOM'];
    const resolvedBonusType = (bonus_type || 'PERFORMANCE').toUpperCase();
    if (!validBonusTypes.includes(resolvedBonusType)) {
      throw ApiError.badRequest(`Invalid bonus_type. Must be one of: ${validBonusTypes.join(', ')}`);
    }

    if (new Date(pay_period_start) > new Date(pay_period_end)) {
      throw ApiError.badRequest('Period start must be before or equal to period end');
    }

    // Resolve employees to include in this cycle
    let employees = [];
    if (Array.isArray(employee_ids) && employee_ids.length > 0) {
      // Specific employees selected
      const all = await employeeRepository.findAll({ limit: 500 });
      employees = all.filter((e) => employee_ids.includes(e.id) && e.status === 'ACTIVE');
    } else {
      // All active employees
      const all = await employeeRepository.findAll({ limit: 500 });
      employees = all.filter((e) => e.status === 'ACTIVE');
    }

    if (employees.length === 0) {
      throw ApiError.badRequest('No active employees found to include in bonus cycle');
    }

    // Create the BONUS payrun record
    const payrunId = crypto.randomUUID ? crypto.randomUUID() : `bonus-${Date.now()}`;
    const now = new Date().toISOString();

    let payrun;
    try {
      const isLive = await (require('../../../database/db')).testConnection();
      if (isLive) {
        const db = require('../../../database/db');
        const res = await db.query(
          `INSERT INTO payruns (
            id, name, pay_period_start, pay_period_end, payrun_type,
            employee_count, selected_employee_ids, created_by, status,
            total_gross, total_deductions, total_net,
            validation_notes, warnings, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,'BONUS',$5,$6,$7,'DRAFT',0,0,0,'[]','[]',$8,$8)
          RETURNING *`,
          [
            payrunId,
            name,
            pay_period_start,
            pay_period_end,
            employees.length,
            JSON.stringify(employees.map((e) => e.id)),
            created_by || null,
            now,
          ]
        );
        payrun = res.rows[0];
      } else {
        // Fallback: use payrollRepository
        payrun = await payrollRepository.createPayrun({
          id: payrunId,
          name,
          pay_period_start,
          pay_period_end,
          payrun_type: 'BONUS',
          employee_count: employees.length,
          selected_employee_ids: employees.map((e) => e.id),
          created_by,
        });
      }
    } catch (err) {
      payrun = await payrollRepository.createPayrun({
        name,
        pay_period_start,
        pay_period_end,
        payrun_type: 'BONUS',
        employee_count: employees.length,
        selected_employee_ids: employees.map((e) => e.id),
        created_by,
      });
    }

    // Pre-populate allocations in DRAFT status
    const allocations = await bonusRepository.bulkCreateAllocations(
      payrun.id,
      employees,
      resolvedBonusType,
      parseFloat(default_amount || 0)
    );

    return {
      payrun,
      allocations,
      summary: {
        total_employees: employees.length,
        bonus_type: resolvedBonusType,
        default_amount: parseFloat(default_amount || 0),
      },
    };
  }

  /**
   * Get all allocations for a bonus payrun, with totals
   */
  async getBonusCycleDetail(payrunId) {
    const payrun = await payrollRepository.findPayrunById(payrunId);
    if (!payrun) {
      throw ApiError.notFound(`Bonus cycle (payrun) with ID '${payrunId}' not found`);
    }

    const allocations = await bonusRepository.findAllocations({ payrun_id: payrunId });
    const totals = await bonusRepository.getPayrunBonusTotals(payrunId);

    return { payrun, allocations, totals };
  }

  /**
   * Update a single employee allocation (amount, remarks, bonus_type)
   */
  async updateAllocation(id, data) {
    const existing = await bonusRepository.findAllocationById(id);
    if (!existing) {
      throw ApiError.notFound(`Bonus allocation with ID '${id}' not found`);
    }

    // Can only edit DRAFT allocations
    if (existing.status !== 'DRAFT') {
      throw ApiError.badRequest(`Cannot edit allocation in '${existing.status}' status. Only DRAFT allocations can be modified.`);
    }

    if (data.amount !== undefined) {
      const amt = parseFloat(data.amount);
      if (isNaN(amt) || amt < 0) {
        throw ApiError.badRequest('Bonus amount must be a non-negative number');
      }
      data.amount = amt;
    }

    const updated = await bonusRepository.updateAllocation(id, {
      amount: data.amount,
      remarks: data.remarks,
      bonus_type: data.bonus_type,
    });

    return updated;
  }

  /**
   * Reject a single allocation
   */
  async rejectAllocation(id, userId) {
    const existing = await bonusRepository.findAllocationById(id);
    if (!existing) {
      throw ApiError.notFound(`Bonus allocation with ID '${id}' not found`);
    }
    if (!['DRAFT', 'APPROVED'].includes(existing.status)) {
      throw ApiError.badRequest(`Cannot reject allocation in '${existing.status}' status`);
    }
    return bonusRepository.updateAllocation(id, {
      status: 'REJECTED',
      approved_by: userId || null,
      approved_at: new Date().toISOString(),
    });
  }

  /**
   * Approve all DRAFT allocations for a bonus payrun
   * Transitions payrun: DRAFT → COMPUTED (using bonus compute engine)
   */
  async approveBonusCycle(payrunId, userId) {
    const payrun = await payrollRepository.findPayrunById(payrunId);
    if (!payrun) {
      throw ApiError.notFound(`Bonus cycle with ID '${payrunId}' not found`);
    }

    if (payrun.status !== 'DRAFT') {
      throw ApiError.badRequest(`Cannot approve bonus cycle in '${payrun.status}' status. Must be DRAFT.`);
    }

    // Verify there are allocations with amount > 0
    const allocations = await bonusRepository.findAllocations({ payrun_id: payrunId, status: 'DRAFT' });
    if (!allocations || allocations.length === 0) {
      throw ApiError.badRequest('No DRAFT allocations found to approve for this bonus cycle');
    }

    const positiveAllocs = allocations.filter((a) => parseFloat(a.amount || 0) > 0);
    if (positiveAllocs.length === 0) {
      throw ApiError.badRequest('All allocations have ₹0 amount. Please set bonus amounts before approving.');
    }

    // Approve all DRAFT allocations
    await bonusRepository.bulkApproveAllocations(payrunId, userId);

    // Now compute bonus payrun — creates one payslip per approved allocation
    return this.computeBonusPayrun(payrunId);
  }

  /**
   * Internal: Compute bonus payrun
   * Creates payslips with a single BONUS component line per employee.
   * Transitions state: DRAFT → COMPUTED
   */
  async computeBonusPayrun(payrunId) {
    const db = require('../../../database/db');
    const allocations = await bonusRepository.findAllocations({ payrun_id: payrunId, status: 'APPROVED' });

    if (!allocations || allocations.length === 0) {
      throw ApiError.badRequest('No approved allocations found to compute');
    }

    let totalGross = 0;

    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const client = await db.getClient();
        try {
          await client.query('BEGIN');

          // Clear previous payslips for this payrun
          await client.query('DELETE FROM payslips WHERE payrun_id = $1', [payrunId]);

          for (const alloc of allocations) {
            const psId = crypto.randomUUID();
            const amt = parseFloat(alloc.amount || 0);
            totalGross += amt;

            // Insert payslip
            await client.query(
              `INSERT INTO payslips (
                id, payrun_id, employee_id, worked_days, absent_days,
                gross_amount, total_deductions, net_amount,
                basic_amount, allowances_amount, status
              ) VALUES ($1,$2,$3,0,0,$4,0,$4,0,$4,'COMPUTED')`,
              [psId, payrunId, alloc.employee_id, amt]
            );

            // Insert single BONUS payslip line
            await client.query(
              `INSERT INTO payslip_lines (
                id, payslip_id, salary_rule_id, rule_name, rule_code, category, rate, amount
              ) VALUES ($1,$2,NULL,$3,'BONUS','BONUS',$4,$4)`,
              [crypto.randomUUID(), psId, `${alloc.bonus_type} Bonus`, amt]
            );
          }

          // Update payrun totals and status
          await client.query(
            `UPDATE payruns SET
              status = 'COMPUTED',
              total_gross = $1,
              total_deductions = 0,
              total_net = $1,
              employee_count = $2,
              updated_at = NOW()
            WHERE id = $3`,
            [totalGross, allocations.length, payrunId]
          );

          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } else {
        // Fallback: update payrun in memory
        await payrollRepository.updatePayrun(payrunId, {
          status: 'COMPUTED',
          total_gross: totalGross,
          total_deductions: 0,
          total_net: totalGross,
          employee_count: allocations.length,
        });
      }
    } catch (err) {
      throw ApiError.internal(`Failed to compute bonus payrun: ${err.message}`);
    }

    return payrollRepository.findPayrunById(payrunId);
  }

  /**
   * Mark bonus payrun as PAID and mark allocations as DISBURSED
   * (Reuses payrunService.validatePayrun + payrunService.markPayrunPaid for consistency)
   */
  async disburseBonusCycle(payrunId, userId) {
    const payrun = await payrollRepository.findPayrunById(payrunId);
    if (!payrun) {
      throw ApiError.notFound(`Bonus cycle with ID '${payrunId}' not found`);
    }

    if (!['COMPUTED', 'VALIDATED'].includes(payrun.status)) {
      throw ApiError.badRequest(
        `Cannot disburse bonus cycle in '${payrun.status}' status. Must be COMPUTED or VALIDATED.`
      );
    }

    // Transition: COMPUTED → VALIDATED → PAID
    if (payrun.status === 'COMPUTED') {
      await payrollRepository.updatePayrun(payrunId, { status: 'VALIDATED' });
      await payrollRepository.updatePayslipsStatusForPayrun(payrunId, 'VALIDATED');
    }

    await payrollRepository.updatePayrun(payrunId, {
      status: 'PAID',
      execution_date: new Date().toISOString(),
    });
    await payrollRepository.updatePayslipsStatusForPayrun(payrunId, 'PAID');

    // Mark all APPROVED allocations as DISBURSED
    await bonusRepository.bulkMarkDisbursed(payrunId);

    return payrollRepository.findPayrunById(payrunId);
  }

  /**
   * List all bonus payruns (type = BONUS)
   */
  async listBonusCycles({ status, page = 1, limit = 20 } = {}) {
    try {
      const db = require('../../../database/db');
      const isLive = await db.testConnection();
      if (isLive) {
        let sql = `
          SELECT p.*,
            ss.name AS salary_structure_name,
            (SELECT COUNT(*) FROM bonus_allocations ba WHERE ba.payrun_id = p.id) AS allocation_count,
            (SELECT COALESCE(SUM(ba.amount),0) FROM bonus_allocations ba WHERE ba.payrun_id = p.id) AS total_bonus_amount
          FROM payruns p
          LEFT JOIN salary_structures ss ON p.salary_structure_id = ss.id
          WHERE p.payrun_type = 'BONUS'
        `;
        const params = [];
        let idx = 1;
        if (status) {
          sql += ` AND p.status = $${idx++}`;
          params.push(status);
        }
        const offset = (page - 1) * limit;
        sql += ` ORDER BY p.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
        params.push(limit, offset);
        const res = await db.query(sql, params);
        return res.rows;
      }
    } catch (err) {
      console.warn('[BonusService listBonusCycles fallback]:', err.message);
    }
    // Fallback: return empty (payruns fallback doesn't track payrun_type)
    return [];
  }
}

module.exports = new BonusService();
