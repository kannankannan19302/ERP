const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const customerValidator = require('../validators/customerValidator');
const { authenticate } = require('../../auth/middlewares/authMiddleware');
const { checkPermission } = require('../../auth/middlewares/permissionMiddleware');

/**
 * @route GET /api/v1/customers
 * @desc Get all customers
 * @access Private
 */
router.get(
  '/',
  authenticate,
  checkPermission('customers.read'),
  customerController.getAllCustomers
);

/**
 * @route GET /api/v1/customers/:id
 * @desc Get customer by ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  checkPermission('customers.read'),
  customerController.getCustomerById
);

/**
 * @route POST /api/v1/customers
 * @desc Create new customer
 * @access Private
 */
router.post(
  '/',
  authenticate,
  checkPermission('customers.create'),
  customerValidator.validateCreateCustomer,
  customerController.createCustomer
);

/**
 * @route PUT /api/v1/customers/:id
 * @desc Update customer
 * @access Private
 */
router.put(
  '/:id',
  authenticate,
  checkPermission('customers.update'),
  customerValidator.validateUpdateCustomer,
  customerController.updateCustomer
);

/**
 * @route DELETE /api/v1/customers/:id
 * @desc Delete customer
 * @access Private
 */
router.delete(
  '/:id',
  authenticate,
  checkPermission('customers.delete'),
  customerController.deleteCustomer
);

/**
 * @route GET /api/v1/customers/:id/stats
 * @desc Get customer statistics
 * @access Private
 */
router.get(
  '/:id/stats',
  authenticate,
  checkPermission('customers.read'),
  customerController.getCustomerStats
);

module.exports = router;