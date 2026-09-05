const express = require('express');
const router = express.Router();
const employeeController = require('../controllers');
const contractController = require('../../contracts/controllers');

/**
 * Employees Module Routes
 * Owner: P1 (Core HR)
 */

router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.patch('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

// Period-specific and historical contract retrieval by Employee
router.get('/:employeeId/contracts/active', (req, res, next) => {
  req.query.employee_id = req.params.employeeId;
  return contractController.getActiveContract(req, res, next);
});

router.get('/:employeeId/contracts', (req, res, next) => {
  req.query.employee_id = req.params.employeeId;
  return contractController.getContracts(req, res, next);
});

module.exports = router;

