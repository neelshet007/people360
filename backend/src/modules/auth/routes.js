const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../../config');
const db = require('../../database/db');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const { authenticate } = require('../../middleware/authMiddleware');

/**
 * Auth Routes — Phase 5
 * POST /api/auth/login  — email-based login, returns JWT
 * GET  /api/auth/me     — returns decoded current user info
 */

// In-memory demo users (fallback when DB not connected)
const DEMO_USERS = [
  {
    userId: 'demo-hr-1',
    employeeId: null,
    email: 'admin@peoplepay360.com',
    password: 'password',
    role: 'HR_ADMIN',
    name: 'HR Admin',
  },
  {
    userId: 'demo-emp-1',
    employeeId: 'emp-rahul-demo',
    email: 'rahul@company.com',
    password: 'password',
    role: 'EMPLOYEE',
    name: 'Rahul Sharma',
  },
];

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return errorResponse(res, 'Email is required', 'INVALID_INPUT', [], 400);
  }

  try {
    // Try DB-based employee lookup
    const isLive = await db.testConnection();
    if (isLive) {
      const result = await db.query(
        `SELECT id, first_name, last_name, display_name, email, department, designation, status
         FROM employees WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [email]
      );

      if (result.rows.length > 0) {
        const emp = result.rows[0];
        if (emp.status !== 'ACTIVE') {
          return errorResponse(res, 'Employee account is not active', 'FORBIDDEN', [], 403);
        }

        // Determine role from department/designation (HR departments get HR_ADMIN)
        const dept = (emp.department || '').toUpperCase();
        const role = (dept.includes('HR') || dept.includes('HUMAN RESOURCE') || dept.includes('ADMIN'))
          ? 'HR_ADMIN'
          : 'EMPLOYEE';

        const payload = {
          userId: emp.id,
          employeeId: emp.id,
          email: emp.email,
          role,
          name: emp.display_name || `${emp.first_name} ${emp.last_name}`,
        };

        const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

        return successResponse(res, { token, user: payload });
      }
    }
  } catch (err) {
    console.warn('[Auth] DB lookup failed, falling back to demo users:', err.message);
  }

  // Fallback to demo users
  const demoUser = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!demoUser) {
    return errorResponse(res, 'No account found with this email address', 'NOT_FOUND', [], 404);
  }
  if (password && demoUser.password && demoUser.password !== password) {
    return errorResponse(res, 'Invalid password', 'UNAUTHORIZED', [], 401);
  }

  const payload = {
    userId: demoUser.userId,
    employeeId: demoUser.employeeId,
    email: demoUser.email,
    role: demoUser.role,
    name: demoUser.name,
  };

  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  return successResponse(res, { token, user: payload });
});

router.get('/me', authenticate, (req, res) => {
  return successResponse(res, req.user);
});

module.exports = router;
