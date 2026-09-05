const express = require('express');
const router = express.Router();
const controllers = require('../controllers');
const { authenticate, authorize } = require('../../../middleware/authMiddleware');

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
 * HR endpoints (HR_MANAGER, HR_PAYROLL_MANAGER, ADMIN):
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
router.get('/', authenticate, authorize('attendance.read'), controllers.getAttendance);
router.post('/', authenticate, authorize('attendance.write'), controllers.recordAttendance);
router.get('/:id', authenticate, authorize('attendance.read'), controllers.getAttendanceById);
router.patch('/:id', authenticate, authorize('attendance.write'), controllers.correctAttendance);

module.exports = router;

