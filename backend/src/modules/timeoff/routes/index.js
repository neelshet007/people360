const express = require('express');
const router = express.Router();
const controllers = require('../controllers');

/**
 * Time Off Route Definitions
 * Owner: P2 (HR Operations)
 */

// Types
router.get('/types', controllers.getTypes);
router.post('/types', controllers.createType);

// Allocations
router.get('/allocations', controllers.getAllocations);
router.post('/allocations', controllers.createAllocation);

// Requests
router.get('/requests', controllers.getRequests);
router.get('/requests/:id', controllers.getRequestById);
router.post('/requests', controllers.createRequest);
router.patch('/requests/:id', controllers.updateRequestStatus);

module.exports = router;
