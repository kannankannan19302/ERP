const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const categoryValidator = require('../validators/categoryValidator');
const { authenticate } = require('../../auth/middlewares/authMiddleware');
const { checkPermission } = require('../../auth/middlewares/permissionMiddleware');

/**
 * @route GET /api/v1/categories
 * @desc Get all categories
 * @access Private
 */
router.get(
  '/',
  authenticate,
  checkPermission('inventory.read'),
  categoryController.getAllCategories
);

/**
 * @route GET /api/v1/categories/:id
 * @desc Get category by ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  checkPermission('inventory.read'),
  categoryController.getCategoryById
);

/**
 * @route POST /api/v1/categories
 * @desc Create new category
 * @access Private
 */
router.post(
  '/',
  authenticate,
  checkPermission('inventory.create'),
  categoryValidator.validateCreateCategory,
  categoryController.createCategory
);

/**
 * @route PUT /api/v1/categories/:id
 * @desc Update category
 * @access Private
 */
router.put(
  '/:id',
  authenticate,
  checkPermission('inventory.update'),
  categoryValidator.validateUpdateCategory,
  categoryController.updateCategory
);

/**
 * @route DELETE /api/v1/categories/:id
 * @desc Delete category
 * @access Private
 */
router.delete(
  '/:id',
  authenticate,
  checkPermission('inventory.delete'),
  categoryController.deleteCategory
);

module.exports = router;