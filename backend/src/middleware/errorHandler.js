const { errorResponse } = require('../utils/responseHelper');

/**
 * Global Express error handling middleware
 * Formats errors to match standard envelope defined in docs/API-CONTRACT.md
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'SERVER_ERROR';
  const details = err.details || [];

  return errorResponse(res, message, code, details, statusCode);
};

module.exports = errorHandler;

