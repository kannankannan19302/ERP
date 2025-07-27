const { body, param, validationResult } = require('express-validator');

/**
 * Validate request and return errors if any
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array().map(error => ({
          field: error.param,
          message: error.msg
        }))
      }
    });
  }
  next();
};

/**
 * Validate login request
 */
exports.validateLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  body('tenant')
    .optional()
    .isString().withMessage('Tenant must be a string'),
  validate
];

/**
 * Validate registration request
 */
exports.validateRegistration = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isString().withMessage('First name must be a string'),
  body('lastName')
    .notEmpty().withMessage('Last name is required')
    .isString().withMessage('Last name must be a string'),
  body('tenantId')
    .optional()
    .isUUID().withMessage('Invalid tenant ID format'),
  body('companyId')
    .optional()
    .isUUID().withMessage('Invalid company ID format'),
  validate
];

/**
 * Validate refresh token request
 */
exports.validateRefreshToken = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required'),
  validate
];

/**
 * Validate logout request
 */
exports.validateLogout = [
  body('refreshToken')
    .optional()
    .isString().withMessage('Refresh token must be a string'),
  validate
];

/**
 * Validate forgot password request
 */
exports.validateForgotPassword = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  validate
];

/**
 * Validate reset password request
 */
exports.validateResetPassword = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  validate
];

/**
 * Validate update profile request
 */
exports.validateUpdateProfile = [
  body('firstName')
    .optional()
    .isString().withMessage('First name must be a string'),
  body('lastName')
    .optional()
    .isString().withMessage('Last name must be a string'),
  body('phone')
    .optional()
    .isString().withMessage('Phone must be a string'),
  validate
];

/**
 * Validate change password request
 */
exports.validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  validate
];