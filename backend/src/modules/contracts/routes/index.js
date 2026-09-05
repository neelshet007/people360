const express = require('express');
const router = express.Router();
const contractController = require('../controllers');

/**
 * Contracts Routes
 * Owner: P1 (Core HR)
 */

router.get('/', contractController.getContracts);
router.get('/active', contractController.getActiveContract);
router.get('/:id', contractController.getContractById);
router.post('/', contractController.createContract);
router.put('/:id', contractController.updateContract);
router.patch('/:id', contractController.updateContract);
router.delete('/:id', contractController.deleteContract);

module.exports = router;
