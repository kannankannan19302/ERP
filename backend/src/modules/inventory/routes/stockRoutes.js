const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const stockValidator = require('../validators/stockValidator');
const { authenticate } = require('../../auth/middlewares/authMiddleware');
const { checkPermission } = require('../../auth/middlewares/permissionMiddleware');

/**
 * @route GET /api/v1/stock
 * @desc Get all stock levels
 * @access Private
 */
router.get(
  '/',
  authenticate,
  checkPermission('inventory.read'),
  stockController.getStockLevels
);

/**
 * @route GET /api/v1/stock/:id
 * @desc Get stock level by ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  checkPermission('inventory.read'),
  stockController.getStockLevelById
);

/**
 * @route POST /api/v1/stock
 * @desc Create new stock level
 * @access Private
 */
router.post(
  '/',
  authenticate,
  checkPermission('inventory.create'),
  stockValidator.validateCreateStockLevel,
  stockController.createStockLevel
);

/**
 * @route PUT /api/v1/stock/:id
 * @desc Update stock level
 * @access Private
 */
router.put(
  '/:id',
  authenticate,
  checkPermission('inventory.update'),
  stockValidator.validateUpdateStockLevel,
  stockController.updateStockLevel
);

/**
 * @route PATCH /api/v1/stock/:id/adjust
 * @desc Adjust stock
 * @access Private
 */
router.patch(
  '/:id/adjust',
  authenticate,
  checkPermission('inventory.update'),
  stockValidator.validateAdjustStock,
  stockController.adjustStock
);

/**
 * @route GET /api/v1/stock/movements
 * @desc Get stock movements
 * @access Private
 */
router.get(
  '/movements',
  authenticate,
  checkPermission('inventory.read'),
  stockController.getStockMovements
);

module.exports = router;