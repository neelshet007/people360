const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers');
const { authenticate, authorize } = require('../../../middleware/authMiddleware');

/**
 * Working Schedules Routes
 * Owner: P1 (Core HR)
 * Protected by Centralized RBAC
 */

router.get('/', authenticate, authorize('schedules.read'), scheduleController.getSchedules);
router.get('/:id', authenticate, authorize('schedules.read'), scheduleController.getScheduleById);
router.post('/', authenticate, authorize('schedules.write'), scheduleController.createSchedule);
router.put('/:id', authenticate, authorize('schedules.write'), scheduleController.updateSchedule);
router.patch('/:id', authenticate, authorize('schedules.write'), scheduleController.updateSchedule);
router.delete('/:id', authenticate, authorize('schedules.write'), scheduleController.deleteSchedule);

module.exports = router;
