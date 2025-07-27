const { body, validationResult } = require('express-validator');
const { BadRequestError } = require('../../../utils/errors');

/**
 * Validate create sales order request
 * @type {Array}
 */
exports.validateCreateSalesOrder = [
  body('customerId')
    .notEmpty().withMessage('Customer ID is required')
    .isUUID().withMessage('Invalid customer ID format'),
  
  body('orderDate')
    .notEmpty().withMessage('Order date is required')
    .isISO8601().withMessage('Invalid order date format'),
  
  body('deliveryDate')
    .optional()
    .isISO8601().withMessage('Invalid delivery date format'),
  
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('shippingAddress')
    .optional()
    .isObject().withMessage('Shipping address must be an object'),
  
  body('shippingAddress.address')
    .optional()
    .isString().withMessage('Shipping address must be a string')
    .isLength({ max: 500 }).withMessage('Shipping address cannot exceed 500 characters'),
  
  body('shippingAddress.city')
    .optional()
    .isString().withMessage('Shipping city must be a string')
    .isLength({ max: 100 }).withMessage('Shipping city cannot exceed 100 characters'),
  
  body('shippingAddress.state')
    .optional()
    .isString().withMessage('Shipping state must be a string')
    .isLength({ max: 100 }).withMessage('Shipping state cannot exceed 100 characters'),
  
  body('shippingAddress.country')
    .optional()
    .isString().withMessage('Shipping country must be a string')
    .isLength({ max: 100 }).withMessage('Shipping country cannot exceed 100 characters'),
  
  body('shippingAddress.postalCode')
    .optional()
    .isString().withMessage('Shipping postal code must be a string')
    .isLength({ max: 20 }).withMessage('Shipping postal code cannot exceed 20 characters'),
  
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  
  body('items')
    .isArray().withMessage('Items must be an array')
    .notEmpty().withMessage('At least one item is required'),
  
  body('items.*.productId')
    .notEmpty().withMessage('Product ID is required')
    .isUUID().withMessage('Invalid product ID format'),
  
  body('items.*.description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  body('items.*.quantity')
    .notEmpty().withMessage('Quantity is required')
    .isNumeric().withMessage('Quantity must be a number')
    .isFloat({ min: 0.01 }).withMessage('Quantity must be greater than zero'),
  
  body('items.*.unitPrice')
    .notEmpty().withMessage('Unit price is required')
    .isNumeric().withMessage('Unit price must be a number')
    .isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  
  body('items.*.taxRate')
    .optional()
    .isNumeric().withMessage('Tax rate must be a number')
    .isFloat({ min: 0 }).withMessage('Tax rate must be a positive number'),
  
  body('items.*.discountRate')
    .optional()
    .isNumeric().withMessage('Discount rate must be a number')
    .isFloat({ min: 0 }).withMessage('Discount rate must be a positive number'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }
    next();
  }
];

/**
 * Validate update sales order request
 * @type {Array}
 */
exports.validateUpdateSalesOrder = [
  body('orderDate')
    .optional()
    .isISO8601().withMessage('Invalid order date format'),
  
  body('deliveryDate')
    .optional()
    .isISO8601().withMessage('Invalid delivery date format'),
  
  body('status')
    .optional()
    .isIn(['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('shippingAddress')
    .optional()
    .isObject().withMessage('Shipping address must be an object'),
  
  body('shippingAddress.address')
    .optional()
    .isString().withMessage('Shipping address must be a string')
    .isLength({ max: 500 }).withMessage('Shipping address cannot exceed 500 characters'),
  
  body('shippingAddress.city')
    .optional()
    .isString().withMessage('Shipping city must be a string')
    .isLength({ max: 100 }).withMessage('Shipping city cannot exceed 100 characters'),
  
  body('shippingAddress.state')
    .optional()
    .isString().withMessage('Shipping state must be a string')
    .isLength({ max: 100 }).withMessage('Shipping state cannot exceed 100 characters'),
  
  body('shippingAddress.country')
    .optional()
    .isString().withMessage('Shipping country must be a string')
    .isLength({ max: 100 }).withMessage('Shipping country cannot exceed 100 characters'),
  
  body('shippingAddress.postalCode')
    .optional()
    .isString().withMessage('Shipping postal code must be a string')
    .isLength({ max: 20 }).withMessage('Shipping postal code cannot exceed 20 characters'),
  
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  
  body('items')
    .optional()
    .isArray().withMessage('Items must be an array')
    .notEmpty().withMessage('At least one item is required'),
  
  body('items.*.productId')
    .optional()
    .notEmpty().withMessage('Product ID is required')
    .isUUID().withMessage('Invalid product ID format'),
  
  body('items.*.description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  body('items.*.quantity')
    .optional()
    .isNumeric().withMessage('Quantity must be a number')
    .isFloat({ min: 0.01 }).withMessage('Quantity must be greater than zero'),
  
  body('items.*.unitPrice')
    .optional()
    .isNumeric().withMessage('Unit price must be a number')
    .isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  
  body('items.*.taxRate')
    .optional()
    .isNumeric().withMessage('Tax rate must be a number')
    .isFloat({ min: 0 }).withMessage('Tax rate must be a positive number'),
  
  body('items.*.discountRate')
    .optional()
    .isNumeric().withMessage('Discount rate must be a number')
    .isFloat({ min: 0 }).withMessage('Discount rate must be a positive number'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }
    next();
  }
];

/**
 * Validate update sales order status request
 * @type {Array}
 */
exports.validateUpdateSalesOrderStatus = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }
    next();
  }
];