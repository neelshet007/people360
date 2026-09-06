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

    const hrOpsMigration = path.resolve(__dirname, '../../../database/migrations/003_create_hr_operations.sql');
    if (fs.existsSync(hrOpsMigration)) {
      const hrOpsSql = fs.readFileSync(hrOpsMigration, 'utf8');
      console.log('[Migration] Executing 003_create_hr_operations.sql...');
      await db.query(hrOpsSql);
      console.log('[Migration] ✅ HR Operations tables and indexes created successfully.');
    }

    const contractsSchedMigration = path.resolve(__dirname, '../../../database/migrations/004_create_contracts_schedules.sql');
    if (fs.existsSync(contractsSchedMigration)) {
      const contractsSchedSql = fs.readFileSync(contractsSchedMigration, 'utf8');
      console.log('[Migration] Executing 004_create_contracts_schedules.sql...');
      await db.query(contractsSchedSql);
      console.log('[Migration] ✅ Contracts and Working Schedules tables created successfully.');
    }

    const attendancePhase5Migration = path.resolve(__dirname, '../../../database/migrations/005_attendance_phase5.sql');
    if (fs.existsSync(attendancePhase5Migration)) {
      const attendancePhase5Sql = fs.readFileSync(attendancePhase5Migration, 'utf8');
      console.log('[Migration] Executing 005_attendance_phase5.sql...');
      await db.query(attendancePhase5Sql);
      console.log('[Migration] ✅ Attendance Phase 5 columns & triggers created successfully.');
    }

    const usersRbacMigration = path.resolve(__dirname, '../../../database/migrations/006_create_users_rbac.sql');
    if (fs.existsSync(usersRbacMigration)) {
      const usersRbacSql = fs.readFileSync(usersRbacMigration, 'utf8');
      console.log('[Migration] Executing 006_create_users_rbac.sql...');
      await db.query(usersRbacSql);
      console.log('[Migration] ✅ Users & RBAC tables created successfully.');
    }

    const salaryConfigMigration = path.resolve(__dirname, '../../../database/migrations/007_salary_configuration.sql');
    if (fs.existsSync(salaryConfigMigration)) {
      const salaryConfigSql = fs.readFileSync(salaryConfigMigration, 'utf8');
      console.log('[Migration] Executing 007_salary_configuration.sql...');
      await db.query(salaryConfigSql);
      console.log('[Migration] ✅ Salary Configuration schema updated successfully.');
    }

    const payrunsPhase7Migration = path.resolve(__dirname, '../../../database/migrations/008_payruns_phase7.sql');
    if (fs.existsSync(payrunsPhase7Migration)) {
      const payrunsPhase7Sql = fs.readFileSync(payrunsPhase7Migration, 'utf8');
      console.log('[Migration] Executing 008_payruns_phase7.sql...');
      await db.query(payrunsPhase7Sql);
      console.log('[Migration] ✅ Payruns Phase 7 schema and lifecycle constraints updated successfully.');
    }

    const concernsMigration = path.resolve(__dirname, '../../../database/migrations/010_create_concerns.sql');
    if (fs.existsSync(concernsMigration)) {
      const concernsSql = fs.readFileSync(concernsMigration, 'utf8');
      console.log('[Migration] Executing 010_create_concerns.sql...');
      await db.query(concernsSql);
      console.log('[Migration] ✅ Concerns Communication schema updated successfully.');
    }

    const bonusAllocationMigration = path.resolve(__dirname, '../../../database/migrations/011_bonus_allocation.sql');
    if (fs.existsSync(bonusAllocationMigration)) {
      const bonusAllocationSql = fs.readFileSync(bonusAllocationMigration, 'utf8');
      console.log('[Migration] Executing 011_bonus_allocation.sql...');
      await db.query(bonusAllocationSql);
      console.log('[Migration] ✅ Bonus Allocation schema created successfully.');
    }

    const compOffMigration = path.resolve(__dirname, '../../../database/migrations/012_comp_off.sql');
    if (fs.existsSync(compOffMigration)) {
      const compOffSql = fs.readFileSync(compOffMigration, 'utf8');
      console.log('[Migration] Executing 012_comp_off.sql...');
      await db.query(compOffSql);
      console.log('[Migration] ✅ Compensatory Off schema and COMP_OFF leave type created.');
    }

    const timeOffCatMigration = path.resolve(__dirname, '../../../database/migrations/013_time_off_type_catalogue.sql');
    if (fs.existsSync(timeOffCatMigration)) {
      const catSql = fs.readFileSync(timeOffCatMigration, 'utf8');
      console.log('[Migration] Executing 013_time_off_type_catalogue.sql...');
      await db.query(catSql);
      console.log('[Migration] ✅ Time Off Type Catalogue schema and policy rules updated successfully.');
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
