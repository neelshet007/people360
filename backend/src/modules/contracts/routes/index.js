const express = require('express');
const router = express.Router();
const contractController = require('../controllers');
const { authenticate, authorize } = require('../../../middleware/authMiddleware');

/**
 * Contracts Routes
 * Owner: P1 (Core HR)
 * Protected by Centralized RBAC
 */

router.get('/', authenticate, authorize('contracts.read'), contractController.getContracts);
router.get('/active', authenticate, authorize('contracts.read'), contractController.getActiveContract);
router.get('/:id', authenticate, authorize('contracts.read'), contractController.getContractById);
router.post('/', authenticate, authorize('contracts.write'), contractController.createContract);
router.put('/:id', authenticate, authorize('contracts.write'), contractController.updateContract);
router.patch('/:id', authenticate, authorize('contracts.write'), contractController.updateContract);
router.delete('/:id', authenticate, authorize('contracts.write'), contractController.deleteContract);

module.exports = router;
