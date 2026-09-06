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
router.get('/calculate-days', authenticate, controllers.calculateWorkingDays);
router.get('/requests', authenticate, controllers.getRequests);
router.get('/requests/:id', authenticate, controllers.getRequestById);
router.post('/requests', authenticate, controllers.createRequest);
router.patch('/requests/:id', authenticate, authorize('timeoff.approve'), controllers.updateRequestStatus);

// ---------------------------------------------------------------------------
// COMPENSATORY OFF (COMP OFF) ROUTES
// ---------------------------------------------------------------------------
// Comp Off type id (used by frontend when creating COMP_OFF leave requests)
router.get('/comp-off/type', authenticate, controllers.getCompOffTypeId);
// List all comp-off credits (HR sees all, employees see own)
router.get('/comp-off/credits', authenticate, controllers.listCompOffCredits);
// Employee or HR raises a comp-off credit claim
router.post('/comp-off/credits', authenticate, controllers.raiseCreditClaim);
// Get single credit
router.get('/comp-off/credits/:id', authenticate, controllers.getCompOffCreditById);
// HR approves a credit
router.post('/comp-off/credits/:id/approve', authenticate, authorize('timeoff.approve'), controllers.approveCompOffCredit);
// HR rejects a credit
router.post('/comp-off/credits/:id/reject', authenticate, authorize('timeoff.approve'), controllers.rejectCompOffCredit);
// Get employee comp-off balance
router.get('/comp-off/balance/:employeeId', authenticate, controllers.getCompOffBalance);

module.exports = router;
