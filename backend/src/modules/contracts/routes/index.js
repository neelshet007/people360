const express = require('express');
const router = express.Router();
const contractController = require('../controllers');
const { authenticate, authorize, authorizeEmployeeSelfOrPermission } = require('../../../middleware/authMiddleware');

/**
 * Contracts Routes
 * Owner: P1 (Core HR)
 * Protected by Centralized RBAC
 */

router.get('/', authenticate, authorizeEmployeeSelfOrPermission('contracts.read', 'employee_id'), contractController.getContracts);
router.get('/active', authenticate, authorizeEmployeeSelfOrPermission('contracts.read', 'employee_id'), contractController.getActiveContract);
router.get('/:id', authenticate, (req, res, next) => {
  if (req.user.role === 'ADMIN' || req.user.role === 'HR_MANAGER' || req.user.role === 'HR_PAYROLL_MANAGER' || req.user.role === 'HR_PAYROLL_USER' || req.user.role === 'EMPLOYEE') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access forbidden' });
}, contractController.getContractById);

router.post('/', authenticate, authorize('contracts.write'), contractController.createContract);
router.put('/:id', authenticate, authorize('contracts.write'), contractController.updateContract);
router.patch('/:id', authenticate, authorize('contracts.write'), contractController.updateContract);
router.delete('/:id', authenticate, authorize('contracts.write'), contractController.deleteContract);

module.exports = router;
