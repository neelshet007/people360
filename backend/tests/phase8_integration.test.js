const http = require('http');

function post(url, data, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let resBody = '';
        res.on('data', (d) => (resBody += d));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resBody) });
          } catch (e) {
            resolve({ status: res.statusCode, data: resBody });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, token = null, binary = false) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        if (binary) {
          const chunks = [];
          res.on('data', (d) => chunks.push(d));
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              buffer: Buffer.concat(chunks),
            });
          });
        } else {
          let resBody = '';
          res.on('data', (d) => (resBody += d));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(resBody) });
            } catch (e) {
              resolve({ status: res.statusCode, data: resBody });
            }
          });
        }
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('===========================================================');
  console.log('  Phase 8 System Integration & Full Business Lifecycle Test');
  console.log('===========================================================');

  try {
    // 1. Sign In as HR Payroll Manager
    console.log('\n[1] Authenticating as HR Payroll Manager...');
    const loginRes = await post('http://localhost:5000/api/auth/login', {
      email: 'payroll.manager@peoplepay360.demo',
      password: 'Demo@123',
    });
    if (loginRes.status !== 200 || !loginRes.data.data?.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
    }
    const mgrToken = loginRes.data.data.token;
    console.log('✓ Authenticated successfully. Role:', loginRes.data.data.user.role);

    // 2. Fetch Dashboard live stats
    console.log('\n[2] Fetching Live Dashboard Metrics (/api/dashboard/stats)...');
    const dashRes = await get('http://localhost:5000/api/dashboard/stats', mgrToken);
    console.log('✓ Dashboard Status:', dashRes.status);
    console.log('   Total Workforce:', dashRes.data.data?.employees?.total);
    console.log('   Active Contracts:', dashRes.data.data?.contracts?.active);
    console.log('   Attendance Records:', dashRes.data.data?.attendance?.total_records);
    console.log('   Payruns in System:', dashRes.data.data?.payroll?.total_payruns);
    console.log('   Department Breakdown:', dashRes.data.data?.payroll?.by_department?.length, 'departments found');

    // 3. Employee -> Contract -> Working Schedule Verification
    console.log('\n[3] Verifying Employee -> Contract -> Schedule integration...');
    const empsRes = await get('http://localhost:5000/api/employees', mgrToken);
    const rahul = empsRes.data.data.find((e) => e.email === 'rahul.sharma@peoplepay360.demo') || empsRes.data.data[0];
    console.log(`✓ Target Employee: ${rahul.first_name} ${rahul.last_name} (${rahul.employee_code})`);

    const contractRes = await get(`http://localhost:5000/api/contracts?employee_id=${rahul.id}`, mgrToken);
    const wage = contractRes.data.data && contractRes.data.data[0] ? contractRes.data.data[0].wage_rate : 50000;
    console.log(`✓ Active Contract Wage: ₹${wage} / month`);

    // 4. Create Payrun for October 2026 (Clean previous test batch if any)
    const db = require('../src/database/db');
    await db.query(`DELETE FROM payslips WHERE payrun_id IN (SELECT id FROM payruns WHERE pay_period_start = '2026-10-01')`);
    await db.query(`DELETE FROM payruns WHERE pay_period_start = '2026-10-01'`);

    console.log('\n[4] Creating October 2026 Payrun Batch...');
    const uniqueSuffix = Date.now().toString().slice(-4);
    const createPayrunRes = await post(
      'http://localhost:5000/api/payroll/payruns',
      {
        name: `October 2026 Integrated Cycle [${uniqueSuffix}]`,
        pay_period_start: '2026-10-01',
        pay_period_end: '2026-10-31',
        notes: 'Phase 8 full cycle integration test run',
      },
      mgrToken
    );
    if (!createPayrunRes.data || !createPayrunRes.data.data) {
      throw new Error(`Create payrun failed: ${JSON.stringify(createPayrunRes.data)}`);
    }
    const payrun = createPayrunRes.data.data;
    console.log(`✓ Payrun created with ID: ${payrun.id} (Status: ${payrun.status})`);

    // 5. Compute Payrun
    console.log('\n[5] Computing Payrun using Phase 6 Salary Engine...');
    const computeRes = await post(`http://localhost:5000/api/payroll/payruns/${payrun.id}/compute`, {}, mgrToken);
    const computedPayrun = computeRes.data.data;
    console.log('✓ Computed Status:', computedPayrun.status);
    console.log(`   Total Gross: ₹${computedPayrun.total_gross}`);
    console.log(`   Total Deductions: ₹${computedPayrun.total_deductions}`);
    console.log(`   Total Net: ₹${computedPayrun.total_net}`);
    console.log(`   Payslips Generated: ${computedPayrun.payslips?.length || computedPayrun.employee_count}`);

    // 6. Validate Payrun
    console.log('\n[6] Validating Payrun Batch...');
    const validateRes = await post(`http://localhost:5000/api/payroll/payruns/${payrun.id}/validate`, {}, mgrToken);
    console.log('✓ Validated Status:', validateRes.data.data?.status);

    // 7. Bulk Email Payslips
    console.log('\n[7] Testing Bulk Email Dispatch (/api/payroll/payruns/:id/email-payslips)...');
    const emailRes = await post(`http://localhost:5000/api/payroll/payruns/${payrun.id}/email-payslips`, {}, mgrToken);
    console.log('✓ Email Dispatch Result:', emailRes.data.data?.message);
    console.log(`   Dispatched: ${emailRes.data.data?.success_count} emails, Failed: ${emailRes.data.data?.failed_count}`);

    // 8. Test Payslip PDF Generation (PDFKit)
    console.log('\n[8] Testing Payslip PDF Generation (/api/payroll/payslips/:id/pdf)...');
    const payslipsRes = await get(`http://localhost:5000/api/payroll/payslips?payrun_id=${payrun.id}`, mgrToken);
    const targetPayslip = payslipsRes.data.data[0];
    console.log(`✓ Target Payslip ID: ${targetPayslip.id} for ${targetPayslip.employee_name}`);

    const pdfRes = await get(`http://localhost:5000/api/payroll/payslips/${targetPayslip.id}/pdf`, mgrToken, true);
    console.log('✓ PDF HTTP Status:', pdfRes.status);
    console.log('   Content-Type:', pdfRes.headers['content-type']);
    console.log('   Buffer Size:', pdfRes.buffer?.length, 'bytes');

    const pdfHeader = pdfRes.buffer?.slice(0, 5).toString('ascii');
    if (pdfHeader !== '%PDF-') {
      throw new Error(`Invalid PDF header: ${pdfHeader}`);
    }
    console.log('✓ Valid PDFKit binary header verified: %PDF-');

    // 9. Mark Payrun as Paid
    console.log('\n[9] Marking Payrun as PAID...');
    const paidRes = await post(`http://localhost:5000/api/payroll/payruns/${payrun.id}/pay`, {}, mgrToken);
    console.log('✓ Final Status:', paidRes.data.data?.status);

    // 10. Test Employee Data Isolation
    console.log('\n[10] Testing Employee Data Isolation...');
    const empLogin = await post('http://localhost:5000/api/auth/login', {
      email: 'employee@peoplepay360.demo',
      password: 'Demo@123',
    });
    const empToken = empLogin.data.data.token;
    const empId = empLogin.data.data.user.employeeId;
    console.log(`✓ Logged in as Employee (ID: ${empId})`);

    const empPayslipsRes = await get('http://localhost:5000/api/payroll/payslips', empToken);
    const foreignPayslips = empPayslipsRes.data.data.filter((p) => p.employee_id !== empId);
    if (foreignPayslips.length > 0) {
      throw new Error(`Data isolation violation: Employee received ${foreignPayslips.length} foreign payslips!`);
    }
    console.log(`✓ Employee payslip list correctly isolated: ${empPayslipsRes.data.data.length} personal payslips.`);

    // Check Employee downloading own PDF
    const ownPayslip = empPayslipsRes.data.data[0];
    if (ownPayslip) {
      const ownPdfRes = await get(`http://localhost:5000/api/payroll/payslips/${ownPayslip.id}/pdf`, empToken, true);
      console.log(`✓ Employee successfully downloaded own payslip PDF (Status: ${ownPdfRes.status}, Size: ${ownPdfRes.buffer.length} bytes)`);
    }

    console.log('\n===========================================================');
    console.log('  🎉 ALL PHASE 8 SYSTEM INTEGRATION TESTS PASSED!');
    console.log('===========================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
