const express = require('express');
const router = express.Router();
const controllers = require('../controllers');
const validators = require('../validators');
const { authenticate, authorize } = require('../../../middleware/authMiddleware');

/**
 * Payroll Route Definitions
 * Owner: P3 (Payroll)
 * Protected with Centralized RBAC
 */

// Module Status & Health
router.get('/status', authenticate, controllers.getPayrollStatus);

// Salary Structures
router.get('/salary-structures', authenticate, authorize('salary.read'), controllers.getSalaryStructures);
router.get('/salary-structures/:id', authenticate, authorize('salary.read'), controllers.getSalaryStructureById);
router.post('/salary-structures', authenticate, authorize('salary.manage'), controllers.createSalaryStructure);
router.put('/salary-structures/:id', authenticate, authorize('salary.manage'), controllers.updateSalaryStructure);
router.delete('/salary-structures/:id', authenticate, authorize('salary.manage'), controllers.deleteSalaryStructure);

// Salary Rules
router.get('/salary-rules', authenticate, authorize('salary.read'), controllers.getSalaryRules);
router.get('/salary-rules/:id', authenticate, authorize('salary.read'), controllers.getSalaryRuleById);
router.post('/salary-rules', authenticate, authorize('salary.manage'), controllers.createSalaryRule);
router.put('/salary-rules/:id', authenticate, authorize('salary.manage'), controllers.updateSalaryRule);
router.delete('/salary-rules/:id', authenticate, authorize('salary.manage'), controllers.deleteSalaryRule);
router.post('/salary-rules/reorder', authenticate, authorize('salary.manage'), controllers.reorderSalaryRules);

// Salary Calculation Engine
router.post('/salary/calculate', authenticate, authorize('salary.read'), controllers.calculateSalary);

// Payruns
router.get('/payruns', authenticate, authorize('payruns.read'), validators.validatePagination, controllers.getPayruns);
router.get('/payruns/:id', authenticate, authorize('payruns.read'), controllers.getPayrunById);
router.post('/payruns', authenticate, authorize('payruns.write'), controllers.createPayrun);

// Payslips (Employees can read payslips filtered to their own record)
router.get('/payslips', authenticate, validators.validatePagination, controllers.getPayslips);
router.get('/payslips/:id', authenticate, controllers.getPayslipById);

module.exports = router;
