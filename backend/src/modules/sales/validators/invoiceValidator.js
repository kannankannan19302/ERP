const { body, validationResult } = require('express-validator');
const { BadRequestError } = require('../../../utils/errors');

/**
 * Validate create invoice request
 * @type {Array}
 */
exports.validateCreateInvoice = [
  body('customerId')
    .notEmpty().withMessage('Customer ID is required')
    .isUUID().withMessage('Invalid customer ID format'),
  
  body('salesOrderId')
    .optional()
    .isUUID().withMessage('Invalid sales order ID format'),
  
  body('invoiceDate')
    .notEmpty().withMessage('Invoice date is required')
    .isISO8601().withMessage('Invalid invoice date format'),
  
  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Invalid due date format'),
  
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  
  body('items')
    .optional()
    .isArray().withMessage('Items must be an array'),
  
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
    
    // Check if either salesOrderId or items are provided
    if (!req.body.salesOrderId && (!req.body.items || req.body.items.length === 0)) {
      throw new BadRequestError('Either sales order ID or invoice items are required');
    }
    
    next();
  }
];

/**
 * Validate update invoice request
 * @type {Array}
 */
exports.validateUpdateInvoice = [
  body('invoiceDate')
    .optional()
    .isISO8601().withMessage('Invalid invoice date format'),
  
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid due date format'),
  
  body('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'])
    .withMessage('Invalid status'),
  
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
 * Validate record payment request
 * @type {Array}
 */
exports.validateRecordPayment = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isNumeric().withMessage('Amount must be a number')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than zero'),
  
  body('paymentDate')
    .notEmpty().withMessage('Payment date is required')
    .isISO8601().withMessage('Invalid payment date format'),
  
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['cash', 'check', 'credit_card', 'bank_transfer', 'online', 'other'])
    .withMessage('Invalid payment method'),
  
  body('referenceNumber')
    .optional()
    .isString().withMessage('Reference number must be a string')
    .isLength({ max: 100 }).withMessage('Reference number cannot exceed 100 characters'),
  
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }
    next();
  }
];