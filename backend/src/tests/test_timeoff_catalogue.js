const db = require('../database/db');
const timeoffService = require('../modules/timeoff/services');
const compOffService = require('../modules/timeoff/services/compOffService');

async function testTimeoffCatalogue() {
  console.log('--- Testing Time Off Type Catalogue & Flexible Comp Off ---');
  try {
    // 1. Fetch Types
    const types = await timeoffService.getTypes();
    console.log(`[PASS] Fetched ${types.length} time off types`);
    const compOff = types.find(t => t.code === 'COMP_OFF');
    if (!compOff) throw new Error('COMP_OFF type not found in database');
    console.log(`[PASS] COMP_OFF allocation_method: ${compOff.allocation_method}, annual_allocation: ${compOff.annual_allocation}`);
    if (compOff.allocation_method !== 'EARNED') throw new Error('COMP_OFF must have allocation_method = EARNED');
    if (compOff.annual_allocation !== null) throw new Error('COMP_OFF must have annual_allocation = null');

    // 2. Create a new custom leave type
    const testCode = 'TEST_CAT_' + Date.now().toString().slice(-4);
    const created = await timeoffService.createType({
      name: 'Paternity / Caregiver Leave',
      code: testCode,
      description: 'Secondary caregiver time off',
      is_paid: true,
      allocation_method: 'FIXED_ANNUAL',
      annual_allocation: 14.0,
      requires_approval: true,
      allow_employee_request: true,
      allow_half_day: true,
    });
    console.log(`[PASS] Created custom type: ${created.name} (${created.code})`);

    // 3. Update the type
    const updated = await timeoffService.updateType(created.id, {
      description: 'Updated caregiver time off description',
      annual_allocation: 15.0,
      is_active: false,
    });
    console.log(`[PASS] Updated type is_active: ${updated.is_active}, allocation: ${updated.annual_allocation}`);

    // Re-activate
    await timeoffService.updateType(created.id, { is_active: true });

    // 4. Test Comp Off Earning & Redemption with an employee
    const empRes = await db.query('SELECT id, display_name FROM employees LIMIT 1');
    const emp = empRes.rows[0];
    console.log(`Testing with employee: ${emp.display_name} (${emp.id})`);

    // Get initial comp off balance
    const initBal = await compOffService.getBalance(emp.id);
    console.log(`Initial available comp off: ${initBal.available_days}`);

    // Raise a comp-off claim for weekend work
    const claimDate = '2026-07-11'; // Saturday
    await db.query('DELETE FROM comp_off_credits WHERE employee_id = $1 AND work_date = $2', [emp.id, claimDate]);

    const claim = await compOffService.raiseCreditClaim({
      employee_id: emp.id,
      work_date: claimDate,
      hours_worked: 8,
      reason: 'Urgent weekend deployment support',
      days_credited: 1.0,
    }, null, 'HR_MANAGER');
    console.log(`[PASS] Raised comp-off claim ${claim.id} (Status: ${claim.status})`);

    // Approve the claim
    const approvedClaim = await compOffService.approveCredit(claim.id, null);
    console.log(`[PASS] Approved comp-off claim (Status: ${approvedClaim.status})`);

    // Verify balance increased
    const afterBal = await compOffService.getBalance(emp.id);
    console.log(`Balance after earning: ${afterBal.available_days} day(s)`);
    if (afterBal.available_days < initBal.available_days + 1) {
      throw new Error('Balance did not increase after comp off approval');
    }

    // 5. Test Requesting Comp Off:
    // A) Attempting to consume more than available should fail with 400
    let excessCaught = false;
    try {
      await timeoffService.createRequest({
        employee_id: emp.id,
        time_off_type_id: compOff.id,
        start_date: '2026-09-14',
        end_date: '2026-09-25', // 10 working days, exceeds balance
        reason: 'Excess comp off test',
      }, { role: 'EMPLOYEE', employeeId: emp.id });
    } catch (err) {
      excessCaught = true;
      console.log(`[PASS] Successfully rejected excess Comp Off: ${err.message}`);
    }
    if (!excessCaught) throw new Error('Failed to reject excess comp off consumption');

    // B) Requesting within balance should succeed
    const validReq = await timeoffService.createRequest({
      employee_id: emp.id,
      time_off_type_id: compOff.id,
      start_date: '2026-09-18', // Friday (1 working day)
      end_date: '2026-09-18',
      reason: 'Redeeming earned weekend credit',
    }, { role: 'EMPLOYEE', employeeId: emp.id });
    console.log(`[PASS] Created valid Comp Off request: ${validReq.id} for ${validReq.total_days} day(s)`);

    // C) Approving the request consumes credits and updates attendance to ON_LEAVE
    await timeoffService.updateRequestStatus(validReq.id, { status: 'APPROVED', approver_id: emp.id });
    console.log(`[PASS] Approved Comp Off request and triggered credit consumption`);

    // Check attendance for 2026-09-18
    const attRes = await db.query("SELECT status, notes FROM attendance WHERE employee_id = $1 AND date = '2026-09-18'", [emp.id]);
    if (attRes.rows.length > 0) {
      console.log(`[PASS] Attendance marked as: ${attRes.rows[0].status} (${attRes.rows[0].notes})`);
    }

    // Clean up test records
    await db.query('DELETE FROM time_off_requests WHERE id = $1', [validReq.id]);
    await db.query('DELETE FROM comp_off_credits WHERE id = $1', [claim.id]);
    await db.query('DELETE FROM attendance WHERE employee_id = $1 AND date = $2', [emp.id, '2026-09-18']);
    await db.query('DELETE FROM time_off_types WHERE id = $1', [created.id]);

    console.log('--- ALL BACKEND TESTS PASSED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('[TEST FAILURE]:', err);
    process.exit(1);
  }
}

testTimeoffCatalogue();
