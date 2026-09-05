const db = require('../backend/src/database/db');

async function check() {
  const u = await db.query("SELECT id, email, employee_id FROM users WHERE email = 'employee@peoplepay360.demo'");
  const empId = u.rows[0].employee_id;
  console.log('Rahul employeeId:', empId);

  const emp = await db.query("SELECT * FROM employees WHERE id = $1", [empId]);
  console.log('Employee profile:', emp.rows[0]?.display_name, emp.rows[0]?.designation, emp.rows[0]?.department);

  const att = await db.query("SELECT * FROM attendance WHERE employee_id = $1 ORDER BY date DESC", [empId]);
  console.log('Attendance rows count for Rahul:', att.rows.length);
  att.rows.slice(0, 10).forEach(r => {
    console.log(` - Date: ${r.date?.toISOString ? r.date.toISOString().slice(0, 10) : r.date}, Status: ${r.status}, Hours: ${r.total_hours}, In: ${r.clock_in}, Out: ${r.clock_out}`);
  });

  const payslips = await db.query("SELECT * FROM payslips WHERE employee_id = $1", [empId]);
  console.log('Payslips count for Rahul:', payslips.rows.length);

  const alloc = await db.query("SELECT a.*, t.name FROM time_off_allocations a JOIN time_off_types t ON a.time_off_type_id = t.id WHERE a.employee_id = $1", [empId]);
  console.log('Allocations:', alloc.rows.map(r => `${r.name}: ${r.used_days}/${r.allocated_days}`));

  const contracts = await db.query("SELECT * FROM contracts WHERE employee_id = $1", [empId]);
  console.log('Contracts count for Rahul:', contracts.rows.length);
  if (contracts.rows[0]) {
    console.log('Contract terms:', contracts.rows[0].contract_type, 'Wage:', contracts.rows[0].wage_rate, contracts.rows[0].wage_type);
  }

  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
