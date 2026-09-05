const fs = require('fs');
const path = require('path');
const db = require('./db');

/**
 * Migration & Seed Runner
 * Owner: P1 (Core HR)
 */
async function runMigration() {
  console.log('[Migration] Starting PostgreSQL database migrations...');
  try {
    const isConn = await db.testConnection();
    if (!isConn) {
      console.warn('[Migration Warning] Could not connect to PostgreSQL. Please check DATABASE_URL credentials in backend/.env');
      return false;
    }

    const migrationFile = path.resolve(__dirname, '../../../database/migrations/001_create_employees.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('[Migration] Executing 001_create_employees.sql...');
    await db.query(sql);
    console.log('[Migration] ✅ Employees table and indexes created successfully.');

    // Check if seed data is needed
    const countRes = await db.query('SELECT COUNT(*) FROM employees');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      console.log('[Migration] Seeding initial employee records...');
      const seedSql = `
        INSERT INTO employees (
          employee_code, first_name, last_name, display_name, email, phone,
          department, designation, status, date_of_joining
        ) VALUES 
        ('EMP-1001', 'Alex', 'Morgan', 'Alex Morgan', 'alex.morgan@company.com', '+1 555-0101', 'Engineering', 'Lead Software Engineer', 'ACTIVE', '2023-01-15'),
        ('EMP-1002', 'Sarah', 'Chen', 'Sarah Chen', 'sarah.chen@company.com', '+1 555-0102', 'Engineering', 'Senior Frontend Developer', 'ACTIVE', '2023-04-10'),
        ('EMP-1003', 'Marcus', 'Vance', 'Marcus Vance', 'marcus.vance@company.com', '+1 555-0103', 'Human Resources', 'HR Operations Manager', 'ACTIVE', '2022-08-01'),
        ('EMP-1004', 'Elena', 'Rostova', 'Elena Rostova', 'elena.rostova@company.com', '+1 555-0104', 'Finance', 'Senior Payroll Specialist', 'ON_LEAVE', '2023-09-20'),
        ('EMP-1005', 'David', 'Kim', 'David Kim', 'david.kim@company.com', '+1 555-0105', 'Operations', 'DevOps Specialist', 'ACTIVE', '2024-02-01')
        ON CONFLICT (employee_code) DO NOTHING;
      `;
      await db.query(seedSql);
      console.log('[Migration] ✅ Sample employee seed records inserted.');
    }

    return true;
  } catch (error) {
    console.error('[Migration Error]:', error.message);
    return false;
  }
}

if (require.main === module) {
  runMigration().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = runMigration;
