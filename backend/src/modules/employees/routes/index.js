const express = require('express');
const router = express.Router();
const employeeController = require('../controllers');
const contractController = require('../../contracts/controllers');
const { authenticate, authorize, authorizeEmployeeSelfOrPermission, checkEmployeeOwnership } = require('../../../middleware/authMiddleware');


/**
 * Employees Module Routes
 * Owner: P1 (Core HR)
 * Protected by Centralized RBAC and Employee Data Isolation Guard
 */

router.get('/', authenticate, authorize('employees.read'), employeeController.getEmployees);
router.get('/:id', authenticate, authorizeEmployeeSelfOrPermission('employees.read', 'id'), employeeController.getEmployeeById);
router.post('/', authenticate, authorize('employees.write'), employeeController.createEmployee);
router.put('/:id', authenticate, authorize('employees.write'), employeeController.updateEmployee);

router.patch('/:id', authenticate, authorize('employees.write'), employeeController.updateEmployee);
router.delete('/:id', authenticate, authorize('employees.write'), employeeController.deleteEmployee);

// Period-specific and historical contract retrieval by Employee
router.get('/:employeeId/contracts/active', authenticate, checkEmployeeOwnership('employeeId'), (req, res, next) => {
  req.query.employee_id = req.params.employeeId;
  return contractController.getActiveContract(req, res, next);
});

router.get('/:employeeId/contracts', authenticate, checkEmployeeOwnership('employeeId'), (req, res, next) => {
  req.query.employee_id = req.params.employeeId;
  return contractController.getContracts(req, res, next);
});

module.exports = router;
