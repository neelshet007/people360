/**
 * Payroll Controller
 * Owner: P3 (Payroll)
 * Handles HTTP requests for P3 Payroll module foundation
 */

const payrollService = require('../services');
const { successResponse } = require('../../../utils/responseHelper');

const getPayrollStatus = async (req, res, next) => {
  try {
    const status = await payrollService.getStatus();
    return successResponse(res, status);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayrollStatus,
};
