/**
 * Payroll Repository Layer
 * Owner: P3 (Payroll)
 * Handles SQL interaction with P3 PostgreSQL database tables
 */
const db = require('../../../config/db');

const payrollRepository = {
  /**
   * Health & Database Connectivity Check
   */
  async checkConnection() {
    try {
      const result = await db.query('SELECT NOW() as db_time');
      return {
        connected: true,
        dbTime: result.rows[0].db_time,
      };
    } catch (err) {
      return {
        connected: false,
        error: err.message,
      };
    }
  },

  /**
   * Check if P3 tables exist in current database schema
   */
  async checkTablesExist() {
    try {
      const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('salary_structures', 'salary_rules', 'payruns', 'payslips', 'payslip_lines');
      `;
      const result = await db.query(query);
      const foundTables = result.rows.map((r) => r.table_name);
      return {
        configured: foundTables.length === 5,
        foundTables,
      };
    } catch (err) {
      return {
        configured: false,
        error: err.message,
      };
    }
  },
};

module.exports = payrollRepository;
