const express = require('express');
const router = express.Router();
const salesOrderController = require('../controllers/salesOrderController');
const salesOrderValidator = require('../validators/salesOrderValidator');
const { authenticate } = require('../../auth/middlewares/authMiddleware');
const { checkPermission } = require('../../auth/middlewares/permissionMiddleware');

/**
 * @route GET /api/v1/sales-orders
 * @desc Get all sales orders
 * @access Private
 */
router.get(
  '/',
  authenticate,
  checkPermission('sales.read'),
  salesOrderController.getAllSalesOrders
);

/**
 * @route GET /api/v1/sales-orders/:id
 * @desc Get sales order by ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  checkPermission('sales.read'),
  salesOrderController.getSalesOrderById
);

/**
 * @route POST /api/v1/sales-orders
 * @desc Create new sales order
 * @access Private
 */
router.post(
  '/',
  authenticate,
  checkPermission('sales.create'),
  salesOrderValidator.validateCreateSalesOrder,
  salesOrderController.createSalesOrder
);

/**
 * @route PUT /api/v1/sales-orders/:id
 * @desc Update sales order
 * @access Private
 */
router.put(
  '/:id',
  authenticate,
  checkPermission('sales.update'),
  salesOrderValidator.validateUpdateSalesOrder,
  salesOrderController.updateSalesOrder
);

/**
 * @route DELETE /api/v1/sales-orders/:id
 * @desc Delete sales order
 * @access Private
 */
router.delete(
  '/:id',
  authenticate,
  checkPermission('sales.delete'),
  salesOrderController.deleteSalesOrder
);

/**
 * @route PATCH /api/v1/sales-orders/:id/status
 * @desc Update sales order status
 * @access Private
 */
router.patch(
  '/:id/status',
  authenticate,
  checkPermission('sales.update'),
  salesOrderValidator.validateUpdateSalesOrderStatus,
  salesOrderController.updateSalesOrderStatus
);

module.exports = router;