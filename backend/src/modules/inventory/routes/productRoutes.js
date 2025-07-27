const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const productValidator = require('../validators/productValidator');
const { authenticate } = require('../../auth/middlewares/authMiddleware');
const { checkPermission } = require('../../auth/middlewares/permissionMiddleware');

/**
 * @route GET /api/v1/products
 * @desc Get all products
 * @access Private
 */
router.get(
  '/',
  authenticate,
  checkPermission('inventory.read'),
  productController.getAllProducts
);

/**
 * @route GET /api/v1/products/:id
 * @desc Get product by ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  checkPermission('inventory.read'),
  productController.getProductById
);

/**
 * @route POST /api/v1/products
 * @desc Create new product
 * @access Private
 */
router.post(
  '/',
  authenticate,
  checkPermission('inventory.create'),
  productValidator.validateCreateProduct,
  productController.createProduct
);

/**
 * @route PUT /api/v1/products/:id
 * @desc Update product
 * @access Private
 */
router.put(
  '/:id',
  authenticate,
  checkPermission('inventory.update'),
  productValidator.validateUpdateProduct,
  productController.updateProduct
);

/**
 * @route DELETE /api/v1/products/:id
 * @desc Delete product
 * @access Private
 */
router.delete(
  '/:id',
  authenticate,
  checkPermission('inventory.delete'),
  productController.deleteProduct
);

/**
 * @route GET /api/v1/products/:id/stock
 * @desc Get product stock
 * @access Private
 */
router.get(
  '/:id/stock',
  authenticate,
  checkPermission('inventory.read'),
  productController.getProductStock
);

module.exports = router;