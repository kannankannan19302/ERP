const StockLevel = require('../models/StockLevel');
const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const Location = require('../models/Location');
const logger = require('../../../utils/logger');
const { NotFoundError, BadRequestError } = require('../../../utils/errors');
const { transaction } = require('objection');

/**
 * Get stock levels
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getStockLevels = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      productId, 
      locationId,
      status,
      sort = 'product.name', 
      order = 'asc' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = StockLevel.query()
      .where('stockLevels.tenantId', req.user.tenantId)
      .withGraphFetched('[product, location]')
      .orderBy(sort, order)
      .limit(limit)
      .offset(offset);
    
    if (productId) {
      query = query.where('productId', productId);
    }
    
    if (locationId) {
      query = query.where('locationId', locationId);
    }
    
    if (status) {
      switch (status) {
        case 'out_of_stock':
          query = query.where('quantity', '<=', 0);
          break;
        case 'low_stock':
          query = query.whereRaw('quantity > 0 AND quantity <= "minimumLevel"');
          break;
        case 'in_stock':
          query = query.whereRaw('quantity > "minimumLevel"');
          break;
        case 'overstock':
          query = query.whereRaw('quantity > "maximumLevel"');
          break;
        case 'reorder':
          query = query.whereRaw('quantity <= "reorderPoint"');
          break;
      }
    }
    
    const [stockLevels, total] = await Promise.all([
      query,
      StockLevel.query()
        .where('tenantId', req.user.tenantId)
        .modify(builder => {
          if (productId) {
            builder.where('productId', productId);
          }
          if (locationId) {
            builder.where('locationId', locationId);
          }
          if (status) {
            switch (status) {
              case 'out_of_stock':
                builder.where('quantity', '<=', 0);
                break;
              case 'low_stock':
                builder.whereRaw('quantity > 0 AND quantity <= "minimumLevel"');
                break;
              case 'in_stock':
                builder.whereRaw('quantity > "minimumLevel"');
                break;
              case 'overstock':
                builder.whereRaw('quantity > "maximumLevel"');
                break;
              case 'reorder':
                builder.whereRaw('quantity <= "reorderPoint"');
                break;
            }
          }
        })
        .resultSize()
    ]);
    
    // Add stock status to each stock level
    const stockLevelsWithStatus = stockLevels.map(stockLevel => ({
      ...stockLevel,
      status: stockLevel.getStockStatus()
    }));
    
    res.json({
      success: true,
      data: {
        stockLevels: stockLevelsWithStatus,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error in getStockLevels:', error);
    next(error);
  }
};

/**
 * Get stock level by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getStockLevelById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const stockLevel = await StockLevel.query()
      .findById(id)
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('[product, location]');
    
    if (!stockLevel) {
      throw new NotFoundError('Stock level not found');
    }
    
    // Add stock status
    const stockLevelWithStatus = {
      ...stockLevel,
      status: stockLevel.getStockStatus()
    };
    
    res.json({
      success: true,
      data: stockLevelWithStatus
    });
  } catch (error) {
    logger.error('Error in getStockLevelById:', error);
    next(error);
  }
};

/**
 * Create stock level
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.createStockLevel = async (req, res, next) => {
  const trx = await transaction.start(StockLevel.knex());
  
  try {
    const { 
      productId, 
      locationId, 
      quantity, 
      minimumLevel, 
      maximumLevel, 
      reorderPoint, 
      reorderQuantity, 
      binLocation 
    } = req.body;
    
    // Check if product exists and belongs to tenant
    const product = await Product.query(trx)
      .findById(productId)
      .where('tenantId', req.user.tenantId);
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    
    // Check if product is stockable
    if (!product.isStockable) {
      throw new BadRequestError('Product is not stockable');
    }
    
    // Check if location exists and belongs to tenant
    const location = await Location.query(trx)
      .findById(locationId)
      .where('tenantId', req.user.tenantId);
    
    if (!location) {
      throw new NotFoundError('Location not found');
    }
    
    // Check if stock level already exists for this product and location
    const existingStockLevel = await StockLevel.query(trx)
      .where('productId', productId)
      .where('locationId', locationId)
      .where('tenantId', req.user.tenantId)
      .first();
    
    if (existingStockLevel) {
      throw new BadRequestError('Stock level already exists for this product and location');
    }
    
    // Create stock level
    const stockLevelData = {
      productId,
      locationId,
      quantity: quantity || 0,
      minimumLevel,
      maximumLevel,
      reorderPoint,
      reorderQuantity,
      binLocation,
      tenantId: req.user.tenantId
    };
    
    const stockLevel = await StockLevel.query(trx)
      .insert(stockLevelData)
      .returning('*');
    
    // Create stock movement if quantity > 0
    if (quantity > 0) {
      await StockMovement.query(trx)
        .insert({
          stockLevelId: stockLevel.id,
          productId,
          locationId,
          quantity,
          reason: 'inventory_count',
          notes: 'Initial stock level',
          createdById: req.user.id,
          tenantId: req.user.tenantId
        });
    }
    
    await trx.commit();
    
    res.status(201).json({
      success: true,
      data: stockLevel,
      message: 'Stock level created successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in createStockLevel:', error);
    next(error);
  }
};

/**
 * Update stock level
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.updateStockLevel = async (req, res, next) => {
  const trx = await transaction.start(StockLevel.knex());
  
  try {
    const { id } = req.params;
    const { 
      minimumLevel, 
      maximumLevel, 
      reorderPoint, 
      reorderQuantity, 
      binLocation 
    } = req.body;
    
    // Check if stock level exists and belongs to tenant
    const existingStockLevel = await StockLevel.query(trx)
      .findById(id)
      .where('tenantId', req.user.tenantId);
    
    if (!existingStockLevel) {
      throw new NotFoundError('Stock level not found');
    }
    
    // Update stock level
    const stockLevelData = {
      minimumLevel,
      maximumLevel,
      reorderPoint,
      reorderQuantity,
      binLocation,
      updatedAt: new Date().toISOString()
    };
    
    // Remove undefined values
    Object.keys(stockLevelData).forEach(key => {
      if (stockLevelData[key] === undefined) {
        delete stockLevelData[key];
      }
    });
    
    const updatedStockLevel = await StockLevel.query(trx)
      .patchAndFetchById(id, stockLevelData);
    
    await trx.commit();
    
    res.json({
      success: true,
      data: updatedStockLevel,
      message: 'Stock level updated successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in updateStockLevel:', error);
    next(error);
  }
};

/**
 * Adjust stock
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.adjustStock = async (req, res, next) => {
  const trx = await transaction.start(StockLevel.knex());
  
  try {
    const { id } = req.params;
    const { quantity, reason, notes, referenceId, referenceType } = req.body;
    
    // Check if stock level exists and belongs to tenant
    const stockLevel = await StockLevel.query(trx)
      .findById(id)
      .where('tenantId', req.user.tenantId);
    
    if (!stockLevel) {
      throw new NotFoundError('Stock level not found');
    }
    
    // Calculate adjustment quantity
    const adjustmentQuantity = quantity - stockLevel.quantity;
    
    if (adjustmentQuantity === 0) {
      throw new BadRequestError('No adjustment needed');
    }
    
    // Update stock level
    const updatedStockLevel = await stockLevel.updateStock(
      trx,
      adjustmentQuantity,
      reason || 'adjustment',
      referenceId,
      referenceType,
      req.user.id
    );
    
    await trx.commit();
    
    res.json({
      success: true,
      data: updatedStockLevel,
      message: 'Stock adjusted successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in adjustStock:', error);
    next(error);
  }
};

/**
 * Get stock movements
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getStockMovements = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      productId, 
      locationId,
      reason,
      startDate,
      endDate,
      sort = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = StockMovement.query()
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('[product, location, createdBy]')
      .orderBy(sort, order)
      .limit(limit)
      .offset(offset);
    
    if (productId) {
      query = query.where('productId', productId);
    }
    
    if (locationId) {
      query = query.where('locationId', locationId);
    }
    
    if (reason) {
      query = query.where('reason', reason);
    }
    
    if (startDate) {
      query = query.where('createdAt', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('createdAt', '<=', endDate);
    }
    
    const [stockMovements, total] = await Promise.all([
      query,
      StockMovement.query()
        .where('tenantId', req.user.tenantId)
        .modify(builder => {
          if (productId) {
            builder.where('productId', productId);
          }
          if (locationId) {
            builder.where('locationId', locationId);
          }
          if (reason) {
            builder.where('reason', reason);
          }
          if (startDate) {
            builder.where('createdAt', '>=', startDate);
          }
          if (endDate) {
            builder.where('createdAt', '<=', endDate);
          }
        })
        .resultSize()
    ]);
    
    res.json({
      success: true,
      data: {
        stockMovements,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error in getStockMovements:', error);
    next(error);
  }
};