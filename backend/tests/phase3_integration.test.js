const http = require('http');

const request = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runPhase3Tests() {
  console.log('======================================================');
  console.log('PEOPLEPAY360 — PHASE 3 CONTRACTS & SCHEDULES TEST SUITE');
  console.log('======================================================');

  // 1. Employee Creation (P1 Authoritative Record)
  const empRes = await request('POST', '/api/employees', {
    employee_code: `EMP-T-${Date.now().toString().slice(-4)}`,
    first_name: 'Morgan',
    last_name: 'Reeves',
    email: `morgan.reeves.${Date.now()}@company.com`,
    department: 'Engineering',
    designation: 'Staff Engineer',
    status: 'ACTIVE',
    date_of_joining: '2024-10-01',
  });
  if (empRes.status !== 201) throw new Error('Failed to create test employee');
  const employee = empRes.body.data;
  console.log(`[PASS] 1. Authoritative Employee: ${employee.id} (${employee.employee_code})`);

  // 2. Working Schedule with automated 40-hour weekly calculation
  const schedRes = await request('POST', '/api/schedules', {
    name: 'Standard 40-Hour Shift Policy',
    timezone: 'America/New_York',
    days_config: [
      { day: 'Monday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
      { day: 'Tuesday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
      { day: 'Wednesday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
      { day: 'Thursday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
      { day: 'Friday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
      { day: 'Saturday', is_working: false, start_time: '09:00', end_time: '18:00', break_duration_minutes: 0 },
      { day: 'Sunday', is_working: false, start_time: '09:00', end_time: '18:00', break_duration_minutes: 0 },
    ],
  });
  const schedule = schedRes.body.data;
  if (Number(schedule.total_weekly_hours) !== 40.0) throw new Error(`Weekly hours mismatch: ${schedule.total_weekly_hours}`);
  console.log(`[PASS] 2. Schedule Auto-calculated Hours: ${schedule.total_weekly_hours}h / week (${schedule.standard_days_per_week} days)`);

  // 3. Historical Contract 2025
  const c2025Res = await request('POST', '/api/contracts', {
    employee_id: employee.id,
    contract_type: 'PERMANENT',
    wage_rate: 6200.0,
    wage_type: 'MONTHLY',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    working_schedule_id: schedule.id,
    status: 'ACTIVE',
  });
  const c2025 = c2025Res.body.data;
  console.log(`[PASS] 3. 2025 Contract Created: Rate=$${c2025.wage_rate} (Start: ${c2025.start_date}, End: ${c2025.end_date})`);

  // 4. Historical Contract 2026
  const c2026Res = await request('POST', '/api/contracts', {
    employee_id: employee.id,
    contract_type: 'PERMANENT',
    wage_rate: 7800.0,
    wage_type: 'MONTHLY',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    working_schedule_id: schedule.id,
    status: 'ACTIVE',
  });
  const c2026 = c2026Res.body.data;
  console.log(`[PASS] 4. 2026 Contract Created: Rate=$${c2026.wage_rate} (Start: ${c2026.start_date}, End: ${c2026.end_date})`);

  // 5. Overlap rejection
  const overlapRes = await request('POST', '/api/contracts', {
    employee_id: employee.id,
    contract_type: 'PERMANENT',
    wage_rate: 8500.0,
    wage_type: 'MONTHLY',
    start_date: '2025-06-01',
    end_date: '2026-06-01',
    status: 'ACTIVE',
  });
  if (overlapRes.status !== 400) throw new Error('Failed to reject overlapping contract');
  console.log(`[PASS] 5. Overlap Prevention: Conflicting contract rejected with 400 Bad Request`);

  // 6. Period-specific contract lookup (Payroll May 2025 -> 2025 contract)
  const p2025 = await request('GET', `/api/contracts/active?employee_id=${employee.id}&period_start=2025-05-01&period_end=2025-05-31`);
  if (parseFloat(p2025.body.data?.wage_rate) !== 6200.0) throw new Error('Failed 2025 period contract lookup');
  console.log(`[PASS] 6. Payroll Period 2025-05 Retrieved Contract: $${p2025.body.data?.wage_rate} (Correct 2025 contract)`);

  // 7. Period-specific contract lookup (Payroll May 2026 -> 2026 contract)
  const p2026 = await request('GET', `/api/contracts/active?employee_id=${employee.id}&period_start=2026-05-01&period_end=2026-05-31`);
  if (parseFloat(p2026.body.data?.wage_rate) !== 7800.0) throw new Error('Failed 2026 period contract lookup');
  console.log(`[PASS] 7. Payroll Period 2026-05 Retrieved Contract: $${p2026.body.data?.wage_rate} (Correct 2026 contract)`);

  // 8. Employee subroute active contract lookup
  const subroute2025 = await request('GET', `/api/employees/${employee.id}/contracts/active?date=2025-09-15`);
  if (parseFloat(subroute2025.body.data?.wage_rate) !== 6200.0) throw new Error('Failed subroute date contract lookup');
  console.log(`[PASS] 8. Employee Subroute Active Contract for 2025-09-15: $${subroute2025.body.data?.wage_rate}`);

  // 9. All historical contracts returned
  const allContracts = await request('GET', `/api/employees/${employee.id}/contracts`);
  if (allContracts.body.data?.length < 2) throw new Error('Historical contracts not preserved');
  console.log(`[PASS] 9. Historical Contracts Preserved: ${allContracts.body.data?.length} contracts on record`);

  // 10. Out-of-bounds date returns 404
  const outOfBounds = await request('GET', `/api/employees/${employee.id}/contracts/active?date=2023-01-01`);
  if (outOfBounds.status !== 404) throw new Error('Expected 404 for uncontracted date');
  console.log(`[PASS] 10. Uncontracted Date 2023-01-01 correctly returned 404 Not Found`);

  console.log('======================================================');
  console.log('ALL PHASE 3 AUTOMATED TESTS PASSED (10/10)');
  console.log('======================================================');
}

runPhase3Tests().catch((e) => {
  console.error('[FAIL]', e);
  process.exit(1);
});
