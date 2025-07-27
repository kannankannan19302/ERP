const { body, validationResult } = require('express-validator');
const { BadRequestError } = require('../../../utils/errors');

/**
 * Validate create customer request
 * @type {Array}
 */
exports.validateCreateCustomer = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isString().withMessage('Name must be a string')
    .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
  
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .isLength({ max: 255 }).withMessage('Email cannot exceed 255 characters'),
  
  body('phone')
    .optional()
    .isString().withMessage('Phone must be a string')
    .isLength({ max: 20 }).withMessage('Phone cannot exceed 20 characters'),
  
  body('address')
    .optional()
    .isString().withMessage('Address must be a string')
    .isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters'),
  
  body('city')
    .optional()
    .isString().withMessage('City must be a string')
    .isLength({ max: 100 }).withMessage('City cannot exceed 100 characters'),
  
  body('state')
    .optional()
    .isString().withMessage('State must be a string')
    .isLength({ max: 100 }).withMessage('State cannot exceed 100 characters'),
  
  body('country')
    .optional()
    .isString().withMessage('Country must be a string')
    .isLength({ max: 100 }).withMessage('Country cannot exceed 100 characters'),
  
  body('postalCode')
    .optional()
    .isString().withMessage('Postal code must be a string')
    .isLength({ max: 20 }).withMessage('Postal code cannot exceed 20 characters'),
  
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  
  body('customerType')
    .optional()
    .isIn(['individual', 'business', 'government']).withMessage('Invalid customer type'),
  
  body('creditLimit')
    .optional()
    .isNumeric().withMessage('Credit limit must be a number')
    .isFloat({ min: 0 }).withMessage('Credit limit must be a positive number'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }
    next();
  }
];

/**
 * Validate update customer request
 * @type {Array}
 */
exports.validateUpdateCustomer = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string')
    .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
  
  body('email')
    .optional()
    .isEmail().withMessage('Invalid email format')
    .isLength({ max: 255 }).withMessage('Email cannot exceed 255 characters'),
  
  body('phone')
    .optional()
    .isString().withMessage('Phone must be a string')
    .isLength({ max: 20 }).withMessage('Phone cannot exceed 20 characters'),
  
  body('address')
    .optional()
    .isString().withMessage('Address must be a string')
    .isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters'),
  
  body('city')
    .optional()
    .isString().withMessage('City must be a string')
    .isLength({ max: 100 }).withMessage('City cannot exceed 100 characters'),
  
  body('state')
    .optional()
    .isString().withMessage('State must be a string')
    .isLength({ max: 100 }).withMessage('State cannot exceed 100 characters'),
  
  body('country')
    .optional()
    .isString().withMessage('Country must be a string')
    .isLength({ max: 100 }).withMessage('Country cannot exceed 100 characters'),
  
  body('postalCode')
    .optional()
    .isString().withMessage('Postal code must be a string')
    .isLength({ max: 20 }).withMessage('Postal code cannot exceed 20 characters'),
  
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  
  body('customerType')
    .optional()
    .isIn(['individual', 'business', 'government']).withMessage('Invalid customer type'),
  
  body('creditLimit')
    .optional()
    .isNumeric().withMessage('Credit limit must be a number')
    .isFloat({ min: 0 }).withMessage('Credit limit must be a positive number'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }
    next();
  }
];