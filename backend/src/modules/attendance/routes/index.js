const express = require('express');
const router = express.Router();
const controllers = require('../controllers');

/**
 * Attendance Route Definitions
 * Owner: P2 (HR Operations)
 */

router.get('/', controllers.getAttendance);
router.get('/:id', controllers.getAttendanceById);
router.post('/', controllers.recordAttendance);
router.patch('/:id', controllers.updateAttendance);

module.exports = router;
