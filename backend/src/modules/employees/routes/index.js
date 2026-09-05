const express = require('express');
const router = express.Router();
const employeeController = require('../controllers');

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

module.exports = router;
