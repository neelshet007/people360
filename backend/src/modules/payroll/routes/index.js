/**
 * Payroll Route Definitions
 * Owner: P3 (Payroll)
 * Exposes endpoints for Phase 1 P3 Payroll foundation
 */
const express = require('express');
const router = express.Router();
const controllers = require('../controllers');

router.get('/status', controllers.getPayrollStatus);

module.exports = router;
