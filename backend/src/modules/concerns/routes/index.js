const express = require('express');
const router = express.Router();
const concernController = require('../controllers/concernController');
const { authenticate, authorize } = require('../../../middleware/authMiddleware');

/**
 * Concern Communication Express Router
 * Base Path: /api/concerns
 */

// Metrics summary counters
router.get('/metrics', authenticate, (req, res, next) => concernController.getMetrics(req, res, next));

// List concerns (with role isolation and filters)
router.get('/', authenticate, (req, res, next) => concernController.listConcerns(req, res, next));

// Single concern detail with conversation & history
router.get('/:id', authenticate, (req, res, next) => concernController.getConcernDetail(req, res, next));

// Create a new concern (Employees for self, HR for any employee)
router.post('/', authenticate, (req, res, next) => concernController.createConcern(req, res, next));

// Add message or internal note to concern conversation
router.post('/:id/messages', authenticate, (req, res, next) => concernController.addMessage(req, res, next));

// Update concern lifecycle status (state machine validated)
router.patch('/:id/status', authenticate, (req, res, next) => concernController.updateStatus(req, res, next));

// Assign concern to an HR/Payroll user
router.post('/:id/assign', authenticate, authorize('concerns.assign'), (req, res, next) => concernController.assign(req, res, next));

module.exports = router;
