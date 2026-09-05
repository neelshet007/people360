/**
 * Custom Operational API Error Class
 * Standardizes HTTP errors across all backend modules
 */
class ApiError extends Error {
  constructor(statusCode, message, code = 'SERVER_ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Invalid request parameters', details = []) {
    return new ApiError(400, message, 'INVALID_INPUT', details);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static notFound(message = 'Requested resource not found') {
    return new ApiError(404, message, 'RESOURCE_NOT_FOUND');
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, 'SERVER_ERROR');
  }
}

module.exports = ApiError;
