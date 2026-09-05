const db = require('../backend/src/database/db');

async function seedRichAttendance() {
  console.log('[Seed Rich Attendance] Adding realistic PostgreSQL attendance records for Rahul Sharma and active staff...');

  try {
    // 1. Get Rahul Sharma
    const rahulRes = await db.query("SELECT id FROM employees WHERE first_name = 'Rahul' AND last_name = 'Sharma'");
    if (rahulRes.rows.length === 0) {
      console.log('Rahul not found');
      process.exit(1);
    }
    const rahulId = rahulRes.rows[0].id;

    // Working days for August & September 2026
    const dates = [
      // August 2026 working days (Mon-Fri)
      { date: '2026-08-10', status: 'PRESENT', inH: '09:02', outH: '18:05', hrs: 8.05 },
      { date: '2026-08-11', status: 'PRESENT', inH: '09:00', outH: '18:00', hrs: 8.00 },
      { date: '2026-08-12', status: 'PRESENT', inH: '08:58', outH: '18:02', hrs: 8.07 },
      { date: '2026-08-13', status: 'PRESENT', inH: '09:05', outH: '18:10', hrs: 8.08 },
      { date: '2026-08-14', status: 'PRESENT', inH: '09:00', outH: '17:30', hrs: 7.50 },
      { date: '2026-08-17', status: 'PRESENT', inH: '09:04', outH: '18:05', hrs: 8.02 },
      { date: '2026-08-18', status: 'PRESENT', inH: '09:00', outH: '18:00', hrs: 8.00 },
      { date: '2026-08-19', status: 'LATE',    inH: '09:35', outH: '18:35', hrs: 8.00, notes: 'Traffic delay on Outer Ring Road' },
      { date: '2026-08-20', status: 'PRESENT', inH: '08:55', outH: '18:00', hrs: 8.08 },
      { date: '2026-08-21', status: 'PRESENT', inH: '09:00', outH: '18:00', hrs: 8.00 },
      { date: '2026-08-24', status: 'PRESENT', inH: '09:02', outH: '18:05', hrs: 8.05 },
      { date: '2026-08-25', status: 'HALF_DAY',inH: '09:00', outH: '13:30', hrs: 4.50, notes: 'Approved half-day afternoon dental appointment' },
      { date: '2026-08-26', status: 'PRESENT', inH: '09:00', outH: '18:00', hrs: 8.00 },
      { date: '2026-08-27', status: 'PRESENT', inH: '08:57', outH: '18:03', hrs: 8.10 },
      { date: '2026-08-28', status: 'PRESENT', inH: '09:01', outH: '18:00', hrs: 8.00 },
      { date: '2026-08-31', status: 'PRESENT', inH: '09:05', outH: '18:05', hrs: 8.00 },
      // September 2026 working days
      { date: '2026-09-01', status: 'PRESENT', inH: '09:00', outH: '18:00', hrs: 8.00 },
      { date: '2026-09-02', status: 'PRESENT', inH: '09:03', outH: '18:05', hrs: 8.03 },
      { date: '2026-09-03', status: 'PRESENT', inH: '09:00', outH: '18:02', hrs: 8.03 },
      { date: '2026-09-04', status: 'LATE',    inH: '09:42', outH: '18:42', hrs: 8.00, notes: 'Reception badge sync discrepancy (Concern CON-1001)' },
    ];

    for (const d of dates) {
      const clockIn = `${d.date}T${d.inH}:00+05:30`;
      const clockOut = `${d.date}T${d.outH}:00+05:30`;

      await db.query(`
        INSERT INTO attendance (employee_id, date, clock_in, clock_out, total_hours, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (employee_id, date) 
        DO UPDATE SET 
          clock_in = EXCLUDED.clock_in,
          clock_out = EXCLUDED.clock_out,
          total_hours = EXCLUDED.total_hours,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes;
      `, [rahulId, d.date, clockIn, clockOut, d.hrs, d.status, d.notes || null]);
    }

    console.log(`[Seed Rich Attendance] ✅ Upserted ${dates.length} authoritative attendance records for Rahul Sharma into PostgreSQL.`);
    process.exit(0);
  } catch (err) {
    console.error('[Seed Rich Attendance Error]:', err);
    process.exit(1);
  }
}

seedRichAttendance();
