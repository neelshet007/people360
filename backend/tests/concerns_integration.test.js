const assert = require('assert');
const http = require('http');
const app = require('../src/server/app');
const db = require('../src/database/db');

let server;
let baseUrl;

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('  PeoplePay360: Concerns Integration Test Suite     ');
  console.log('====================================================\n');

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate users
    let employeeToken = null;
    let hrToken = null;

    await test('Sign in as Employee (Rahul Sharma)', async () => {
      const res = await request('POST', '/api/auth/login', {}, {
        email: 'employee@peoplepay360.demo',
        password: 'Demo@123',
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.token);
      employeeToken = res.body.data.token;
    });

    await test('Sign in as HR Manager (Ananya Iyer)', async () => {
      const res = await request('POST', '/api/auth/login', {}, {
        email: 'hr.manager@peoplepay360.demo',
        password: 'Demo@123',
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.token);
      hrToken = res.body.data.token;
    });

    // 2. Employee isolation check
    await test('Employee can only see concerns raised by or about themselves', async () => {
      const res = await request('GET', '/api/concerns', {
        Authorization: `Bearer ${employeeToken}`,
      });
      assert.strictEqual(res.status, 200);
      const list = res.body.data.concerns;
      assert.ok(list.length > 0);
      // Ensure CON-1004 (Amit Patel) is NOT present in Rahul's list
      const hasAmitConcern = list.some((c) => c.concern_code === 'CON-1004');
      assert.strictEqual(hasAmitConcern, false, 'Employee should NOT see Amit Patels concern');
    });

    // 3. HR Manager full visibility
    await test('HR Manager can see all company concerns including Amit Patel', async () => {
      const res = await request('GET', '/api/concerns', {
        Authorization: `Bearer ${hrToken}`,
      });
      assert.strictEqual(res.status, 200);
      const list = res.body.data.concerns;
      const hasAmitConcern = list.some((c) => c.concern_code === 'CON-1004');
      assert.strictEqual(hasAmitConcern, true, 'HR Manager should see all concerns');
    });

    // 4. Internal HR Note protection
    let con1Id = null;
    await test('Fetch CON-1001 ID from HR list', async () => {
      const res = await request('GET', '/api/concerns?search=CON-1001', {
        Authorization: `Bearer ${hrToken}`,
      });
      assert.strictEqual(res.status, 200);
      con1Id = res.body.data.concerns[0].id;
      assert.ok(con1Id);
    });

    await test('HR Manager sees internal notes in conversation thread', async () => {
      const res = await request('GET', `/api/concerns/${con1Id}`, {
        Authorization: `Bearer ${hrToken}`,
      });
      assert.strictEqual(res.status, 200);
      const msgs = res.body.data.messages;
      const internalNote = msgs.find((m) => m.is_internal === true);
      assert.ok(internalNote, 'HR should see the internal note');
      assert.ok(internalNote.message.includes('Audited perimeter badge logs'));
    });

    await test('Employee CANNOT see internal notes in conversation thread', async () => {
      const res = await request('GET', `/api/concerns/${con1Id}`, {
        Authorization: `Bearer ${employeeToken}`,
      });
      assert.strictEqual(res.status, 200);
      const msgs = res.body.data.messages;
      const internalNote = msgs.find((m) => m.is_internal === true);
      assert.strictEqual(internalNote, undefined, 'Employee must NEVER receive internal notes');
    });

    // 5. Linked record resolution
    await test('Concern detail resolves related attendance record snapshot', async () => {
      const res = await request('GET', `/api/concerns/${con1Id}`, {
        Authorization: `Bearer ${hrToken}`,
      });
      assert.strictEqual(res.status, 200);
      const record = res.body.data.related_record;
      assert.ok(record, 'Related record should be resolved');
      assert.strictEqual(record.type, 'ATTENDANCE');
      assert.ok(record.title.includes('Attendance Record'));
    });

    // 6. Creating concerns
    let newConcernId = null;
    await test('Employee creates a new concern (subject employee forced to self)', async () => {
      const res = await request('POST', '/api/concerns', {
        Authorization: `Bearer ${employeeToken}`,
      }, {
        category: 'WORKPLACE',
        subject: 'Ergonomic Chair Request',
        description: 'Need an ergonomic lumbar chair adjustment for workstation #402.',
        priority: 'LOW',
      });
      assert.strictEqual(res.status, 201);
      assert.ok(res.body.data.id);
      assert.ok(res.body.data.concern_code.startsWith('CON-'));
      assert.strictEqual(res.body.data.status, 'OPEN');
      newConcernId = res.body.data.id;
    });

    // 7. Conversation replies
    await test('Employee replies to their concern', async () => {
      const res = await request('POST', `/api/concerns/${newConcernId}/messages`, {
        Authorization: `Bearer ${employeeToken}`,
      }, {
        message: 'Additional note: Occupational health doctor recommendation attached.',
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.is_internal, false);
    });

    await test('Employee CANNOT post an internal note (flag is ignored/enforced false)', async () => {
      const res = await request('POST', `/api/concerns/${newConcernId}/messages`, {
        Authorization: `Bearer ${employeeToken}`,
      }, {
        message: 'Trying to sneak an internal note.',
        isInternal: true,
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.is_internal, false);
    });

    await test('HR Manager posts an internal note', async () => {
      const res = await request('POST', `/api/concerns/${newConcernId}/messages`, {
        Authorization: `Bearer ${hrToken}`,
      }, {
        message: 'Facilities budget approved for ergonomic furniture replacement.',
        isInternal: true,
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.is_internal, true);
    });

    // 8. Controlled status transition
    await test('HR Manager updates status from OPEN to UNDER_REVIEW', async () => {
      const res = await request('PATCH', `/api/concerns/${newConcernId}/status`, {
        Authorization: `Bearer ${hrToken}`,
      }, {
        status: 'UNDER_REVIEW',
        comment: 'Forwarded to Workplace Facilities team',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.status, 'UNDER_REVIEW');
    });

    await test('Invalid status transition fails (UNDER_REVIEW to invalid jump)', async () => {
      const res = await request('PATCH', `/api/concerns/${newConcernId}/status`, {
        Authorization: `Bearer ${hrToken}`,
      }, {
        status: 'NON_EXISTENT_STATUS',
      });
      assert.strictEqual(res.status, 400);
    });

    await test('HR Manager transitions to RESOLVED', async () => {
      const res = await request('PATCH', `/api/concerns/${newConcernId}/status`, {
        Authorization: `Bearer ${hrToken}`,
      }, {
        status: 'RESOLVED',
        comment: 'Ergonomic chair delivered to workstation.',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.status, 'RESOLVED');
      assert.ok(res.body.data.resolved_at);
    });

    await test('Employee confirms resolution by CLOSING the concern', async () => {
      const res = await request('PATCH', `/api/concerns/${newConcernId}/status`, {
        Authorization: `Bearer ${employeeToken}`,
      }, {
        status: 'CLOSED',
        comment: 'Received chair, fits perfectly. Thank you!',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.status, 'CLOSED');
      assert.ok(res.body.data.closed_at);
    });

    // 9. Metrics endpoint
    await test('Metrics endpoint returns breakdown', async () => {
      const res = await request('GET', '/api/concerns/metrics', {
        Authorization: `Bearer ${hrToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.total >= 4);
      assert.ok(typeof res.body.data.open === 'number');
      assert.ok(typeof res.body.data.under_review === 'number');
    });
  } finally {
    if (server) server.close();
  }

  console.log('\n====================================================');
  console.log(`  Tests Complete: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
