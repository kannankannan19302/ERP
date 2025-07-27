const { body, validationResult } = require('express-validator');
const { BadRequestError } = require('../../../utils/errors');

/**
 * Validate create stock level request
 * @type {Array}
 */
exports.validateCreateStockLevel = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isUUID().withMessage('Invalid product ID format'),
  
  body('locationId')
    .notEmpty().withMessage('Location ID is required')
    .isUUID().withMessage('Invalid location ID format'),
  
  body('quantity')
    .optional()
    .isNumeric().withMessage('Quantity must be a number')
    .isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  
  body('minimumLevel')
    .optional()
    .isNumeric().withMessage('Minimum level must be a number')
    .isFloat({ min: 0 }).withMessage('Minimum level must be a positive number'),
  
  body('maximumLevel')
    .optional()
    .isNumeric().withMessage('Maximum level must be a number')
    .isFloat({ min: 0 }).withMessage('Maximum level must be a positive number'),
  
  body('reorderPoint')
    .optional()
    .isNumeric().withMessage('Reorder point must be a number')
    .isFloat({ min: 0 }).withMessage('Reorder point must be a positive number'),
  
  body('reorderQuantity')
    .optional()
    .isNumeric().withMessage('Reorder quantity must be a number')
    .isFloat({ min: 0 }).withMessage('Reorder quantity must be a positive number'),
  
  body('binLocation')
    .optional()
    .isString().withMessage('Bin location must be a string')
    .isLength({ max: 100 }).withMessage('Bin location cannot exceed 100 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }
    
    // Check if maximumLevel is greater than minimumLevel
    if (req.body.minimumLevel && req.body.maximumLevel && 
        parseFloat(req.body.minimumLevel) > parseFloat(req.body.maximumLevel)) {
      throw new BadRequestError('Maximum level must be greater than minimum level');
    }
    
    // Check if reorderPoint is between minimumLevel and maximumLevel
    if (req.body.reorderPoint && req.body.minimumLevel && req.body.maximumLevel && 
        (parseFloat(req.body.reorderPoint) < parseFloat(req.body.minimumLevel) || 
         parseFloat(req.body.reorderPoint) > parseFloat(req.body.maximumLevel))) {
      throw new BadRequestError('Reorder point must be between minimum and maximum levels');
    }
    
    next();
  }
];

/**
 * Validate update stock level request
 * @type {Array}
 */
exports.validateUpdateStockLevel = [
  body('minimumLevel')
    .optional()
    .isNumeric().withMessage('Minimum level must be a number')
    .isFloat({ min: 0 }).withMessage('Minimum level must be a positive number'),
  
  body('maximumLevel')
    .optional()
    .isNumeric().withMessage('Maximum level must be a number')
    .isFloat({ min: 0 }).withMessage('Maximum level must be a positive number'),
  
  body('reorderPoint')
    .optional()
    .isNumeric().withMessage('Reorder point must be a number')
    .isFloat({ min: 0 }).withMessage('Reorder point must be a positive number'),
  
  body('reorderQuantity')
    .optional()
    .isNumeric().withMessage('Reorder quantity must be a number')
    .isFloat({ min: 0 }).withMessage('Reorder quantity must be a positive number'),
  
  body('binLocation')
    .optional()
    .isString().withMessage('Bin location must be a string')
    .isLength({ max: 100 }).withMessage('Bin location cannot exceed 100 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }
    
    // Check if maximumLevel is greater than minimumLevel
    if (req.body.minimumLevel && req.body.maximumLevel && 
        parseFloat(req.body.minimumLevel) > parseFloat(req.body.maximumLevel)) {
      throw new BadRequestError('Maximum level must be greater than minimum level');
    }
    
    // Check if reorderPoint is between minimumLevel and maximumLevel
    if (req.body.reorderPoint && req.body.minimumLevel && req.body.maximumLevel && 
        (parseFloat(req.body.reorderPoint) < parseFloat(req.body.minimumLevel) || 
         parseFloat(req.body.reorderPoint) > parseFloat(req.body.maximumLevel))) {
      throw new BadRequestError('Reorder point must be between minimum and maximum levels');
    }
    
    next();
  }
];

/**
 * Validate adjust stock request
 * @type {Array}
 */
exports.validateAdjustStock = [
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isNumeric().withMessage('Quantity must be a number'),
  
  body('reason')
    .optional()
    .isIn([
      'purchase', 
      'sale', 
      'return', 
      'adjustment', 
      'transfer_in', 
      'transfer_out', 
      'inventory_count', 
      'production', 
      'consumption', 
      'waste', 
      'other'
    ])
    .withMessage('Invalid reason'),
  
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  
  body('referenceId')
    .optional()
    .isUUID().withMessage('Invalid reference ID format'),
  
  body('referenceType')
    .optional()
    .isIn([
      'purchase_order', 
      'sales_order', 
      'inventory_adjustment', 
      'stock_transfer', 
      'production_order', 
      'other'
    ])
    .withMessage('Invalid reference type'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }
    
    // If referenceId is provided, referenceType is required
    if (req.body.referenceId && !req.body.referenceType) {
      throw new BadRequestError('Reference type is required when reference ID is provided');
    }
    
    next();
  }
];