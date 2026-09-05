const express = require('express');
const router = express.Router();
const controllers = require('../controllers');
const validators = require('../validators');

/**
 * Payroll Route Definitions
 * Owner: P3 (Payroll)
 * Foundation endpoints for Compensation, Rules, Payruns, and Payslips
 */

// Module Status & Health
router.get('/status', controllers.getPayrollStatus);

// Salary Structures
router.get('/salary-structures', controllers.getSalaryStructures);
router.get('/salary-structures/:id', controllers.getSalaryStructureById);
router.post('/salary-structures', controllers.createSalaryStructure);

// Salary Rules
router.get('/salary-rules', controllers.getSalaryRules);
router.get('/salary-rules/:id', controllers.getSalaryRuleById);

// Payruns
router.get('/payruns', validators.validatePagination, controllers.getPayruns);
router.get('/payruns/:id', controllers.getPayrunById);
router.post('/payruns', controllers.createPayrun);

// Payslips
router.get('/payslips', validators.validatePagination, controllers.getPayslips);
router.get('/payslips/:id', controllers.getPayslipById);

module.exports = router;
