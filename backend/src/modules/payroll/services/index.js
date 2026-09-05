const payrollRepository = require('../repositories/payrollRepository');
const ApiError = require('../../../utils/ApiError');

/**
 * Payroll Service Layer
 * Owner: P3 (Payroll)
 * Foundation business logic and preparation services
 */
const payrollService = {
  /**
   * Get overall P3 Payroll module status & infrastructure check
   */
  async getStatus() {
    const dbConnection = await payrollRepository.checkConnection();
    const dbTables = await payrollRepository.checkTablesExist();

    return {
      module: 'payroll',
      owner: 'P3',
      phase: 3,
      status: 'active',
      infrastructure: {
        databaseConnection: dbConnection.connected,
        tablesConfigured: dbTables.configured,
        tablesFound: dbTables.foundTables || [],
      },
    };
  },

  // ---------------------------------------------------------------------------
  // SALARY STRUCTURES
  // ---------------------------------------------------------------------------
  async getSalaryStructures(query = {}) {
    const isActive = query.is_active !== undefined ? query.is_active === 'true' : undefined;
    return payrollRepository.findStructures({ is_active: isActive });
  },

  async getSalaryStructureById(id) {
    const structure = await payrollRepository.findStructureById(id);
    if (!structure) {
      throw ApiError.notFound(`Salary structure with ID '${id}' not found`);
    }
    const rules = await payrollRepository.findRules({ salary_structure_id: id });
    return {
      ...structure,
      rules,
    };
  },

  async createSalaryStructure(data) {
    if (!data.name || !data.code) {
      throw ApiError.badRequest('Salary structure name and code are required');
    }
    return payrollRepository.createStructure(data);
  },

  // ---------------------------------------------------------------------------
  // SALARY RULES
  // ---------------------------------------------------------------------------
  async getSalaryRules(query = {}) {
    return payrollRepository.findRules({
      salary_structure_id: query.salary_structure_id,
      category: query.category,
    });
  },

  async getSalaryRuleById(id) {
    const rule = await payrollRepository.findRuleById(id);
    if (!rule) {
      throw ApiError.notFound(`Salary rule with ID '${id}' not found`);
    }
    return rule;
  },

  // ---------------------------------------------------------------------------
  // PAYRUNS
  // ---------------------------------------------------------------------------
  async getPayruns(query = {}) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const status = query.status;

    const [data, total] = await Promise.all([
      payrollRepository.findPayruns({ status, page, limit }),
      payrollRepository.countPayruns({ status }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getPayrunById(id) {
    const payrun = await payrollRepository.findPayrunById(id);
    if (!payrun) {
      throw ApiError.notFound(`Payrun batch with ID '${id}' not found`);
    }
    const payslips = await payrollRepository.findPayslips({ payrun_id: id, limit: 50 });
    return {
      ...payrun,
      payslips,
    };
  },

  async createPayrun(data) {
    if (!data.name || !data.pay_period_start || !data.pay_period_end) {
      throw ApiError.badRequest('Payrun name, start date, and end date are required');
    }
    return payrollRepository.createPayrun(data);
  },

  // ---------------------------------------------------------------------------
  // PAYSLIPS
  // ---------------------------------------------------------------------------
  async getPayslips(query = {}) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const { payrun_id, employee_id, status } = query;

    const [data, total] = await Promise.all([
      payrollRepository.findPayslips({ payrun_id, employee_id, status, page, limit }),
      payrollRepository.countPayslips({ payrun_id, employee_id, status }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getPayslipById(id) {
    const payslip = await payrollRepository.findPayslipById(id);
    if (!payslip) {
      throw ApiError.notFound(`Payslip with ID '${id}' not found`);
    }
    return payslip;
  },
};

module.exports = payrollService;
