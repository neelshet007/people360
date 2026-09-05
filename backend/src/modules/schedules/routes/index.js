const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers');

/**
 * Working Schedules Routes
 * Owner: P1 (Core HR)
 */

router.get('/', scheduleController.getSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', scheduleController.createSchedule);
router.put('/:id', scheduleController.updateSchedule);
router.patch('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;
