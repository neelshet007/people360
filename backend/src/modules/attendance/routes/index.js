const express = require('express');
const router = express.Router();
const controllers = require('../controllers');
const { authenticate, requireRole } = require('../../../middleware/authMiddleware');

/**
 * Attendance Route Definitions — Phase 5
 * Owner: P2 (HR Operations)
 *
 * Employee endpoints (any authenticated user with employeeId):
 *   POST   /check-in    — employee checks in
 *   POST   /check-out   — employee checks out
 *   GET    /active      — get active attendance state
 *   GET    /me          — employee's own history
 *
 * HR endpoints (HR_ADMIN, ADMIN only):
 *   GET    /            — list all attendance (with filters)
 *   POST   /            — manual attendance log
 *   GET    /:id         — get single record
 *   PATCH  /:id         — HR manual correction
 */

// Employee self-service routes
router.post('/check-in', authenticate, controllers.checkIn);
router.post('/check-out', authenticate, controllers.checkOut);
router.get('/active', authenticate, controllers.getActive);
router.get('/me', authenticate, controllers.getMyHistory);

// HR management routes — must be declared before /:id
router.get('/', authenticate, requireRole('HR_ADMIN', 'ADMIN'), controllers.getAttendance);
router.post('/', authenticate, requireRole('HR_ADMIN', 'ADMIN'), controllers.recordAttendance);
router.get('/:id', authenticate, controllers.getAttendanceById);
router.patch('/:id', authenticate, requireRole('HR_ADMIN', 'ADMIN'), controllers.correctAttendance);

module.exports = router;
