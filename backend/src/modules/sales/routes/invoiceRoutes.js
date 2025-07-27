const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const invoiceValidator = require('../validators/invoiceValidator');
const { authenticate } = require('../../auth/middlewares/authMiddleware');
const { checkPermission } = require('../../auth/middlewares/permissionMiddleware');

/**
 * @route GET /api/v1/invoices
 * @desc Get all invoices
 * @access Private
 */
router.get(
  '/',
  authenticate,
  checkPermission('invoices.read'),
  invoiceController.getAllInvoices
);

/**
 * @route GET /api/v1/invoices/:id
 * @desc Get invoice by ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  checkPermission('invoices.read'),
  invoiceController.getInvoiceById
);

/**
 * @route POST /api/v1/invoices
 * @desc Create new invoice
 * @access Private
 */
router.post(
  '/',
  authenticate,
  checkPermission('invoices.create'),
  invoiceValidator.validateCreateInvoice,
  invoiceController.createInvoice
);

/**
 * @route PUT /api/v1/invoices/:id
 * @desc Update invoice
 * @access Private
 */
router.put(
  '/:id',
  authenticate,
  checkPermission('invoices.update'),
  invoiceValidator.validateUpdateInvoice,
  invoiceController.updateInvoice
);

/**
 * @route DELETE /api/v1/invoices/:id
 * @desc Delete invoice
 * @access Private
 */
router.delete(
  '/:id',
  authenticate,
  checkPermission('invoices.delete'),
  invoiceController.deleteInvoice
);

/**
 * @route POST /api/v1/invoices/:id/payments
 * @desc Record payment for invoice
 * @access Private
 */
router.post(
  '/:id/payments',
  authenticate,
  checkPermission('invoices.update'),
  invoiceValidator.validateRecordPayment,
  invoiceController.recordPayment
);

/**
 * @route GET /api/v1/invoices/:id/payments
 * @desc Get invoice payments
 * @access Private
 */
router.get(
  '/:id/payments',
  authenticate,
  checkPermission('invoices.read'),
  invoiceController.getInvoicePayments
);

module.exports = router;