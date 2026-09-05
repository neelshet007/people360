/**
 * Standard API response helper functions
 * Follows the API contract defined in docs/API-CONTRACT.md
 */

const successResponse = (res, data = {}, meta = null, statusCode = 200) => {
  const payload = {
    success: true,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

const errorResponse = (res, message = 'An error occurred', code = 'SERVER_ERROR', details = [], statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
