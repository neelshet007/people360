const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../../config');
const db = require('../../database/db');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const { authenticate, requireRole } = require('../../middleware/authMiddleware');
const { verifyPassword } = require('../../utils/passwordHelper');
const { getRolePermissions, ROLES } = require('../../utils/rbac');

/**
 * Centralized Authentication & User Identity Routes
 * Owner: Shared Application Foundation
 */

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 'Email and password are required', 'INVALID_INPUT', [], 400);
  }

  try {
    const userRes = await db.query(`
      SELECT 
        u.id, u.email, u.password_hash, u.name, u.role, u.employee_id, u.status,
        e.first_name, e.last_name, e.display_name as emp_name, e.department, e.designation
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE LOWER(u.email) = LOWER($1)
      LIMIT 1;
    `, [email]);

    if (userRes.rows.length === 0) {
      return errorResponse(res, 'Invalid credentials. No account matches this email.', 'UNAUTHORIZED', [], 401);
    }

    const user = userRes.rows[0];

    if (user.status !== 'ACTIVE') {
      return errorResponse(res, 'Account is inactive or suspended. Please contact administrator.', 'FORBIDDEN', [], 403);
    }

    // Verify cryptographic hash
    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return errorResponse(res, 'Invalid password. Please check your credentials.', 'UNAUTHORIZED', [], 401);
    }

    // Update last_login timestamp asynchronously
    db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]).catch(() => {});

    const permissions = getRolePermissions(user.role);

    const payload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employee_id,
      department: user.department || null,
      designation: user.designation || null,
      permissions,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn || '24h',
    });

    return successResponse(res, {
      token,
      user: payload,
    }, 'Signed in successfully');
  } catch (err) {
    console.error('[Auth Error] Login failure:', err);
    return errorResponse(res, 'Authentication service error', 'INTERNAL_SERVER_ERROR', [], 500);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const userRes = await db.query(`
      SELECT 
        u.id, u.email, u.name, u.role, u.employee_id, u.status, u.last_login,
        e.employee_code, e.department, e.designation
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE u.id = $1
    `, [req.user.id]);

    if (userRes.rows.length === 0) {
      return successResponse(res, req.user);
    }

    const user = userRes.rows[0];
    const fullUser = {
      ...req.user,
      ...user,
      permissions: getRolePermissions(user.role),
    };

    return successResponse(res, fullUser);
  } catch (err) {
    return successResponse(res, req.user);
  }
});

// GET /api/auth/demo-accounts — Helper for hackathon judges & testers
router.get('/demo-accounts', (req, res) => {
  const demoAccounts = [
    {
      role: ROLES.ADMIN,
      email: 'admin@peoplepay360.demo',
      name: 'System Administrator',
      description: 'Full administrative access across users, system configs, HR, and Payroll',
    },
    {
      role: ROLES.HR_MANAGER,
      email: 'hr.manager@peoplepay360.demo',
      name: 'Ananya Iyer (HR Manager)',
      description: 'Core HR, Contracts, Attendance, and Leave Approvals. Payroll modification restricted.',
    },
    {
      role: ROLES.HR_PAYROLL_USER,
      email: 'payroll.user@peoplepay360.demo',
      name: 'Sneha Kulkarni (Payroll User)',
      description: 'Payrun batch executions, payslips, and view-only salary structures.',
    },
    {
      role: ROLES.HR_PAYROLL_MANAGER,
      email: 'payroll.manager@peoplepay360.demo',
      name: 'Vikram Singh (Payroll Manager)',
      description: 'Full HR and Payroll control including Salary Structures and Rules.',
    },
    {
      role: ROLES.EMPLOYEE,
      email: 'employee@peoplepay360.demo',
      name: 'Rahul Sharma (Employee)',
      description: 'Self-service portal: My Profile, Clock-in/out, Leave Requests, and My Payslips.',
    },
  ];

  return successResponse(res, demoAccounts);
});

// GET /api/auth/users — Admin only user management
router.get('/users', authenticate, requireRole(ROLES.ADMIN), async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, u.email, u.name, u.role, u.status, u.last_login, u.created_at,
        e.employee_code, e.first_name, e.last_name, e.department, e.designation
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      ORDER BY u.created_at ASC;
    `);

    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
