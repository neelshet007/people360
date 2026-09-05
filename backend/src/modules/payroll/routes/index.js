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
router.post('/payruns/eligibility', authenticate, authorize('payruns.read'), controllers.checkEligibility);
router.get('/payruns/:id', authenticate, authorize('payruns.read'), controllers.getPayrunById);
router.post('/payruns', authenticate, authorize('payruns.write'), controllers.createPayrun);
router.post('/payruns/:id/compute', authenticate, authorize('payruns.write'), controllers.computePayrun);
router.post('/payruns/:id/validate', authenticate, authorize('payruns.write'), controllers.validatePayrun);
router.post('/payruns/:id/pay', authenticate, authorize('payruns.write'), controllers.markPayrunPaid);
router.post('/payruns/:id/email-payslips', authenticate, authorize('payruns.write'), controllers.emailPayrunPayslips);

// Payslips (Employees can read and download payslips filtered to their own record)
router.get('/payslips', authenticate, validators.validatePagination, controllers.getPayslips);
router.get('/payslips/:id', authenticate, controllers.getPayslipById);
router.get('/payslips/:id/pdf', authenticate, controllers.downloadPayslipPdf);

// ---------------------------------------------------------------------------
// BONUS ALLOCATION ROUTES
// ---------------------------------------------------------------------------
// List all bonus cycles (HR/Payroll only)
router.get('/bonus/cycles', authenticate, authorize('payruns.read'), controllers.listBonusCycles);
// Create a new bonus cycle
router.post('/bonus/cycles', authenticate, authorize('payruns.write'), controllers.createBonusCycle);
// Get full detail (allocations + totals) for one bonus cycle
router.get('/bonus/cycles/:id', authenticate, authorize('payruns.read'), controllers.getBonusCycleDetail);
// Approve the whole cycle (triggers compute)
router.post('/bonus/cycles/:id/approve', authenticate, authorize('payruns.write'), controllers.approveBonusCycle);
// Disburse (mark paid) a computed bonus cycle
router.post('/bonus/cycles/:id/disburse', authenticate, authorize('payruns.write'), controllers.disburseBonusCycle);
// Update individual allocation (amount, remarks)
router.put('/bonus/cycles/:id/allocations/:allocId', authenticate, authorize('payruns.write'), controllers.updateBonusAllocation);
// Reject individual allocation
router.post('/bonus/cycles/:id/allocations/:allocId/reject', authenticate, authorize('payruns.write'), controllers.rejectBonusAllocation);

module.exports = router;
