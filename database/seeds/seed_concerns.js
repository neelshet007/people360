const db = require('../../backend/src/database/db');

async function seedConcerns() {
  console.log('[Seed Concerns] Seeding realistic HR Concern Communication cases...');

  try {
    // 1. Fetch relevant user IDs
    const usersRes = await db.query(`
      SELECT u.id, u.email, u.name, u.role, u.employee_id 
      FROM users u;
    `);

    const userMap = {};
    for (const u of usersRes.rows) {
      userMap[u.email] = u;
    }

    const rahulUser = userMap['employee@peoplepay360.demo'];
    const ananyaUser = userMap['hr.manager@peoplepay360.demo'];
    const snehaUser = userMap['payroll.user@peoplepay360.demo'];

    if (!rahulUser || !ananyaUser) {
      console.warn('[Seed Concerns] Missing required demo users (Rahul or Ananya). Run main seed first.');
      process.exit(1);
    }

    // Fetch Amit Patel employee ID
    const amitRes = await db.query("SELECT id FROM employees WHERE first_name = 'Amit' LIMIT 1;");
    const amitEmployeeId = amitRes.rows[0]?.id || rahulUser.employee_id;

    // Fetch an attendance record for Rahul
    const attRes = await db.query(`
      SELECT id FROM attendance 
      WHERE employee_id = $1 
      ORDER BY date DESC 
      LIMIT 1;
    `, [rahulUser.employee_id]);
    const attendanceRecordId = attRes.rows[0]?.id || null;

    // Fetch August payslip for Rahul
    const payslipRes = await db.query(`
      SELECT id FROM payslips 
      WHERE employee_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1;
    `, [rahulUser.employee_id]);
    const payslipRecordId = payslipRes.rows[0]?.id || null;

    // Fetch contract for Amit
    const contractRes = await db.query(`
      SELECT id FROM contracts 
      WHERE employee_id = $1 
      ORDER BY start_date DESC 
      LIMIT 1;
    `, [amitEmployeeId]);
    const contractRecordId = contractRes.rows[0]?.id || null;

    // Clean existing concerns
    await db.query('DELETE FROM concern_messages;');
    await db.query('DELETE FROM concern_status_history;');
    await db.query('DELETE FROM concerns;');

    // ── CASE 1: Employee → HR (Attendance Discrepancy) ──
    const case1 = await db.query(`
      INSERT INTO concerns (
        concern_code, raised_by_user_id, subject_employee_id, category, subject, description,
        priority, status, assigned_to_user_id, related_entity_type, related_entity_id, created_at
      ) VALUES (
        'CON-1001', $1, $2, 'ATTENDANCE', 'Attendance Discrepancy for 4 September',
        'My attendance record for 4 September shows late arrival or absent despite checking in at the physical reception terminal.',
        'MEDIUM', 'UNDER_REVIEW', $3, 'ATTENDANCE', $4, NOW() - INTERVAL '2 days'
      ) RETURNING id;
    `, [rahulUser.id, rahulUser.employee_id, ananyaUser.id, attendanceRecordId]);
    const c1Id = case1.rows[0].id;

    // Case 1 History
    await db.query(`
      INSERT INTO concern_status_history (concern_id, from_status, to_status, changed_by_user_id, comment, created_at)
      VALUES 
      ($1, NULL, 'OPEN', $2, 'Concern raised by employee', NOW() - INTERVAL '2 days'),
      ($1, 'OPEN', 'UNDER_REVIEW', $3, 'Assigned to HR Manager and moved to Under Review', NOW() - INTERVAL '1 day');
    `, [c1Id, rahulUser.id, ananyaUser.id]);

    // Case 1 Messages
    await db.query(`
      INSERT INTO concern_messages (concern_id, sender_user_id, message, is_internal, created_at)
      VALUES 
      ($1, $2, 'My attendance record for 4 September shows late arrival or absent despite checking in at the physical reception terminal.', false, NOW() - INTERVAL '2 days'),
      ($1, $3, 'Hello Rahul, could you please confirm approximately what time you arrived and which entrance terminal you badged through?', false, NOW() - INTERVAL '1 day 12 hours'),
      ($1, $2, 'I arrived around 9:42 AM and badged at the North Lobby Gate 2 entrance.', false, NOW() - INTERVAL '1 day 8 hours'),
      ($1, $3, 'Audited perimeter badge logs: Confirmed entrance swipe recorded at 09:41:48 IST. Attendance normalization required.', true, NOW() - INTERVAL '1 day 6 hours'),
      ($1, $3, 'Thank you for providing the details. We are verifying the badge logs with the physical security system and will update your record shortly.', false, NOW() - INTERVAL '1 day 4 hours');
    `, [c1Id, rahulUser.id, ananyaUser.id]);

    // ── CASE 2: HR Manager → Employee (Unapproved Absence Notice) ──
    const case2 = await db.query(`
      INSERT INTO concerns (
        concern_code, raised_by_user_id, subject_employee_id, category, subject, description,
        priority, status, assigned_to_user_id, related_entity_type, related_entity_id, created_at
      ) VALUES (
        'CON-1002', $1, $2, 'ATTENDANCE', 'Repeated unapproved absence records',
        'Attendance records indicate absences without corresponding approved leave requests for recent dates.',
        'HIGH', 'WAITING_FOR_EMPLOYEE', $1, NULL, NULL, NOW() - INTERVAL '1 day'
      ) RETURNING id;
    `, [ananyaUser.id, rahulUser.employee_id]);
    const c2Id = case2.rows[0].id;

    // Case 2 History
    await db.query(`
      INSERT INTO concern_status_history (concern_id, from_status, to_status, changed_by_user_id, comment, created_at)
      VALUES 
      ($1, NULL, 'OPEN', $2, 'Concern initiated by HR', NOW() - INTERVAL '1 day'),
      ($1, 'OPEN', 'WAITING_FOR_EMPLOYEE', $2, 'Requested explanation from employee', NOW() - INTERVAL '20 hours');
    `, [c2Id, ananyaUser.id]);

    // Case 2 Messages
    await db.query(`
      INSERT INTO concern_messages (concern_id, sender_user_id, message, is_internal, created_at)
      VALUES 
      ($1, $2, 'Attendance records indicate absences without corresponding approved leave requests for recent dates.', false, NOW() - INTERVAL '1 day'),
      ($1, $2, 'Hi Rahul, please provide formal documentation or submit retroactive time-off requests for the unlogged days so we can reconcile your monthly attendance.', false, NOW() - INTERVAL '20 hours');
    `, [c2Id, ananyaUser.id]);

    // ── CASE 3: Employee → Payroll (Payslip Deduction Inquiry) ──
    const case3 = await db.query(`
      INSERT INTO concerns (
        concern_code, raised_by_user_id, subject_employee_id, category, subject, description,
        priority, status, assigned_to_user_id, related_entity_type, related_entity_id, created_at, resolved_at
      ) VALUES (
        'CON-1003', $1, $2, 'PAYROLL', 'Clarification on Professional Tax and PF deductions',
        'I noticed a difference in the tax deduction calculation on my August itemized payslip.',
        'MEDIUM', 'RESOLVED', $3, 'PAYSLIP', $4, NOW() - INTERVAL '3 days', NOW() - INTERVAL '6 hours'
      ) RETURNING id;
    `, [rahulUser.id, rahulUser.employee_id, snehaUser?.id || ananyaUser.id, payslipRecordId]);
    const c3Id = case3.rows[0].id;

    // Case 3 History
    await db.query(`
      INSERT INTO concern_status_history (concern_id, from_status, to_status, changed_by_user_id, comment, created_at)
      VALUES 
      ($1, NULL, 'OPEN', $2, 'Concern raised by employee', NOW() - INTERVAL '3 days'),
      ($1, 'OPEN', 'IN_PROGRESS', $3, 'Payroll specialist reviewing calculation rules', NOW() - INTERVAL '2 days'),
      ($1, 'IN_PROGRESS', 'RESOLVED', $3, 'Deduction breakdown clarified and confirmed', NOW() - INTERVAL '6 hours');
    `, [c3Id, rahulUser.id, snehaUser?.id || ananyaUser.id]);

    // Case 3 Messages
    await db.query(`
      INSERT INTO concern_messages (concern_id, sender_user_id, message, is_internal, created_at)
      VALUES 
      ($1, $2, 'I noticed a difference in the tax deduction calculation on my August itemized payslip.', false, NOW() - INTERVAL '3 days'),
      ($1, $3, 'Hello Rahul, we reviewed your computation against the state PT bracket (fixed ₹200) and standard 12% PF on Basic. The statutory deductions match our certified calculation engine.', false, NOW() - INTERVAL '1 day'),
      ($1, $2, 'Understood, thank you Sneha for the prompt clarification!', false, NOW() - INTERVAL '12 hours'),
      ($1, $3, 'You are very welcome. Marking this concern as resolved.', false, NOW() - INTERVAL '6 hours');
    `, [c3Id, rahulUser.id, snehaUser?.id || ananyaUser.id]);

    // ── CASE 4: HR → Employee (Contract Clarification) ──
    const case4 = await db.query(`
      INSERT INTO concerns (
        concern_code, raised_by_user_id, subject_employee_id, category, subject, description,
        priority, status, assigned_to_user_id, related_entity_type, related_entity_id, created_at
      ) VALUES (
        'CON-1004', $1, $2, 'CONTRACT', 'Upcoming Annual Contract Renewal Terms',
        'Reviewing permanent terms and working schedule adjustment ahead of Q4 workforce planning.',
        'LOW', 'OPEN', $1, 'CONTRACT', $3, NOW() - INTERVAL '4 hours'
      ) RETURNING id;
    `, [ananyaUser.id, amitEmployeeId, contractRecordId]);

    await db.query(`
      INSERT INTO concern_status_history (concern_id, from_status, to_status, changed_by_user_id, comment, created_at)
      VALUES ($1, NULL, 'OPEN', $2, 'Contract renewal concern opened', NOW() - INTERVAL '4 hours');
    `, [case4.rows[0].id, ananyaUser.id]);

    await db.query(`
      INSERT INTO concern_messages (concern_id, sender_user_id, message, is_internal, created_at)
      VALUES ($1, $2, 'Reviewing permanent terms and working schedule adjustment ahead of Q4 workforce planning.', false, NOW() - INTERVAL '4 hours');
    `, [case4.rows[0].id, ananyaUser.id]);

    // Reset sequence past the highest seeded code
    await db.query(`
      SELECT setval('concern_code_seq', COALESCE((SELECT MAX(CAST(SUBSTRING(concern_code FROM 5) AS INTEGER)) FROM concerns), 1000) + 1, false);
    `);

    console.log('[Seed Concerns] ✅ Successfully seeded 4 realistic Concern Communication cases with messages, audit logs, and related record links.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Concerns Error]:', err);
    process.exit(1);
  }
}

seedConcerns();
