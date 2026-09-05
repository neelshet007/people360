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

    const empMigration = path.resolve(__dirname, '../../../database/migrations/001_create_employees.sql');
    const empSql = fs.readFileSync(empMigration, 'utf8');

    console.log('[Migration] Executing 001_create_employees.sql...');
    await db.query(empSql);
    console.log('[Migration] ✅ Employees table and indexes created successfully.');

    const payrollMigration = path.resolve(__dirname, '../../../database/migrations/002_create_payroll.sql');
    if (fs.existsSync(payrollMigration)) {
      const payrollSql = fs.readFileSync(payrollMigration, 'utf8');
      console.log('[Migration] Executing 002_create_payroll.sql...');
      await db.query(payrollSql);
      console.log('[Migration] ✅ Payroll tables and indexes created successfully.');
    }

    // Check if employee seed data is needed
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

    // Check if payroll seed data is needed
    const structCount = await db.query('SELECT COUNT(*) FROM salary_structures');
    if (parseInt(structCount.rows[0].count, 10) === 0) {
      console.log('[Migration] Seeding initial salary structure & rules...');
      const structRes = await db.query(`
        INSERT INTO salary_structures (name, code, description, is_active)
        VALUES ('Standard Full-Time Compensation', 'STRUC-FULLTIME', 'Default salary structure for regular salaried employees', true)
        RETURNING id;
      `);
      const structId = structRes.rows[0].id;

      await db.query(`
        INSERT INTO salary_rules (salary_structure_id, name, code, category, calculation_type, amount_or_rate, sequence_order)
        VALUES 
        ('${structId}', 'Basic Salary', 'BASIC', 'ALLOWANCE', 'FIXED', 4500.00, 1),
        ('${structId}', 'Housing Allowance', 'HRA', 'ALLOWANCE', 'PERCENTAGE', 0.20, 2),
        ('${structId}', 'Health & Social Insurance', 'INS_DEDUCT', 'DEDUCTION', 'PERCENTAGE', 0.05, 3)
      `);
      console.log('[Migration] ✅ Sample salary structure and rules inserted.');
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
