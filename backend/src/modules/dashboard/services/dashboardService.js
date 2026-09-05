const db = require('../../../database/db');

/**
 * Dashboard Service
 * Aggregates live system-wide KPIs directly from PostgreSQL
 */
const getDashboardStats = async () => {
  try {
    // 1. Employees KPIs
    const empRes = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
        COUNT(*) FILTER (WHERE status = 'ON_LEAVE') as on_leave,
        COUNT(*) FILTER (WHERE status = 'INACTIVE') as inactive,
        COUNT(*) FILTER (WHERE status = 'TERMINATED') as terminated
      FROM employees
    `);
    const empStats = empRes.rows[0] || {};

    // 2. Department Breakdown
    const deptRes = await db.query(`
      SELECT department, COUNT(*) as count 
      FROM employees 
      WHERE department IS NOT NULL AND department != ''
      GROUP BY department 
      ORDER BY count DESC
    `);

    // 3. Contracts KPIs
    const contractRes = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
        COALESCE(SUM(wage_rate) FILTER (WHERE status = 'ACTIVE' AND wage_type = 'MONTHLY'), 0) as monthly_commitment
      FROM contracts
    `);
    const contractStats = contractRes.rows[0] || {};

    // 4. Attendance KPIs
    const attRes = await db.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE status = 'PRESENT') as total_present,
        COUNT(*) FILTER (WHERE status = 'LATE') as total_late,
        COUNT(*) FILTER (WHERE status = 'HALF_DAY') as total_half_day,
        COUNT(*) FILTER (WHERE status = 'ABSENT') as total_absent
      FROM attendance
    `);
    const attStats = attRes.rows[0] || {};

    // 5. Time Off KPIs
    const leaveRes = await db.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected
      FROM time_off_requests
    `);
    const leaveStats = leaveRes.rows[0] || {};

    // 6. Payroll KPIs
    const payrollRes = await db.query(`
      SELECT 
        COUNT(*) as total_payruns,
        COUNT(*) FILTER (WHERE status = 'PAID') as paid_payruns,
        COALESCE(SUM(total_net) FILTER (WHERE status IN ('CONFIRMED', 'PAID')), 0) as total_disbursed,
        COALESCE(SUM(total_gross) FILTER (WHERE status IN ('CONFIRMED', 'PAID')), 0) as total_gross
      FROM payruns
    `);
    const payrollStats = payrollRes.rows[0] || {};

    const payslipCountRes = await db.query(`SELECT COUNT(*) as total FROM payslips`);
    const totalPayslips = payslipCountRes.rows[0]?.total || 0;

    // 7. Recent Employees
    const recentEmpRes = await db.query(`
      SELECT id, employee_code, first_name, last_name, display_name, department, designation, status, created_at
      FROM employees
      ORDER BY created_at DESC
      LIMIT 5
    `);

    return {
      employees: {
        total: parseInt(empStats.total || 0, 10),
        active: parseInt(empStats.active || 0, 10),
        on_leave: parseInt(empStats.on_leave || 0, 10),
        inactive: parseInt(empStats.inactive || 0, 10),
        terminated: parseInt(empStats.terminated || 0, 10),
        departments: deptRes.rows,
        recent: recentEmpRes.rows,
      },
      contracts: {
        total: parseInt(contractStats.total || 0, 10),
        active: parseInt(contractStats.active || 0, 10),
        monthly_commitment: parseFloat(contractStats.monthly_commitment || 0),
      },
      attendance: {
        total_records: parseInt(attStats.total_records || 0, 10),
        present: parseInt(attStats.total_present || 0, 10),
        late: parseInt(attStats.total_late || 0, 10),
        half_day: parseInt(attStats.total_half_day || 0, 10),
        absent: parseInt(attStats.total_absent || 0, 10),
      },
      timeoff: {
        total_requests: parseInt(leaveStats.total_requests || 0, 10),
        pending: parseInt(leaveStats.pending || 0, 10),
        approved: parseInt(leaveStats.approved || 0, 10),
        rejected: parseInt(leaveStats.rejected || 0, 10),
      },
      payroll: {
        total_payruns: parseInt(payrollStats.total_payruns || 0, 10),
        paid_payruns: parseInt(payrollStats.paid_payruns || 0, 10),
        total_payslips: parseInt(totalPayslips, 10),
        total_disbursed: parseFloat(payrollStats.total_disbursed || 0),
        total_gross: parseFloat(payrollStats.total_gross || 0),
      },
    };
  } catch (err) {
    console.error('[DashboardService] Error fetching stats:', err);
    throw err;
  }
};

module.exports = {
  getDashboardStats,
};
