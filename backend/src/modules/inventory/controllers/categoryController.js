const Category = require('../models/Category');
const Product = require('../models/Product');
const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/errors');
const { transaction } = require('objection');

/**
 * Get all categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const { 
      page, 
      limit, 
      search, 
      parentId,
      isActive,
      sort = 'name', 
      order = 'asc',
      flat = false
    } = req.query;
    
    let query = Category.query()
      .where('tenantId', req.user.tenantId)
      .orderBy(sort, order);
    
    if (search) {
      query = query.where(builder => {
        builder.where('name', 'ilike', `%${search}%`)
          .orWhere('description', 'ilike', `%${search}%`);
      });
    }
    
    if (parentId) {
      query = query.where('parentId', parentId === 'null' ? null : parentId);
    }
    
    if (isActive !== undefined) {
      query = query.where('isActive', isActive === 'true');
    }
    
    // If flat is false, return hierarchical structure
    if (flat === 'false') {
      // Get only root categories (parentId is null)
      query = query.where('parentId', null)
        .withGraphFetched('children');
      
      const categories = await query;
      
      res.json({
        success: true,
        data: categories
      });
      return;
    }
    
    // If pagination is requested
    if (page && limit) {
      const offset = (page - 1) * limit;
      
      const [categories, total] = await Promise.all([
        query.limit(limit).offset(offset),
        Category.query()
          .where('tenantId', req.user.tenantId)
          .modify(builder => {
            if (parentId) {
              builder.where('parentId', parentId === 'null' ? null : parentId);
            }
            if (isActive !== undefined) {
              builder.where('isActive', isActive === 'true');
            }
            if (search) {
              builder.where(subBuilder => {
                subBuilder.where('name', 'ilike', `%${search}%`)
                  .orWhere('description', 'ilike', `%${search}%`);
              });
            }
          })
          .resultSize()
      ]);
      
      res.json({
        success: true,
        data: {
          categories,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } else {
      // Return all categories without pagination
      const categories = await query;
      
      res.json({
        success: true,
        data: categories
      });
    }
  } catch (error) {
    logger.error('Error in getAllCategories:', error);
    next(error);
  }
};

/**
 * Get category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const category = await Category.query()
      .findById(id)
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('[parent, children]');
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    // Get category with full path
    const categoryWithPath = await category.getWithPath();
    
    // Get product count
    const productCount = await Product.query()
      .where('categoryId', id)
      .where('tenantId', req.user.tenantId)
      .resultSize();
    
    res.json({
      success: true,
      data: {
        ...categoryWithPath,
        productCount
      }
    });
  } catch (error) {
    logger.error('Error in getCategoryById:', error);
    next(error);
  }
};

/**
 * Create new category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.createCategory = async (req, res, next) => {
  const trx = await transaction.start(Category.knex());
  
  try {
    const { 
      name, 
      description, 
      parentId, 
      imageUrl,
      isActive,
      sortOrder
    } = req.body;
    
    // Check if parent category exists if provided
    if (parentId) {
      const parentCategory = await Category.query(trx)
        .findById(parentId)
        .where('tenantId', req.user.tenantId);
      
      if (!parentCategory) {
        throw new NotFoundError('Parent category not found');
      }
    }
    
    // Generate slug
    const slug = Category.generateSlug(name);
    
    // Create category
    const categoryData = {
      name,
      description,
      parentId,
      slug,
      imageUrl,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0,
      tenantId: req.user.tenantId,
      createdById: req.user.id
    };
    
    const category = await Category.query(trx)
      .insert(categoryData)
      .returning('*');
    
    await trx.commit();
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in createCategory:', error);
    next(error);
  }
};

/**
 * Update category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.updateCategory = async (req, res, next) => {
  const trx = await transaction.start(Category.knex());
  
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      parentId, 
      imageUrl,
      isActive,
      sortOrder
    } = req.body;
    
    // Check if category exists and belongs to tenant
    const existingCategory = await Category.query(trx)
      .findById(id)
      .where('tenantId', req.user.tenantId);
    
    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }
    
    // Check if parent category exists if provided
    if (parentId) {
      // Prevent circular reference
      if (parentId === id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CIRCULAR_REFERENCE',
            message: 'Category cannot be its own parent'
          }
        });
      }
      
      const parentCategory = await Category.query(trx)
        .findById(parentId)
        .where('tenantId', req.user.tenantId);
      
      if (!parentCategory) {
        throw new NotFoundError('Parent category not found');
      }
      
      // Check if parent is not a descendant of this category
      const descendants = await existingCategory.getDescendants(trx);
      const descendantIds = descendants.map(desc => desc.id);
      
      if (descendantIds.includes(parentId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CIRCULAR_REFERENCE',
            message: 'Cannot set a descendant as parent'
          }
        });
      }
    }
    
    // Generate slug if name is provided
    const slug = name ? Category.generateSlug(name) : existingCategory.slug;
    
    // Update category
    const categoryData = {
      name,
      description,
      parentId,
      slug,
      imageUrl,
      isActive,
      sortOrder,
      updatedAt: new Date().toISOString()
    };
    
    // Remove undefined values
    Object.keys(categoryData).forEach(key => {
      if (categoryData[key] === undefined) {
        delete categoryData[key];
      }
    });
    
    const updatedCategory = await Category.query(trx)
      .patchAndFetchById(id, categoryData);
    
    await trx.commit();
    
    res.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in updateCategory:', error);
    next(error);
  }
};

/**
 * Delete category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.deleteCategory = async (req, res, next) => {
  const trx = await transaction.start(Category.knex());
  
  try {
    const { id } = req.params;
    
    // Check if category exists and belongs to tenant
    const existingCategory = await Category.query(trx)
      .findById(id)
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('children');
    
    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }
    
    // Check if category has children
    if (existingCategory.children && existingCategory.children.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_HAS_CHILDREN',
          message: 'Cannot delete category with child categories'
        }
      });
    }
    
    // Check if category has products
    const productCount = await Product.query(trx)
      .where('categoryId', id)
      .where('tenantId', req.user.tenantId)
      .resultSize();
    
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_HAS_PRODUCTS',
          message: 'Cannot delete category with products'
        }
      });
    }
    
    // Delete category
    await Category.query(trx)
      .deleteById(id);
    
    await trx.commit();
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in deleteCategory:', error);
    next(error);
  }
};