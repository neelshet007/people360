const db = require('../../../database/db');

/**
 * Dashboard Service
 * Aggregates live system-wide or role-tailored KPIs directly from PostgreSQL
 */
const getDashboardStats = async (user = {}) => {
  const role = user.role || 'ADMIN';
  const employeeId = user.employeeId || null;

  try {
    // -------------------------------------------------------------------------
    // 1. ROLE: EMPLOYEE (Personal Self-Service Dashboard)
    // -------------------------------------------------------------------------
    if (role === 'EMPLOYEE' && employeeId) {
      const [
        empRes,
        contractRes,
        todayAttRes,
        attHistoryRes,
        attCountRes,
        leaveAllocRes,
        leaveReqRes,
        payslipRes
      ] = await Promise.all([
        // (a) Personal Details
        db.query(`
          SELECT id, employee_code, first_name, last_name, display_name, email, department, designation, status, date_of_joining
          FROM employees WHERE id = $1
        `, [employeeId]),

        // Active Contract
        db.query(`
          SELECT c.*, s.name as schedule_name, st.name as structure_name
          FROM contracts c
          LEFT JOIN working_schedules s ON c.working_schedule_id = s.id
          LEFT JOIN salary_structures st ON c.salary_structure_id = st.id
          WHERE c.employee_id = $1 AND c.status = 'ACTIVE'
          ORDER BY c.start_date DESC LIMIT 1
        `, [employeeId]),

        // (b) Personal Attendance Today
        db.query(`
          SELECT * FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE LIMIT 1
        `, [employeeId]),

        // Recent Attendance
        db.query(`
          SELECT id, date, clock_in, clock_out, total_hours, status, notes
          FROM attendance WHERE employee_id = $1
          ORDER BY date DESC LIMIT 5
        `, [employeeId]),

        // Attendance Counts
        db.query(`
          SELECT 
            COUNT(*) FILTER (WHERE status = 'PRESENT') as present_days,
            COUNT(*) FILTER (WHERE status = 'LATE') as late_days,
            COUNT(*) FILTER (WHERE status = 'HALF_DAY') as half_days,
            COALESCE(SUM(total_hours), 0) as total_hours_worked
          FROM attendance WHERE employee_id = $1
        `, [employeeId]),

        // (c) Personal Leave Balances & Requests
        db.query(`
          SELECT a.id, a.year, a.allocated_days, a.used_days, (a.allocated_days - a.used_days) as remaining_days,
                 t.name as type_name, t.code as type_code, t.is_paid
          FROM time_off_allocations a
          JOIN time_off_types t ON a.time_off_type_id = t.id
          WHERE a.employee_id = $1 AND a.year = 2026
          ORDER BY t.name ASC
        `, [employeeId]),

        db.query(`
          SELECT r.id, r.start_date, r.end_date, r.total_days, r.reason, r.status, r.created_at,
                 t.name as type_name, t.code as type_code
          FROM time_off_requests r
          JOIN time_off_types t ON r.time_off_type_id = t.id
          WHERE r.employee_id = $1
          ORDER BY r.created_at DESC LIMIT 5
        `, [employeeId]),

        // (d) Personal Payslips
        db.query(`
          SELECT p.id, p.gross_amount, p.total_deductions, p.net_amount, p.status, p.worked_days,
                 pr.name as payrun_name, pr.pay_period_start, pr.pay_period_end
          FROM payslips p
          JOIN payruns pr ON p.payrun_id = pr.id
          WHERE p.employee_id = $1
          ORDER BY pr.pay_period_end DESC LIMIT 3
        `, [employeeId]),
      ]);

      const empInfo = empRes.rows[0] || {};
      const activeContract = contractRes.rows[0] || null;
      const todayAttendance = todayAttRes.rows[0] || null;
      const attSummary = attCountRes.rows[0] || {};

      return {
        role: 'EMPLOYEE',
        employee: empInfo,
        contract: activeContract,
        attendance: {
          today: todayAttendance,
          recent: attHistoryRes.rows,
          summary: {
            present: parseInt(attSummary.present_days || 0, 10),
            late: parseInt(attSummary.late_days || 0, 10),
            half_day: parseInt(attSummary.half_days || 0, 10),
            total_hours: parseFloat(attSummary.total_hours_worked || 0),
          },
        },
        timeoff: {
          allocations: leaveAllocRes.rows,
          recent_requests: leaveReqRes.rows,
        },
        payroll: {
          recent_payslips: payslipRes.rows,
          latest_payslip: payslipRes.rows[0] || null,
        },
      };
    }

    // -------------------------------------------------------------------------
    // 2. MANAGEMENT ROLES (HR_MANAGER, HR_PAYROLL_USER, HR_PAYROLL_MANAGER, ADMIN)
    // -------------------------------------------------------------------------
    // Execute all independent summary queries in parallel for minimal latency
    const [
      empRes,
      deptRes,
      contractRes,
      attRes,
      leaveRes,
      payrollRes,
      payslipCountRes,
      payrunTrendRes,
      deptPayrollRes,
      leaveDistRes,
      userCountRes,
      recentEmpRes,
    ] = await Promise.all([
      // (a) Employees KPIs
      db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
          COUNT(*) FILTER (WHERE status = 'ON_LEAVE') as on_leave,
          COUNT(*) FILTER (WHERE status = 'INACTIVE') as inactive,
          COUNT(*) FILTER (WHERE status = 'TERMINATED') as terminated
        FROM employees
      `),

      // Department Breakdown
      db.query(`
        SELECT department, COUNT(*) as count 
        FROM employees 
        WHERE department IS NOT NULL AND department != ''
        GROUP BY department 
        ORDER BY count DESC
      `),

      // (b) Contracts KPIs
      db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
          COALESCE(SUM(wage_rate) FILTER (WHERE status = 'ACTIVE' AND wage_type = 'MONTHLY'), 0) as monthly_commitment
        FROM contracts
      `),

      // (c) Attendance KPIs
      db.query(`
        SELECT 
          COUNT(*) as total_records,
          COUNT(*) FILTER (WHERE status = 'PRESENT') as total_present,
          COUNT(*) FILTER (WHERE status = 'LATE') as total_late,
          COUNT(*) FILTER (WHERE status = 'HALF_DAY') as total_half_day,
          COUNT(*) FILTER (WHERE status = 'ABSENT') as total_absent
        FROM attendance
      `),

      // (d) Time Off KPIs
      db.query(`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
          COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
          COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected
        FROM time_off_requests
      `),

      // (e) Payroll KPIs
      db.query(`
        SELECT 
          COUNT(*) as total_payruns,
          COUNT(*) FILTER (WHERE status = 'PAID') as paid_payruns,
          COALESCE(SUM(total_net) FILTER (WHERE status IN ('CONFIRMED', 'PAID')), 0) as total_disbursed,
          COALESCE(SUM(total_gross) FILTER (WHERE status IN ('CONFIRMED', 'PAID')), 0) as total_gross
        FROM payruns
      `),

      // Total Payslips
      db.query(`SELECT COUNT(*) as total FROM payslips`),

      // Monthly Payruns Trend for live charts
      db.query(`
        SELECT id, name, total_gross, total_deductions, total_net, status, pay_period_end
        FROM payruns
        ORDER BY pay_period_end ASC
        LIMIT 6
      `),

      // Department-wise Monthly Net Payroll Cost
      db.query(`
        SELECT e.department, 
               COUNT(p.id) as payslip_count,
               COALESCE(SUM(p.gross_amount), 0) as total_gross,
               COALESCE(SUM(p.total_deductions), 0) as total_deductions,
               COALESCE(SUM(p.net_amount), 0) as total_net
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        GROUP BY e.department
        ORDER BY total_net DESC
      `),

      // Leave Types Distribution
      db.query(`
        SELECT t.name as type_name, t.code as type_code, COUNT(r.id) as request_count,
               COALESCE(SUM(r.total_days), 0) as total_days
        FROM time_off_types t
        LEFT JOIN time_off_requests r ON t.id = r.time_off_type_id
        GROUP BY t.id, t.name, t.code
        ORDER BY total_days DESC
      `),

      // (f) System Users (for ADMIN role)
      db.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_users
        FROM users;
      `),

      // (g) Recent Employees
      db.query(`
        SELECT id, employee_code, first_name, last_name, display_name, department, designation, status, created_at
        FROM employees
        ORDER BY created_at DESC
        LIMIT 5
      `),
    ]);

    const empStats = empRes.rows[0] || {};
    const contractStats = contractRes.rows[0] || {};
    const attStats = attRes.rows[0] || {};
    const leaveStats = leaveRes.rows[0] || {};
    const payrollStats = payrollRes.rows[0] || {};
    const totalPayslips = payslipCountRes.rows[0]?.total || 0;
    const userStats = userCountRes.rows[0] || {};

    return {
      role,
      users: {
        total: parseInt(userStats.total_users || 0, 10),
        active: parseInt(userStats.active_users || 0, 10),
      },
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
        by_type: leaveDistRes.rows,
      },
      payroll: {
        total_payruns: parseInt(payrollStats.total_payruns || 0, 10),
        paid_payruns: parseInt(payrollStats.paid_payruns || 0, 10),
        total_payslips: parseInt(totalPayslips, 10),
        total_disbursed: parseFloat(payrollStats.total_disbursed || 0),
        total_gross: parseFloat(payrollStats.total_gross || 0),
        trends: payrunTrendRes.rows,
        by_department: deptPayrollRes.rows,
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
