const logger = require('../utils/logger');
const config = require('../config');

class ErrorHandler {
  // Main error handling middleware
  static handle(error, req, res, next) {
    // Log the error
    logger.error('Unhandled error:', {
      error: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      tenantId: req.tenant?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Determine error type and respond accordingly
    if (error.name === 'ValidationError') {
      return ErrorHandler.handleValidationError(error, res);
    }

    if (error.name === 'CastError') {
      return ErrorHandler.handleCastError(error, res);
    }

    if (error.code === 11000) {
      return ErrorHandler.handleDuplicateError(error, res);
    }

    if (error.name === 'JsonWebTokenError') {
      return ErrorHandler.handleJWTError(error, res);
    }

    if (error.name === 'TokenExpiredError') {
      return ErrorHandler.handleTokenExpiredError(error, res);
    }

    if (error.name === 'MulterError') {
      return ErrorHandler.handleMulterError(error, res);
    }

    if (error.code && error.code.startsWith('ER_')) {
      return ErrorHandler.handleDatabaseError(error, res);
    }

    if (error.status || error.statusCode) {
      return ErrorHandler.handleHttpError(error, res);
    }

    // Default server error
    return ErrorHandler.handleServerError(error, res);
  }

  // Handle validation errors
  static handleValidationError(error, res) {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
  }

  // Handle cast errors (invalid ObjectId, etc.)
  static handleCastError(error, res) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_DATA_FORMAT',
        message: `Invalid ${error.path}: ${error.value}`
      }
    });
  }

  // Handle duplicate key errors
  static handleDuplicateError(error, res) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];

    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: `${field} '${value}' already exists`,
        field,
        value
      }
    });
  }

  // Handle JWT errors
  static handleJWTError(error, res) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    });
  }

  // Handle token expired errors
  static handleTokenExpiredError(error, res) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired'
      }
    });
  }

  // Handle file upload errors
  static handleMulterError(error, res) {
    let message = 'File upload error';
    let code = 'FILE_UPLOAD_ERROR';

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        code = 'UNEXPECTED_FILE';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        code = 'FIELD_NAME_TOO_LONG';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        code = 'FIELD_VALUE_TOO_LONG';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        code = 'TOO_MANY_FIELDS';
        break;
    }

    return res.status(400).json({
      success: false,
      error: {
        code,
        message
      }
    });
  }

  // Handle database errors
  static handleDatabaseError(error, res) {
    let message = 'Database error';
    let code = 'DATABASE_ERROR';
    let statusCode = 500;

    // MySQL/MariaDB errors
    if (error.code) {
      switch (error.code) {
        case 'ER_DUP_ENTRY':
          message = 'Duplicate entry';
          code = 'DUPLICATE_ENTRY';
          statusCode = 409;
          break;
        case 'ER_NO_REFERENCED_ROW_2':
          message = 'Referenced record does not exist';
          code = 'FOREIGN_KEY_CONSTRAINT';
          statusCode = 400;
          break;
        case 'ER_ROW_IS_REFERENCED_2':
          message = 'Cannot delete record as it is referenced by other records';
          code = 'FOREIGN_KEY_CONSTRAINT';
          statusCode = 400;
          break;
        case 'ER_DATA_TOO_LONG':
          message = 'Data too long for field';
          code = 'DATA_TOO_LONG';
          statusCode = 400;
          break;
        case 'ER_BAD_NULL_ERROR':
          message = 'Required field cannot be null';
          code = 'NULL_CONSTRAINT_VIOLATION';
          statusCode = 400;
          break;
        case 'ER_ACCESS_DENIED_ERROR':
          message = 'Database access denied';
          code = 'DATABASE_ACCESS_DENIED';
          statusCode = 500;
          break;
        case 'ER_BAD_DB_ERROR':
          message = 'Database does not exist';
          code = 'DATABASE_NOT_FOUND';
          statusCode = 500;
          break;
        case 'ER_TABLE_DOESNT_EXIST':
          message = 'Table does not exist';
          code = 'TABLE_NOT_FOUND';
          statusCode = 500;
          break;
      }
    }

    // PostgreSQL errors
    if (error.code && error.code.startsWith('23')) {
      switch (error.code) {
        case '23505':
          message = 'Duplicate entry';
          code = 'DUPLICATE_ENTRY';
          statusCode = 409;
          break;
        case '23503':
          message = 'Foreign key constraint violation';
          code = 'FOREIGN_KEY_CONSTRAINT';
          statusCode = 400;
          break;
        case '23502':
          message = 'Not null constraint violation';
          code = 'NULL_CONSTRAINT_VIOLATION';
          statusCode = 400;
          break;
        case '23514':
          message = 'Check constraint violation';
          code = 'CHECK_CONSTRAINT_VIOLATION';
          statusCode = 400;
          break;
      }
    }

    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message: config.server.environment === 'production' ? message : error.message
      }
    });
  }

  // Handle HTTP errors
  static handleHttpError(error, res) {
    const statusCode = error.status || error.statusCode || 500;
    
    return res.status(statusCode).json({
      success: false,
      error: {
        code: error.code || 'HTTP_ERROR',
        message: error.message || 'An error occurred'
      }
    });
  }

  // Handle generic server errors
  static handleServerError(error, res) {
    const message = config.server.environment === 'production' 
      ? 'Internal server error' 
      : error.message;

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message
      }
    });
  }

  // Create custom error
  static createError(message, statusCode = 500, code = null) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.status = statusCode;
    error.code = code;
    return error;
  }

  // Async error wrapper
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Not found handler
  static notFound(req, res, next) {
    const error = ErrorHandler.createError(
      `Resource not found - ${req.originalUrl}`,
      404,
      'NOT_FOUND'
    );
    next(error);
  }

  // Rate limit error handler
  static rateLimitHandler(req, res) {
    logger.logSecurity('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    }, req);

    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      }
    });
  }

  // CORS error handler
  static corsErrorHandler(req, res) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: 'Cross-origin request blocked'
      }
    });
  }

  // Payload too large handler
  static payloadTooLargeHandler(req, res) {
    return res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload too large'
      }
    });
  }

  // Timeout handler
  static timeoutHandler(req, res) {
    return res.status(408).json({
      success: false,
      error: {
        code: 'REQUEST_TIMEOUT',
        message: 'Request timeout'
      }
    });
  }

  // Method not allowed handler
  static methodNotAllowedHandler(req, res) {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${req.method} not allowed for ${req.originalUrl}`
      }
    });
  }

  // Validation error helper
  static validationError(message, field = null, value = null) {
    const error = new Error(message);
    error.name = 'ValidationError';
    error.statusCode = 400;
    error.field = field;
    error.value = value;
    return error;
  }

  // Authorization error helper
  static authorizationError(message = 'Access denied') {
    const error = new Error(message);
    error.statusCode = 403;
    error.code = 'ACCESS_DENIED';
    return error;
  }

  // Authentication error helper
  static authenticationError(message = 'Authentication required') {
    const error = new Error(message);
    error.statusCode = 401;
    error.code = 'AUTHENTICATION_REQUIRED';
    return error;
  }

  // Not found error helper
  static notFoundError(resource = 'Resource') {
    const error = new Error(`${resource} not found`);
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    return error;
  }

  // Conflict error helper
  static conflictError(message = 'Resource conflict') {
    const error = new Error(message);
    error.statusCode = 409;
    error.code = 'CONFLICT';
    return error;
  }

  // Bad request error helper
  static badRequestError(message = 'Bad request') {
    const error = new Error(message);
    error.statusCode = 400;
    error.code = 'BAD_REQUEST';
    return error;
  }
}

module.exports = ErrorHandler;