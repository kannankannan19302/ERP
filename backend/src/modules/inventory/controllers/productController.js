const Product = require('../models/Product');
const Category = require('../models/Category');
const StockLevel = require('../models/StockLevel');
const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/errors');
const { transaction } = require('objection');

/**
 * Get all products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      categoryId,
      isActive,
      sort = 'name', 
      order = 'asc' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = Product.query()
      .where('tenantId', req.user.tenantId)
      .orderBy(sort, order)
      .limit(limit)
      .offset(offset)
      .withGraphFetched('category');
    
    if (search) {
      query = query.where(builder => {
        builder.where('name', 'ilike', `%${search}%`)
          .orWhere('sku', 'ilike', `%${search}%`)
          .orWhere('barcode', 'ilike', `%${search}%`);
      });
    }
    
    if (categoryId) {
      query = query.where('categoryId', categoryId);
    }
    
    if (isActive !== undefined) {
      query = query.where('isActive', isActive === 'true');
    }
    
    const [products, total] = await Promise.all([
      query,
      Product.query()
        .where('tenantId', req.user.tenantId)
        .modify(builder => {
          if (categoryId) {
            builder.where('categoryId', categoryId);
          }
          if (isActive !== undefined) {
            builder.where('isActive', isActive === 'true');
          }
          if (search) {
            builder.where(subBuilder => {
              subBuilder.where('name', 'ilike', `%${search}%`)
                .orWhere('sku', 'ilike', `%${search}%`)
                .orWhere('barcode', 'ilike', `%${search}%`);
            });
          }
        })
        .resultSize()
    ]);
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error in getAllProducts:', error);
    next(error);
  }
};

/**
 * Get product by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await Product.query()
      .findById(id)
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('[category, stockLevels.location]');
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Error in getProductById:', error);
    next(error);
  }
};

/**
 * Create new product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.createProduct = async (req, res, next) => {
  const trx = await transaction.start(Product.knex());
  
  try {
    const { 
      name, 
      description, 
      sku, 
      barcode, 
      categoryId, 
      unitOfMeasure,
      purchasePrice,
      sellingPrice,
      taxRate,
      reorderLevel,
      targetStockLevel,
      leadTime,
      isActive,
      isSellable,
      isPurchasable,
      isStockable,
      imageUrl,
      weight,
      weightUnit,
      dimensions,
      attributes,
      initialStock
    } = req.body;
    
    // Check if category exists if provided
    if (categoryId) {
      const category = await Category.query(trx)
        .findById(categoryId)
        .where('tenantId', req.user.tenantId);
      
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }
    
    // Generate SKU if not provided
    const productSku = sku || await Product.generateSKU(trx);
    
    // Create product
    const productData = {
      name,
      description,
      sku: productSku,
      barcode,
      categoryId,
      unitOfMeasure,
      purchasePrice,
      sellingPrice,
      taxRate,
      reorderLevel,
      targetStockLevel,
      leadTime,
      isActive: isActive !== undefined ? isActive : true,
      isSellable: isSellable !== undefined ? isSellable : true,
      isPurchasable: isPurchasable !== undefined ? isPurchasable : true,
      isStockable: isStockable !== undefined ? isStockable : true,
      imageUrl,
      weight,
      weightUnit,
      dimensions,
      attributes,
      tenantId: req.user.tenantId,
      createdById: req.user.id
    };
    
    const product = await Product.query(trx)
      .insert(productData)
      .returning('*');
    
    // Create initial stock if provided
    if (initialStock && initialStock.length > 0 && isStockable) {
      await Promise.all(
        initialStock.map(async stock => {
          await StockLevel.query(trx)
            .insert({
              productId: product.id,
              locationId: stock.locationId,
              quantity: stock.quantity,
              minimumLevel: stock.minimumLevel,
              maximumLevel: stock.maximumLevel,
              reorderPoint: stock.reorderPoint,
              reorderQuantity: stock.reorderQuantity,
              binLocation: stock.binLocation,
              tenantId: req.user.tenantId
            });
        })
      );
    }
    
    await trx.commit();
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in createProduct:', error);
    next(error);
  }
};

/**
 * Update product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.updateProduct = async (req, res, next) => {
  const trx = await transaction.start(Product.knex());
  
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      barcode, 
      categoryId, 
      unitOfMeasure,
      purchasePrice,
      sellingPrice,
      taxRate,
      reorderLevel,
      targetStockLevel,
      leadTime,
      isActive,
      isSellable,
      isPurchasable,
      isStockable,
      imageUrl,
      weight,
      weightUnit,
      dimensions,
      attributes
    } = req.body;
    
    // Check if product exists and belongs to tenant
    const existingProduct = await Product.query(trx)
      .findById(id)
      .where('tenantId', req.user.tenantId);
    
    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }
    
    // Check if category exists if provided
    if (categoryId) {
      const category = await Category.query(trx)
        .findById(categoryId)
        .where('tenantId', req.user.tenantId);
      
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }
    
    // Update product
    const productData = {
      name,
      description,
      barcode,
      categoryId,
      unitOfMeasure,
      purchasePrice,
      sellingPrice,
      taxRate,
      reorderLevel,
      targetStockLevel,
      leadTime,
      isActive,
      isSellable,
      isPurchasable,
      isStockable,
      imageUrl,
      weight,
      weightUnit,
      dimensions,
      attributes,
      updatedAt: new Date().toISOString()
    };
    
    // Remove undefined values
    Object.keys(productData).forEach(key => {
      if (productData[key] === undefined) {
        delete productData[key];
      }
    });
    
    const updatedProduct = await Product.query(trx)
      .patchAndFetchById(id, productData);
    
    await trx.commit();
    
    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in updateProduct:', error);
    next(error);
  }
};

/**
 * Delete product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.deleteProduct = async (req, res, next) => {
  const trx = await transaction.start(Product.knex());
  
  try {
    const { id } = req.params;
    
    // Check if product exists and belongs to tenant
    const existingProduct = await Product.query(trx)
      .findById(id)
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('[stockLevels, salesOrderItems, invoiceItems]');
    
    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }
    
    // Check if product has related records
    if (
      (existingProduct.stockLevels && existingProduct.stockLevels.length > 0) ||
      (existingProduct.salesOrderItems && existingProduct.salesOrderItems.length > 0) ||
      (existingProduct.invoiceItems && existingProduct.invoiceItems.length > 0)
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PRODUCT_HAS_RELATED_RECORDS',
          message: 'Cannot delete product with related stock levels, sales orders, or invoices'
        }
      });
    }
    
    // Delete product
    await Product.query(trx)
      .deleteById(id);
    
    await trx.commit();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in deleteProduct:', error);
    next(error);
  }
};

/**
 * Get product stock
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getProductStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if product exists and belongs to tenant
    const product = await Product.query()
      .findById(id)
      .where('tenantId', req.user.tenantId);
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    
    // Get stock levels
    const stockLevels = await StockLevel.query()
      .where('productId', id)
      .withGraphFetched('location');
    
    // Calculate total stock
    const totalStock = stockLevels.reduce((total, stock) => total + stock.quantity, 0);
    
    res.json({
      success: true,
      data: {
        stockLevels,
        totalStock
      }
    });
  } catch (error) {
    logger.error('Error in getProductStock:', error);
    next(error);
  }
};