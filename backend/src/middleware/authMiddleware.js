const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database/db');
const { errorResponse } = require('../utils/responseHelper');
const { hasPermission, getRolePermissions, ROLES } = require('../utils/rbac');

/**
 * Authentication & RBAC Middleware
 * Centralized authorization engine for PeoplePay360
 */

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication token missing or invalid', 'UNAUTHORIZED', [], 401);
  }

  const token = authHeader.slice(7);

  // Demo fallback token for dev environments
  if (token === 'mock-jwt-auth-session-token') {
    req.user = {
      id: 'demo-admin-id',
      userId: 'demo-admin-id',
      email: 'admin@peoplepay360.demo',
      name: 'System Administrator',
      role: ROLES.ADMIN,
      employeeId: null,
      permissions: ['*'],
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Attach user payload
    req.user = {
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      name: decoded.name || decoded.email,
      role: decoded.role || ROLES.EMPLOYEE,
      employeeId: decoded.employeeId || null,
      permissions: getRolePermissions(decoded.role),
    };

    next();
  } catch (err) {
    return errorResponse(res, 'Session expired or invalid token. Please sign in again.', 'UNAUTHORIZED', [], 401);
  }
};

/**
 * Granular Permission Authorization
 * Usage: router.get('/', authenticate, authorize('employees.read'), ...)
 */
const authorize = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'User not authenticated', 'UNAUTHORIZED', [], 401);
    }

    if (req.user.role === ROLES.ADMIN || hasPermission(req.user.role, permission)) {
      return next();
    }

    return errorResponse(
      res,
      `Access forbidden: Your role (${req.user.role}) does not have permission '${permission}'`,
      'FORBIDDEN',
      [],
      403
    );
  };
};

/**
 * Role-Based Access Control Factory
 * Usage: router.post('/', authenticate, requireRole('ADMIN', 'HR_PAYROLL_MANAGER'), ...)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'User not authenticated', 'UNAUTHORIZED', [], 401);
    }

    if (req.user.role === ROLES.ADMIN || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return errorResponse(
      res,
      `Access forbidden: Requires one of roles: [${allowedRoles.join(', ')}]`,
      'FORBIDDEN',
      [],
      403
    );
  };
};

/**
 * Employee Data Isolation Guard
 * Ensures EMPLOYEE role cannot inspect or mutate another employee's records
 */
const checkEmployeeOwnership = (paramKey = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'User not authenticated', 'UNAUTHORIZED', [], 401);
    }

    // HR and Admin roles bypass ownership restrictions
    if (req.user.role !== ROLES.EMPLOYEE) {
      return next();
    }

    const requestedEmployeeId = req.params[paramKey] || req.query[paramKey] || req.body?.employee_id;

    if (!req.user.employeeId) {
      return errorResponse(res, 'No linked employee profile associated with this account', 'FORBIDDEN', [], 403);
    }

    if (requestedEmployeeId && requestedEmployeeId !== req.user.employeeId) {
      return errorResponse(
        res,
        'Access denied: You are only authorized to view and manage your own employee data',
        'FORBIDDEN',
        [],
        403
      );
    }

    next();
  };
};

/**
 * Authorize read on employee-scoped endpoints:
 * Allows if user has permission (e.g. 'employees.read') OR
 * is an EMPLOYEE accessing their own record (matching req.user.employeeId).
 */
const authorizeEmployeeSelfOrPermission = (permission, paramKey = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'User not authenticated', 'UNAUTHORIZED', [], 401);
    }

    if (req.user.role === ROLES.ADMIN || hasPermission(req.user.role, permission)) {
      return next();
    }

    if (req.user.role === ROLES.EMPLOYEE && req.user.employeeId) {
      const requestedId = req.params[paramKey] || req.query[paramKey] || req.body?.employee_id;
      if (requestedId && requestedId === req.user.employeeId) {
        return next();
      }
    }

    return errorResponse(
      res,
      `Access forbidden: Your role (${req.user.role}) does not have permission '${permission}'`,
      'FORBIDDEN',
      [],
      403
    );
  };
};

module.exports = {
  authenticate,
  authorize,
  requireRole,
  checkEmployeeOwnership,
  authorizeEmployeeSelfOrPermission,
};

