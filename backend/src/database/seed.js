const db = require('./db');
const { hashPassword } = require('../utils/passwordHelper');

/**
 * PeoplePay360 Authoritative Database Seed Script
 * Phase 6A: Real Dynamic Indian Locale Demo Data
 * Fully populated with realistic Indian workforce, INR salaries, schedules,
 * attendance, leave management, and itemized payroll runs.
 */

async function runSeed() {
  console.log('====================================================');
  console.log('  PeoplePay360 — Authoritative Database Seed (INR)  ');
  console.log('====================================================');

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    console.log('[Seed] Cleaning existing tables in foreign key order...');
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM payslip_lines');
    await client.query('DELETE FROM payslips');
    await client.query('DELETE FROM payruns');
    await client.query('DELETE FROM time_off_requests');
    await client.query('DELETE FROM time_off_allocations');
    await client.query('DELETE FROM time_off_types');
    await client.query('DELETE FROM attendance');
    await client.query('DELETE FROM contracts');
    await client.query('DELETE FROM working_schedules');
    await client.query('DELETE FROM salary_rules');
    await client.query('DELETE FROM salary_structures');
    await client.query('DELETE FROM employees');

    console.log('[Seed] 1. Creating Working Schedules (Indian Standard Time)...');
    const scheduleRes = await client.query(`
      INSERT INTO working_schedules (name, standard_hours_per_day, standard_days_per_week, total_weekly_hours, break_duration_minutes, timezone, is_active, days_config)
      VALUES 
      ('General Day Shift (IST)', 8.00, 5, 40.00, 60, 'Asia/Kolkata', true, '[
        {"day": "Monday", "is_working": true, "start_time": "09:00", "end_time": "18:00", "break_duration_minutes": 60},
        {"day": "Tuesday", "is_working": true, "start_time": "09:00", "end_time": "18:00", "break_duration_minutes": 60},
        {"day": "Wednesday", "is_working": true, "start_time": "09:00", "end_time": "18:00", "break_duration_minutes": 60},
        {"day": "Thursday", "is_working": true, "start_time": "09:00", "end_time": "18:00", "break_duration_minutes": 60},
        {"day": "Friday", "is_working": true, "start_time": "09:00", "end_time": "18:00", "break_duration_minutes": 60},
        {"day": "Saturday", "is_working": false},
        {"day": "Sunday", "is_working": false}
      ]'::jsonb),
      ('Flexible Tech Shift (IST)', 8.00, 5, 40.00, 60, 'Asia/Kolkata', true, '[
        {"day": "Monday", "is_working": true, "start_time": "10:00", "end_time": "19:00", "break_duration_minutes": 60},
        {"day": "Tuesday", "is_working": true, "start_time": "10:00", "end_time": "19:00", "break_duration_minutes": 60},
        {"day": "Wednesday", "is_working": true, "start_time": "10:00", "end_time": "19:00", "break_duration_minutes": 60},
        {"day": "Thursday", "is_working": true, "start_time": "10:00", "end_time": "19:00", "break_duration_minutes": 60},
        {"day": "Friday", "is_working": true, "start_time": "10:00", "end_time": "19:00", "break_duration_minutes": 60},
        {"day": "Saturday", "is_working": false},
        {"day": "Sunday", "is_working": false}
      ]'::jsonb),
      ('Operations Support Shift (IST)', 8.50, 5, 42.50, 45, 'Asia/Kolkata', true, '[
        {"day": "Monday", "is_working": true, "start_time": "13:00", "end_time": "22:00", "break_duration_minutes": 45},
        {"day": "Tuesday", "is_working": true, "start_time": "13:00", "end_time": "22:00", "break_duration_minutes": 45},
        {"day": "Wednesday", "is_working": true, "start_time": "13:00", "end_time": "22:00", "break_duration_minutes": 45},
        {"day": "Thursday", "is_working": true, "start_time": "13:00", "end_time": "22:00", "break_duration_minutes": 45},
        {"day": "Friday", "is_working": true, "start_time": "13:00", "end_time": "22:00", "break_duration_minutes": 45},
        {"day": "Saturday", "is_working": false},
        {"day": "Sunday", "is_working": false}
      ]'::jsonb)
      RETURNING id, name;
    `);
    const generalScheduleId = scheduleRes.rows[0].id;
    const techScheduleId = scheduleRes.rows[1].id;
    const opsScheduleId = scheduleRes.rows[2].id;
    console.log(`[Seed] ✓ Created ${scheduleRes.rows.length} working schedules.`);

    console.log('[Seed] 2. Creating Indian Salary Structure & Atomic Rules...');
    const structRes = await client.query(`
      INSERT INTO salary_structures (name, code, description, is_active)
      VALUES 
      ('Indian Standard Corporate Structure', 'IN-CORP-STD', 'Standard CTC breakdown with Basic, HRA, Allowances, PF, and Professional Tax', true)
      RETURNING id;
    `);
    const structureId = structRes.rows[0].id;

    await client.query(`
      INSERT INTO salary_rules (salary_structure_id, name, code, category, calculation_type, amount_or_rate, sequence_order)
      VALUES
      ($1, 'Basic Salary', 'BASIC', 'ALLOWANCE', 'PERCENTAGE', 0.50, 1),
      ($1, 'House Rent Allowance (HRA)', 'HRA', 'ALLOWANCE', 'PERCENTAGE', 0.20, 2),
      ($1, 'Special Allowance', 'SPL_ALLOW', 'ALLOWANCE', 'PERCENTAGE', 0.25, 3),
      ($1, 'Transport Allowance', 'TRANSPORT', 'ALLOWANCE', 'FIXED', 3000.00, 4),
      ($1, 'Provident Fund (PF - Employee)', 'PF_EMP', 'DEDUCTION', 'PERCENTAGE', 0.12, 5),
      ($1, 'Professional Tax (PT)', 'PT', 'DEDUCTION', 'FIXED', 200.00, 6);
    `, [structureId]);
    console.log('[Seed] ✓ Created Indian Salary Structure with 6 component calculation rules.');

    console.log('[Seed] 3. Creating Time Off Types (Earned, Casual, Sick, Maternity)...');
    const totRes = await client.query(`
      INSERT INTO time_off_types (name, code, is_paid, requires_approval, max_days_allowed)
      VALUES 
      ('Earned Leave (Privilege Leave)', 'EL', true, true, 18),
      ('Casual Leave', 'CL', true, true, 12),
      ('Sick Leave', 'SL', true, true, 10),
      ('Maternity Leave', 'ML', true, true, 180)
      RETURNING id, code;
    `);
    const leaveTypeMap = {};
    totRes.rows.forEach(r => { leaveTypeMap[r.code] = r.id; });
    console.log(`[Seed] ✓ Created ${totRes.rows.length} Time Off types.`);

    console.log('[Seed] 4. Seeding 15 Realistic Indian Employees...');
    const employeesData = [
      {
        code: 'EMP-IN-1001',
        first: 'Rahul',
        last: 'Sharma',
        email: 'rahul.sharma@peoplepay360.com',
        phone: '+91 98450 12345',
        dept: 'Engineering',
        desig: 'Principal Software Architect',
        status: 'ACTIVE',
        doj: '2023-01-15',
        dob: '1989-05-12',
        gender: 'Male',
        pan: 'ABCPS1234A',
        address: 'Indiranagar 100ft Road, Bengaluru, Karnataka 560038',
        wage: 165000.00,
        sched: techScheduleId,
      },
      {
        code: 'EMP-IN-1002',
        first: 'Priya',
        last: 'Patel',
        email: 'priya.patel@peoplepay360.com',
        phone: '+91 98201 23456',
        dept: 'Engineering',
        desig: 'Senior Full Stack Engineer',
        status: 'ACTIVE',
        doj: '2023-04-10',
        dob: '1992-08-23',
        gender: 'Female',
        pan: 'BCDPP2345B',
        address: 'HSR Layout Sector 4, Bengaluru, Karnataka 560102',
        wage: 125000.00,
        sched: techScheduleId,
      },
      {
        code: 'EMP-IN-1003',
        first: 'Amit',
        last: 'Verma',
        email: 'amit.verma@peoplepay360.com',
        phone: '+91 97112 34567',
        dept: 'Engineering',
        desig: 'Senior Frontend Engineer',
        status: 'ACTIVE',
        doj: '2023-07-01',
        dob: '1993-11-05',
        gender: 'Male',
        pan: 'CDEPV3456C',
        address: 'Kalyani Nagar, Pune, Maharashtra 411006',
        wage: 110000.00,
        sched: generalScheduleId,
      },
      {
        code: 'EMP-IN-1004',
        first: 'Ananya',
        last: 'Iyer',
        email: 'ananya.iyer@peoplepay360.com',
        phone: '+91 98402 45678',
        dept: 'Human Resources',
        desig: 'Head of People & Culture',
        status: 'ACTIVE',
        doj: '2022-09-01',
        dob: '1990-03-18',
        gender: 'Female',
        pan: 'DEFPI4567D',
        address: 'Adyar, Chennai, Tamil Nadu 600020',
        wage: 135000.00,
        sched: generalScheduleId,
      },
      {
        code: 'EMP-IN-1005',
        first: 'Vikram',
        last: 'Singh',
        email: 'vikram.singh@peoplepay360.com',
        phone: '+91 98100 56789',
        dept: 'Finance',
        desig: 'Finance Controller',
        status: 'ACTIVE',
        doj: '2022-11-15',
        dob: '1987-12-30',
        gender: 'Male',
        pan: 'EFGPS5678E',
        address: 'Golf Course Road, Gurugram, Haryana 122002',
        wage: 145000.00,
        sched: generalScheduleId,
      },
      {
        code: 'EMP-IN-1006',
        first: 'Sneha',
        last: 'Kulkarni',
        email: 'sneha.kulkarni@peoplepay360.com',
        phone: '+91 98220 67890',
        dept: 'Finance',
        desig: 'Lead Payroll Specialist',
        status: 'ACTIVE',
        doj: '2023-02-20',
        dob: '1994-07-14',
        gender: 'Female',
        pan: 'FGHPK6789F',
        address: 'Kothrud, Pune, Maharashtra 411038',
        wage: 85000.00,
        sched: generalScheduleId,
      },
      {
        code: 'EMP-IN-1007',
        first: 'Rajesh',
        last: 'Nair',
        email: 'rajesh.nair@peoplepay360.com',
        phone: '+91 94470 78901',
        dept: 'Operations',
        desig: 'Operations Lead',
        status: 'ACTIVE',
        doj: '2023-03-15',
        dob: '1988-09-09',
        gender: 'Male',
        pan: 'GHIPN7890G',
        address: 'Kakkanad, Kochi, Kerala 682030',
        wage: 92000.00,
        sched: opsScheduleId,
      },
      {
        code: 'EMP-IN-1008',
        first: 'Pooja',
        last: 'Gupta',
        email: 'pooja.gupta@peoplepay360.com',
        phone: '+91 98765 89012',
        dept: 'Human Resources',
        desig: 'HR Talent Executive',
        status: 'ACTIVE',
        doj: '2023-08-01',
        dob: '1996-01-25',
        gender: 'Female',
        pan: 'HIJPG8901H',
        address: 'Koramangala 4th Block, Bengaluru, Karnataka 560034',
        wage: 58000.00,
        sched: generalScheduleId,
      },
      {
        code: 'EMP-IN-1009',
        first: 'Arjun',
        last: 'Reddy',
        email: 'arjun.reddy@peoplepay360.com',
        phone: '+91 98490 90123',
        dept: 'Engineering',
        desig: 'DevOps & Cloud Engineer',
        status: 'ACTIVE',
        doj: '2023-05-15',
        dob: '1993-04-04',
        gender: 'Male',
        pan: 'IJKPR9012I',
        address: 'Madhapur, Hyderabad, Telangana 500081',
        wage: 105000.00,
        sched: techScheduleId,
      },
      {
        code: 'EMP-IN-1010',
        first: 'Kavita',
        last: 'Joshi',
        email: 'kavita.joshi@peoplepay360.com',
        phone: '+91 99230 01234',
        dept: 'Engineering',
        desig: 'Lead Product UI/UX Designer',
        status: 'ACTIVE',
        doj: '2023-06-10',
        dob: '1995-10-12',
        gender: 'Female',
        pan: 'JKLPI0123J',
        address: 'Baner Road, Pune, Maharashtra 411045',
        wage: 95000.00,
        sched: generalScheduleId,
      },
      {
        code: 'EMP-IN-1011',
        first: 'Rohan',
        last: 'Mehta',
        email: 'rohan.mehta@peoplepay360.com',
        phone: '+91 98200 12340',
        dept: 'Sales',
        desig: 'Enterprise Sales Director',
        status: 'ACTIVE',
        doj: '2022-10-01',
        dob: '1986-06-19',
        gender: 'Male',
        pan: 'KLMPM1234K',
        address: 'Bandra West, Mumbai, Maharashtra 400050',
        wage: 155000.00,
        sched: generalScheduleId,
      },
      {
        code: 'EMP-IN-1012',
        first: 'Neha',
        last: 'Deshmukh',
        email: 'neha.deshmukh@peoplepay360.com',
        phone: '+91 98225 23451',
        dept: 'Sales',
        desig: 'Account Executive',
        status: 'ACTIVE',
        doj: '2023-09-01',
        dob: '1997-02-14',
        gender: 'Female',
        pan: 'LMNPD2345L',
        address: 'Aundh, Pune, Maharashtra 411007',
        wage: 65000.00,
        sched: generalScheduleId,
      },
      {
        code: 'EMP-IN-1013',
        first: 'Suresh',
        last: 'Babu',
        email: 'suresh.babu@peoplepay360.com',
        phone: '+91 94440 34562',
        dept: 'Operations',
        desig: 'Logistics Coordinator',
        status: 'ACTIVE',
        doj: '2023-10-15',
        dob: '1991-08-08',
        gender: 'Male',
        pan: 'MNOPB3456M',
        address: 'Guindy, Chennai, Tamil Nadu 600032',
        wage: 48000.00,
        sched: opsScheduleId,
      },
      {
        code: 'EMP-IN-1014',
        first: 'Divya',
        last: 'Sundaram',
        email: 'divya.sundaram@peoplepay360.com',
        phone: '+91 98455 45673',
        dept: 'Marketing',
        desig: 'Brand Marketing Strategist',
        status: 'ACTIVE',
        doj: '2024-01-08',
        dob: '1995-12-01',
        gender: 'Female',
        pan: 'NOPPS4567N',
        address: 'Whitefield, Bengaluru, Karnataka 560066',
        wage: 62000.00,
        sched: generalScheduleId,
      },
      {
        code: 'EMP-IN-1015',
        first: 'Meera',
        last: 'Pillai',
        email: 'meera.pillai@peoplepay360.com',
        phone: '+91 94475 56784',
        dept: 'Engineering',
        desig: 'Associate QA Automation Engineer',
        status: 'ON_LEAVE',
        doj: '2024-03-01',
        dob: '1998-04-20',
        gender: 'Female',
        pan: 'OPQPP5678O',
        address: 'Vellayambalam, Thiruvananthapuram, Kerala 695010',
        wage: 45000.00,
        sched: techScheduleId,
      },
    ];

    const insertedEmployees = [];

    for (const emp of employeesData) {
      const empRes = await client.query(`
        INSERT INTO employees (
          employee_code, first_name, last_name, display_name,
          email, phone, address, department, designation,
          status, date_of_joining, date_of_birth, gender,
          national_id, emergency_contact_name, emergency_contact_phone
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16
        ) RETURNING id, employee_code, first_name, last_name;
      `, [
        emp.code, emp.first, emp.last, `${emp.first} ${emp.last}`,
        emp.email, emp.phone, emp.address, emp.dept, emp.desig,
        emp.status, emp.doj, emp.dob, emp.gender,
        emp.pan, `${emp.first}'s Family`, '+91 98000 00000'
      ]);

      const insertedEmp = empRes.rows[0];
      insertedEmployees.push({ ...insertedEmp, wage: emp.wage, sched: emp.sched, doj: emp.doj });

      // 5. Create Employment Contract for each employee in INR
      await client.query(`
        INSERT INTO contracts (
          employee_id, contract_type, wage_rate, wage_type,
          start_date, working_schedule_id, salary_structure_id,
          status, notes
        ) VALUES (
          $1, 'PERMANENT', $2, 'MONTHLY',
          $3, $4, $5,
          'ACTIVE', 'Authoritative Indian employment agreement with statutory benefits.'
        );
      `, [
        insertedEmp.id, emp.wage, emp.doj, emp.sched, structureId
      ]);

      // 6. Create Time Off Allocations for 2026 (EL, CL, SL)
      await client.query(`
        INSERT INTO time_off_allocations (employee_id, time_off_type_id, year, allocated_days, used_days)
        VALUES 
        ($1, $2, 2026, 18.00, 0.00),
        ($1, $3, 2026, 12.00, 0.00),
        ($1, $4, 2026, 10.00, 0.00);
      `, [
        insertedEmp.id, leaveTypeMap['EL'], leaveTypeMap['CL'], leaveTypeMap['SL']
      ]);
    }

    console.log(`[Seed] ✓ Created ${insertedEmployees.length} Indian Employees, active contracts, and leave allocations.`);

    console.log('[Seed] 5. Seeding Realistic Attendance Records across September 2026...');
    // Seed attendance for the first 5 employees across recent working days
    const attendanceDates = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'];

    for (let i = 0; i < insertedEmployees.length; i++) {
      const emp = insertedEmployees[i];
      for (const dateStr of attendanceDates) {
        let status = 'PRESENT';
        let clockIn = `${dateStr}T09:05:00+05:30`;
        let clockOut = `${dateStr}T18:05:00+05:30`;
        let totalHours = 8.00;

        if (i === 2 && dateStr === '2026-09-04') {
          status = 'LATE';
          clockIn = `${dateStr}T10:00:00+05:30`;
          clockOut = `${dateStr}T18:00:00+05:30`;
          totalHours = 7.00;
        } else if (i === 4 && dateStr === '2026-09-03') {
          status = 'HALF_DAY';
          clockIn = `${dateStr}T09:00:00+05:30`;
          clockOut = `${dateStr}T13:30:00+05:30`;
          totalHours = 4.50;
        } else if (emp.status === 'ON_LEAVE' && dateStr >= '2026-09-04') {
          status = 'ON_LEAVE';
          clockIn = null;
          clockOut = null;
          totalHours = 0.00;
        }

        await client.query(`
          INSERT INTO attendance (employee_id, date, clock_in, clock_out, total_hours, status, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (employee_id, date) DO NOTHING;
        `, [
          emp.id, dateStr, clockIn, clockOut, totalHours, status,
          status === 'LATE' ? 'Late arrival due to traffic' : null
        ]);
      }
    }
    console.log('[Seed] ✓ Seeded realistic multi-day attendance records.');

    console.log('[Seed] 6. Seeding Time Off Requests (Approved, Pending, Refused)...');
    // Employee 15 requested sick leave (Approved)
    await client.query(`
      INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, total_days, reason, status)
      VALUES ($1, $2, '2026-09-04', '2026-09-08', 3.00, 'Medical recuperation', 'APPROVED');
    `, [insertedEmployees[14].id, leaveTypeMap['SL']]);

    // Update used days for Employee 15
    await client.query(`
      UPDATE time_off_allocations 
      SET used_days = 3.00 
      WHERE employee_id = $1 AND time_off_type_id = $2 AND year = 2026;
    `, [insertedEmployees[14].id, leaveTypeMap['SL']]);

    // Employee 2 requested casual leave (Pending)
    await client.query(`
      INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, total_days, reason, status)
      VALUES ($1, $2, '2026-09-15', '2026-09-16', 2.00, 'Family celebration', 'PENDING');
    `, [insertedEmployees[1].id, leaveTypeMap['CL']]);

    // Employee 3 requested earned leave (Pending)
    await client.query(`
      INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, total_days, reason, status)
      VALUES ($1, $2, '2026-09-22', '2026-09-25', 4.00, 'Annual vacation', 'PENDING');
    `, [insertedEmployees[2].id, leaveTypeMap['EL']]);

    // Employee 7 requested leave (Rejected)
    await client.query(`
      INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, total_days, reason, status)
      VALUES ($1, $2, '2026-09-01', '2026-09-02', 2.00, 'Personal emergency', 'REJECTED');
    `, [insertedEmployees[6].id, leaveTypeMap['CL']]);

    console.log('[Seed] ✓ Seeded Time Off requests with active balance tracking.');

    console.log('[Seed] 7. Seeding Executed Indian Payrun & Itemized Payslips...');
    // Create August 2026 Completed Payrun
    const payrunRes = await client.query(`
      INSERT INTO payruns (name, pay_period_start, pay_period_end, execution_date, status, total_gross, total_deductions, total_net)
      VALUES (
        'August 2026 Monthly Payroll Cycle',
        '2026-08-01',
        '2026-08-31',
        '2026-08-31T18:00:00+05:30',
        'PAID',
        0.00, 0.00, 0.00
      ) RETURNING id;
    `);
    const payrunId = payrunRes.rows[0].id;

    let aggregateGross = 0;
    let aggregateDeductions = 0;
    let aggregateNet = 0;

    // Generate real payslips for the top 5 employees for August 2026
    for (let i = 0; i < 5; i++) {
      const emp = insertedEmployees[i];
      const monthlyWage = emp.wage;

      // Salary components based on Indian standard:
      const basic = Math.round(monthlyWage * 0.50);
      const hra = Math.round(monthlyWage * 0.20);
      const spl = Math.round(monthlyWage * 0.25);
      const transport = 3000.00;
      const gross = basic + hra + spl + transport;

      const pf = Math.round(basic * 0.12);
      const pt = 200.00;
      const deductions = pf + pt;
      const net = gross - deductions;

      aggregateGross += gross;
      aggregateDeductions += deductions;
      aggregateNet += net;

      // Create Payslip
      const slipRes = await client.query(`
        INSERT INTO payslips (
          payrun_id, employee_id, worked_days, absent_days,
          gross_amount, total_deductions, net_amount, status
        ) VALUES (
          $1, $2, 22.00, 0.00,
          $3, $4, $5, 'PAID'
        ) RETURNING id;
      `, [payrunId, emp.id, gross, deductions, net]);
      const payslipId = slipRes.rows[0].id;

      // Create itemized Payslip Lines
      await client.query(`
        INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, amount)
        VALUES 
        ($1, 'BASIC', 'Basic Salary', 'ALLOWANCE', $2),
        ($1, 'HRA', 'House Rent Allowance (HRA)', 'ALLOWANCE', $3),
        ($1, 'SPL_ALLOW', 'Special Allowance', 'ALLOWANCE', $4),
        ($1, 'TRANSPORT', 'Transport Allowance', 'ALLOWANCE', $5),
        ($1, 'PF_EMP', 'Provident Fund (PF - Employee)', 'DEDUCTION', $6),
        ($1, 'PT', 'Professional Tax (PT)', 'DEDUCTION', $7);
      `, [payslipId, basic, hra, spl, transport, pf, pt]);
    }

    // Update aggregate totals on the payrun record
    await client.query(`
      UPDATE payruns 
      SET total_gross = $1, total_deductions = $2, total_net = $3 
      WHERE id = $4;
    `, [aggregateGross, aggregateDeductions, aggregateNet, payrunId]);

    console.log('[Seed] 8. Creating 5 Authoritative Demo User Accounts (Password: Demo@123)...');
    const demoPasswordHash = hashPassword('Demo@123');

    const demoUsers = [
      {
        email: 'admin@peoplepay360.demo',
        name: 'System Administrator',
        role: 'ADMIN',
        employeeId: null,
      },
      {
        email: 'hr.manager@peoplepay360.demo',
        name: 'Ananya Iyer (HR Manager)',
        role: 'HR_MANAGER',
        employeeId: insertedEmployees[3].id, // Ananya Iyer (Head of People & Culture)
      },
      {
        email: 'payroll.user@peoplepay360.demo',
        name: 'Sneha Kulkarni (Payroll User)',
        role: 'HR_PAYROLL_USER',
        employeeId: insertedEmployees[5].id, // Sneha Kulkarni (Lead Payroll Specialist)
      },
      {
        email: 'payroll.manager@peoplepay360.demo',
        name: 'Vikram Singh (Payroll Manager)',
        role: 'HR_PAYROLL_MANAGER',
        employeeId: insertedEmployees[4].id, // Vikram Singh (Finance Controller)
      },
      {
        email: 'employee@peoplepay360.demo',
        name: 'Rahul Sharma (Employee)',
        role: 'EMPLOYEE',
        employeeId: insertedEmployees[0].id, // Rahul Sharma (Principal Software Architect)
      },
    ];

    for (const u of demoUsers) {
      await client.query(`
        INSERT INTO users (email, password_hash, name, role, employee_id, status)
        VALUES ($1, $2, $3, $4, $5, 'ACTIVE');
      `, [u.email, demoPasswordHash, u.name, u.role, u.employeeId]);
    }
    console.log('[Seed] ✓ Created 5 authoritative demo accounts with cryptographically hashed passwords.');

    await client.query('COMMIT');

    console.log('====================================================');
    console.log('  Database Seeding Completed Successfully!           ');
    console.log(`  - Users:            5 (Admin, HR Mgr, Payroll User, Payroll Mgr, Employee)`);
    console.log(`  - Employees:        ${insertedEmployees.length} (Indian profiles)`);
    console.log(`  - Schedules:        3 (Asia/Kolkata timezone)`);
    console.log(`  - Salary Structure: 1 (INR CTC breakdown)`);
    console.log(`  - Attendance logs:  ${insertedEmployees.length * attendanceDates.length}`);
    console.log(`  - Time Off types:   4`);
    console.log(`  - Payruns:          1 (August 2026 Paid cycle)`);
    console.log(`  - Payslips:         5 (Itemized in INR)`);
    console.log('====================================================');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Seed Error]: Transaction rolled back due to error:', error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

runSeed();
