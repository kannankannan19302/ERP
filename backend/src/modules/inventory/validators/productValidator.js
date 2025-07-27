const { body, validationResult } = require('express-validator');
const { BadRequestError } = require('../../../utils/errors');

/**
 * Validate create product request
 * @type {Array}
 */
exports.validateCreateProduct = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isString().withMessage('Name must be a string')
    .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
  
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('sku')
    .optional()
    .isString().withMessage('SKU must be a string')
    .isLength({ max: 50 }).withMessage('SKU cannot exceed 50 characters'),
  
  body('barcode')
    .optional()
    .isString().withMessage('Barcode must be a string')
    .isLength({ max: 50 }).withMessage('Barcode cannot exceed 50 characters'),
  
  body('categoryId')
    .optional()
    .isUUID().withMessage('Invalid category ID format'),
  
  body('unitOfMeasure')
    .optional()
    .isString().withMessage('Unit of measure must be a string')
    .isLength({ max: 50 }).withMessage('Unit of measure cannot exceed 50 characters'),
  
  body('purchasePrice')
    .optional()
    .isNumeric().withMessage('Purchase price must be a number')
    .isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
  
  body('sellingPrice')
    .optional()
    .isNumeric().withMessage('Selling price must be a number')
    .isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  
  body('taxRate')
    .optional()
    .isNumeric().withMessage('Tax rate must be a number')
    .isFloat({ min: 0 }).withMessage('Tax rate must be a positive number'),
  
  body('reorderLevel')
    .optional()
    .isNumeric().withMessage('Reorder level must be a number')
    .isFloat({ min: 0 }).withMessage('Reorder level must be a positive number'),
  
  body('targetStockLevel')
    .optional()
    .isNumeric().withMessage('Target stock level must be a number')
    .isFloat({ min: 0 }).withMessage('Target stock level must be a positive number'),
  
  body('leadTime')
    .optional()
    .isNumeric().withMessage('Lead time must be a number')
    .isFloat({ min: 0 }).withMessage('Lead time must be a positive number'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  body('isSellable')
    .optional()
    .isBoolean().withMessage('isSellable must be a boolean'),
  
  body('isPurchasable')
    .optional()
    .isBoolean().withMessage('isPurchasable must be a boolean'),
  
  body('isStockable')
    .optional()
    .isBoolean().withMessage('isStockable must be a boolean'),
  
  body('imageUrl')
    .optional()
    .isURL().withMessage('Invalid image URL format')
    .isLength({ max: 500 }).withMessage('Image URL cannot exceed 500 characters'),
  
  body('weight')
    .optional()
    .isNumeric().withMessage('Weight must be a number')
    .isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  
  body('weightUnit')
    .optional()
    .isString().withMessage('Weight unit must be a string')
    .isLength({ max: 20 }).withMessage('Weight unit cannot exceed 20 characters'),
  
  body('dimensions')
    .optional()
    .isObject().withMessage('Dimensions must be an object'),
  
  body('dimensions.length')
    .optional()
    .isNumeric().withMessage('Length must be a number')
    .isFloat({ min: 0 }).withMessage('Length must be a positive number'),
  
  body('dimensions.width')
    .optional()
    .isNumeric().withMessage('Width must be a number')
    .isFloat({ min: 0 }).withMessage('Width must be a positive number'),
  
  body('dimensions.height')
    .optional()
    .isNumeric().withMessage('Height must be a number')
    .isFloat({ min: 0 }).withMessage('Height must be a positive number'),
  
  body('dimensions.unit')
    .optional()
    .isString().withMessage('Dimension unit must be a string')
    .isLength({ max: 20 }).withMessage('Dimension unit cannot exceed 20 characters'),
  
  body('attributes')
    .optional()
    .isObject().withMessage('Attributes must be an object'),
  
  body('initialStock')
    .optional()
    .isArray().withMessage('Initial stock must be an array'),
  
  body('initialStock.*.locationId')
    .optional()
    .notEmpty().withMessage('Location ID is required')
    .isUUID().withMessage('Invalid location ID format'),
  
  body('initialStock.*.quantity')
    .optional()
    .isNumeric().withMessage('Quantity must be a number')
    .isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  
  body('initialStock.*.minimumLevel')
    .optional()
    .isNumeric().withMessage('Minimum level must be a number')
    .isFloat({ min: 0 }).withMessage('Minimum level must be a positive number'),
  
  body('initialStock.*.maximumLevel')
    .optional()
    .isNumeric().withMessage('Maximum level must be a number')
    .isFloat({ min: 0 }).withMessage('Maximum level must be a positive number'),
  
  body('initialStock.*.reorderPoint')
    .optional()
    .isNumeric().withMessage('Reorder point must be a number')
    .isFloat({ min: 0 }).withMessage('Reorder point must be a positive number'),
  
  body('initialStock.*.reorderQuantity')
    .optional()
    .isNumeric().withMessage('Reorder quantity must be a number')
    .isFloat({ min: 0 }).withMessage('Reorder quantity must be a positive number'),
  
  body('initialStock.*.binLocation')
    .optional()
    .isString().withMessage('Bin location must be a string')
    .isLength({ max: 100 }).withMessage('Bin location cannot exceed 100 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }
    next();
  }
];

