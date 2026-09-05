/**
 * Payroll Input Validators
 * Owner: P3 (Payroll)
 * Validator middleware helpers for Payroll module
 */

const ApiError = require('../../../utils/ApiError');

const payrollValidators = {
  /**
   * Helper validator for standard pagination parameters
   */
  validatePagination(req, res, next) {
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;

    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
      return next(
        ApiError.badRequest('Invalid pagination parameters', [
          'page and limit query parameters must be positive integers',
        ])
      );
    }

    req.pagination = { page, limit };
    next();
  },
};

module.exports = payrollValidators;
