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
    const structures = await payrollRepository.findStructures({ is_active: isActive });
    
    // Attach rule counts
    const enriched = await Promise.all(
      structures.map(async (s) => {
        const rules = await payrollRepository.findRules({ salary_structure_id: s.id });
        return {
          ...s,
          rule_count: rules.length,
        };
      })
    );
    return enriched;
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

  async updateSalaryStructure(id, data) {
    const existing = await payrollRepository.findStructureById(id);
    if (!existing) {
      throw ApiError.notFound(`Salary structure with ID '${id}' not found`);
    }
    return payrollRepository.updateStructure(id, data);
  },

  async deleteSalaryStructure(id) {
    const existing = await payrollRepository.findStructureById(id);
    if (!existing) {
      throw ApiError.notFound(`Salary structure with ID '${id}' not found`);
    }
    return payrollRepository.deleteStructure(id);
  },

  // ---------------------------------------------------------------------------
  // SALARY RULES
  // ---------------------------------------------------------------------------
  async getSalaryRules(query = {}) {
    return payrollRepository.findRules({
      salary_structure_id: query.salary_structure_id,
      category: query.category,
      is_active: query.is_active !== undefined ? query.is_active === 'true' : undefined,
    });
  },

  async getSalaryRuleById(id) {
    const rule = await payrollRepository.findRuleById(id);
    if (!rule) {
      throw ApiError.notFound(`Salary rule with ID '${id}' not found`);
    }
    return rule;
  },

  async createSalaryRule(data) {
    if (!data.salary_structure_id || !data.name || !data.code) {
      throw ApiError.badRequest('Salary structure ID, rule name, and code are required');
    }
    if (!data.calculation_type) {
      throw ApiError.badRequest('Calculation type is required (FIXED, PERCENTAGE, FORMULA)');
    }
    return payrollRepository.createRule(data);
  },

  async updateSalaryRule(id, data) {
    const existing = await payrollRepository.findRuleById(id);
    if (!existing) {
      throw ApiError.notFound(`Salary rule with ID '${id}' not found`);
    }
    return payrollRepository.updateRule(id, data);
  },

  async deleteSalaryRule(id) {
    const existing = await payrollRepository.findRuleById(id);
    if (!existing) {
      throw ApiError.notFound(`Salary rule with ID '${id}' not found`);
    }
    return payrollRepository.deleteRule(id);
  },

  async reorderSalaryRules(ruleOrders) {
    if (!Array.isArray(ruleOrders)) {
      throw ApiError.badRequest('ruleOrders must be an array of { id, sequence_order }');
    }
    return payrollRepository.reorderRules(ruleOrders);
  },

  // ---------------------------------------------------------------------------
  // SALARY CALCULATION ENGINE
  // ---------------------------------------------------------------------------
  async calculateSalary(params) {
    const salaryCalculationService = require('./salaryCalculationService');
    return salaryCalculationService.calculateSalary(params);
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
    const payslips = await payrollRepository.findPayslips({ payrun_id: id, limit: 100 });
    return {
      ...payrun,
      payslips,
    };
  },

  async checkEligibility(params) {
    const payrunService = require('./payrunService');
    return payrunService.checkEligibility(params);
  },

  async createPayrun(data) {
    const payrunService = require('./payrunService');
    return payrunService.createPayrun(data);
  },

  async computePayrun(payrunId) {
    const payrunService = require('./payrunService');
    return payrunService.computePayrun(payrunId);
  },

  async validatePayrun(payrunId) {
    const payrunService = require('./payrunService');
    return payrunService.validatePayrun(payrunId);
  },

  async markPayrunPaid(payrunId, userId) {
    const payrunService = require('./payrunService');
    return payrunService.markPayrunPaid(payrunId, userId);
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

  async emailPayslipsForPayrun(payrunId) {
    const payrunService = require('./payrunService');
    return payrunService.emailPayslipsForPayrun(payrunId);
  },

  async generatePayslipPdf(payslipId) {
    const payslip = await this.getPayslipById(payslipId);
    const { generatePayslipPdfBuffer } = require('./payslipPdfService');
    return {
      payslip,
      buffer: await generatePayslipPdfBuffer(payslip),
    };
  },
};

module.exports = payrollService;