/**
 * Validate update product request
 * @type {Array}
 */
exports.validateUpdateProduct = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string')
    .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
  
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('barcode')
    .optional()
    .isString().withMessage('Barcode must be a string')
    .isLength({ max: 50 }).withMessage('Barcode cannot exceed 50 characters'),
  
  body('categoryId')
    .optional()
    .isUUID().withMessage('Invalid category ID format'),
  
  body('unitOfMeasure')
    .optional()
    .isString().withMessage('Unit of measure must be a string')
    .isLength({ max: 50 }).withMessage('Unit of measure cannot exceed 50 characters'),
  
  body('purchasePrice')
    .optional()
    .isNumeric().withMessage('Purchase price must be a number')
    .isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
  
  body('sellingPrice')
    .optional()
    .isNumeric().withMessage('Selling price must be a number')
    .isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  
  body('taxRate')
    .optional()
    .isNumeric().withMessage('Tax rate must be a number')
    .isFloat({ min: 0 }).withMessage('Tax rate must be a positive number'),
  
  body('reorderLevel')
    .optional()
    .isNumeric().withMessage('Reorder level must be a number')
    .isFloat({ min: 0 }).withMessage('Reorder level must be a positive number'),
  
  body('targetStockLevel')
    .optional()
    .isNumeric().withMessage('Target stock level must be a number')
    .isFloat({ min: 0 }).withMessage('Target stock level must be a positive number'),
  
  body('leadTime')
    .optional()
    .isNumeric().withMessage('Lead time must be a number')
    .isFloat({ min: 0 }).withMessage('Lead time must be a positive number'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  body('isSellable')
    .optional()
    .isBoolean().withMessage('isSellable must be a boolean'),
  
  body('isPurchasable')
    .optional()
    .isBoolean().withMessage('isPurchasable must be a boolean'),
  
  body('isStockable')
    .optional()
    .isBoolean().withMessage('isStockable must be a boolean'),
  
  body('imageUrl')
    .optional()
    .isURL().withMessage('Invalid image URL format')
    .isLength({ max: 500 }).withMessage('Image URL cannot exceed 500 characters'),
  
  body('weight')
    .optional()
    .isNumeric().withMessage('Weight must be a number')
    .isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  
  body('weightUnit')
    .optional()
    .isString().withMessage('Weight unit must be a string')
    .isLength({ max: 20 }).withMessage('Weight unit cannot exceed 20 characters'),
  
  body('dimensions')
    .optional()
    .isObject().withMessage('Dimensions must be an object'),
  
  body('dimensions.length')
    .optional()
    .isNumeric().withMessage('Length must be a number')
    .isFloat({ min: 0 }).withMessage('Length must be a positive number'),
  
  body('dimensions.width')
    .optional()
    .isNumeric().withMessage('Width must be a number')
    .isFloat({ min: 0 }).withMessage('Width must be a positive number'),
  
  body('dimensions.height')
    .optional()
    .isNumeric().withMessage('Height must be a number')
    .isFloat({ min: 0 }).withMessage('Height must be a positive number'),
  
  body('dimensions.unit')
    .optional()
    .isString().withMessage('Dimension unit must be a string')
    .isLength({ max: 20 }).withMessage('Dimension unit cannot exceed 20 characters'),
  
  body('attributes')
    .optional()
    .isObject().withMessage('Attributes must be an object'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }
    next();
  }
];