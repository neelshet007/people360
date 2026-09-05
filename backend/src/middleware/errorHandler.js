const { errorResponse } = require('../utils/responseHelper');

/**
 * Global Express error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const details = err.details || [];

  return errorResponse(res, message, code, details, statusCode);
};

module.exports = errorHandler;
