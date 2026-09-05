/**
 * Payroll Service Layer
 * Owner: P3 (Payroll)
 * Foundation Phase 1 service definitions
 */

const payrollRepository = require('../repositories/payrollRepository');

const payrollService = {
  /**
   * Get overall P3 Payroll module foundation status
   */
  async getStatus() {
    const dbConnection = await payrollRepository.checkConnection();
    const dbTables = await payrollRepository.checkTablesExist();

    return {
      module: 'payroll',
      owner: 'P3',
      phase: 1,
      status: 'active',
      infrastructure: {
        databaseConnection: dbConnection.connected,
        tablesConfigured: dbTables.configured,
        tablesFound: dbTables.foundTables || [],
      },
    };
  },
};

module.exports = payrollService;
