const db = require('../backend/src/database/db');
const { getDashboardStats } = require('../backend/src/modules/dashboard/services/dashboardService');

async function test() {
  const u = await db.query("SELECT employee_id FROM users WHERE email = 'employee@peoplepay360.demo'");
  const res = await getDashboardStats({ role: 'EMPLOYEE', employeeId: u.rows[0].employee_id });
  console.log('Keys returned for Employee:', Object.keys(res));
  console.log('Employee info:', res.employee?.display_name, res.employee?.designation);
  console.log('Contract:', res.contract?.contract_type, res.contract?.wage_rate, res.contract?.schedule_name);
  console.log('Attendance summary:', res.attendance?.summary);
  console.log('Recent attendance rows:', res.attendance?.recent?.length);
  console.log('Leave allocations:', res.timeoff?.allocations?.length);
  console.log('Latest payslip:', res.payroll?.latest_payslip?.gross_amount, res.payroll?.latest_payslip?.net_amount);
  process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
