const jwt = require('jsonwebtoken');
const config = require('../config');
const { errorResponse } = require('../utils/responseHelper');

/**
 * Authentication Middleware — Phase 5 upgrade
 * Verifies JWT from Authorization header and resolves real user identity.
 * Sets req.user = { userId, employeeId, email, role, name }
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication token missing or invalid', 'UNAUTHORIZED', [], 401);
  }

  const token = authHeader.slice(7);

  // Support demo/mock token for non-DB environments
  if (token === 'mock-jwt-auth-session-token') {
    req.user = {
      userId: 'demo-admin',
      employeeId: null,
      email: 'admin@peoplepay360.com',
      role: 'HR_ADMIN',
      name: 'HR Admin',
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      userId: decoded.userId,
      employeeId: decoded.employeeId || null,
      email: decoded.email,
      role: decoded.role || 'EMPLOYEE',
      name: decoded.name || decoded.email,
    };
    next();
  } catch (err) {
    return errorResponse(res, 'Session expired or invalid token. Please log in again.', 'UNAUTHORIZED', [], 401);
  }
};

/**
 * Role-based access control middleware factory.
 * Usage: requireRole('HR_ADMIN', 'ADMIN')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Not authenticated', 'UNAUTHORIZED', [], 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'You do not have permission to perform this action', 'FORBIDDEN', [], 403);
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
