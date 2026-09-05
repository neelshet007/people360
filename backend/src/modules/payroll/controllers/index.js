const payrollService = require('../services');
const { successResponse } = require('../../../utils/responseHelper');

/**
 * Payroll Controller
 * Owner: P3 (Payroll)
 * Handles HTTP requests for P3 Payroll module foundation
 */

const getPayrollStatus = async (req, res, next) => {
  try {
    const status = await payrollService.getStatus();
    return successResponse(res, status);
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// SALARY STRUCTURES
// -----------------------------------------------------------------------------
const getSalaryStructures = async (req, res, next) => {
  try {
    const structures = await payrollService.getSalaryStructures(req.query);
    return successResponse(res, structures);
  } catch (error) {
    next(error);
  }
};

const getSalaryStructureById = async (req, res, next) => {
  try {
    const structure = await payrollService.getSalaryStructureById(req.params.id);
    return successResponse(res, structure);
  } catch (error) {
    next(error);
  }
};

const createSalaryStructure = async (req, res, next) => {
  try {
    const structure = await payrollService.createSalaryStructure(req.body);
    return successResponse(res, structure, null, 201);
  } catch (error) {
    next(error);
  }
};

const updateSalaryStructure = async (req, res, next) => {
  try {
    const structure = await payrollService.updateSalaryStructure(req.params.id, req.body);
    return successResponse(res, structure);
  } catch (error) {
    next(error);
  }
};

const deleteSalaryStructure = async (req, res, next) => {
  try {
    await payrollService.deleteSalaryStructure(req.params.id);
    return successResponse(res, { message: 'Salary structure deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// SALARY RULES
// -----------------------------------------------------------------------------
const getSalaryRules = async (req, res, next) => {
  try {
    const rules = await payrollService.getSalaryRules(req.query);
    return successResponse(res, rules);
  } catch (error) {
    next(error);
  }
};

const getSalaryRuleById = async (req, res, next) => {
  try {
    const rule = await payrollService.getSalaryRuleById(req.params.id);
    return successResponse(res, rule);
  } catch (error) {
    next(error);
  }
};

const createSalaryRule = async (req, res, next) => {
  try {
    const rule = await payrollService.createSalaryRule(req.body);
    return successResponse(res, rule, null, 201);
  } catch (error) {
    next(error);
  }
};

const updateSalaryRule = async (req, res, next) => {
  try {
    const rule = await payrollService.updateSalaryRule(req.params.id, req.body);
    return successResponse(res, rule);
  } catch (error) {
    next(error);
  }
};

const deleteSalaryRule = async (req, res, next) => {
  try {
    await payrollService.deleteSalaryRule(req.params.id);
    return successResponse(res, { message: 'Salary rule deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const reorderSalaryRules = async (req, res, next) => {
  try {
    await payrollService.reorderSalaryRules(req.body.ruleOrders || req.body);
    return successResponse(res, { message: 'Salary rules reordered successfully' });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// SALARY CALCULATION ENGINE
// -----------------------------------------------------------------------------
const calculateSalary = async (req, res, next) => {
  try {
    const calculation = await payrollService.calculateSalary(req.body);
    return successResponse(res, calculation);
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// PAYRUNS
// -----------------------------------------------------------------------------
const getPayruns = async (req, res, next) => {
  try {
    const result = await payrollService.getPayruns(req.query);
    return successResponse(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getPayrunById = async (req, res, next) => {
  try {
    const payrun = await payrollService.getPayrunById(req.params.id);
    return successResponse(res, payrun);
  } catch (error) {
    next(error);
  }
};

const createPayrun = async (req, res, next) => {
  try {
    const payrun = await payrollService.createPayrun(req.body);
    return successResponse(res, payrun, null, 201);
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// PAYSLIPS
// -----------------------------------------------------------------------------
const getPayslips = async (req, res, next) => {
  try {
    const filters = { ...req.query };
    if (req.user && req.user.role === 'EMPLOYEE' && req.user.employeeId) {
      filters.employee_id = req.user.employeeId;
    }
    const result = await payrollService.getPayslips(filters);
    return successResponse(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getPayslipById = async (req, res, next) => {
  try {
    const payslip = await payrollService.getPayslipById(req.params.id);
    if (req.user && req.user.role === 'EMPLOYEE' && payslip && payslip.employee_id !== req.user.employeeId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You can only view your own payslips.' }
      });
    }
    return successResponse(res, payslip);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayrollStatus,
  getSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
  getSalaryRules,
  getSalaryRuleById,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule,
  reorderSalaryRules,
  calculateSalary,
  getPayruns,
  getPayrunById,
  createPayrun,
  getPayslips,
  getPayslipById,
};
