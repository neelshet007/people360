const express = require('express');
const router = express.Router();
const controllers = require('../controllers');
const { authenticate, authorize } = require('../../../middleware/authMiddleware');

/**
 * Time Off Route Definitions
 * Owner: P2 (HR Operations)
 * Protected with Centralized RBAC
 */

// Types
router.get('/types', authenticate, controllers.getTypes);
router.post('/types', authenticate, authorize('timeoff.write'), controllers.createType);

// Allocations
router.get('/allocations', authenticate, controllers.getAllocations);
router.post('/allocations', authenticate, authorize('timeoff.write'), controllers.createAllocation);

// Requests
router.get('/requests', authenticate, controllers.getRequests);
router.get('/requests/:id', authenticate, controllers.getRequestById);
router.post('/requests', authenticate, controllers.createRequest);
router.patch('/requests/:id', authenticate, authorize('timeoff.approve'), controllers.updateRequestStatus);

module.exports = router;
