const { body, validationResult } = require('express-validator');
const { BadRequestError } = require('../../../utils/errors');

/**
 * Validate create category request
 * @type {Array}
 */
exports.validateCreateCategory = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isString().withMessage('Name must be a string')
    .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
  
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('parentId')
    .optional()
    .isUUID().withMessage('Invalid parent ID format'),
  
  body('imageUrl')
    .optional()
    .isURL().withMessage('Invalid image URL format')
    .isLength({ max: 500 }).withMessage('Image URL cannot exceed 500 characters'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  body('sortOrder')
    .optional()
    .isInt().withMessage('Sort order must be an integer'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }
    next();
  }
];

/**
 * Validate update category request
 * @type {Array}
 */
exports.validateUpdateCategory = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string')
    .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
  
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('parentId')
    .optional()
    .isUUID().withMessage('Invalid parent ID format'),
  
  body('imageUrl')
    .optional()
    .isURL().withMessage('Invalid image URL format')
    .isLength({ max: 500 }).withMessage('Image URL cannot exceed 500 characters'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  body('sortOrder')
    .optional()
    .isInt().withMessage('Sort order must be an integer'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }
    next();
  }
];