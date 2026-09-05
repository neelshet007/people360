const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

const { authenticate } = require('../../../middleware/authMiddleware');

// GET /api/dashboard/stats
router.get('/stats', authenticate, dashboardController.getStats);

module.exports = router;
