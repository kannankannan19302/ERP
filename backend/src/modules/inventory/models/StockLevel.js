const { Model } = require('objection');
const BaseModel = require('../../../models/BaseModel');

/**
 * StockLevel model
 * @extends BaseModel
 */
class StockLevel extends BaseModel {
  static get tableName() {
    return 'stock_levels';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['productId', 'locationId', 'quantity', 'tenantId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        productId: { type: 'string', format: 'uuid' },
        locationId: { type: 'string', format: 'uuid' },
        quantity: { type: 'number' },
        minimumLevel: { type: 'number' },
        maximumLevel: { type: 'number' },
        reorderPoint: { type: 'number' },
        reorderQuantity: { type: 'number' },
        binLocation: { type: 'string', maxLength: 100 },
        lastCountDate: { type: 'string', format: 'date-time' },
        tenantId: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Product = require('./Product');
    const Location = require('./Location');
    const StockMovement = require('./StockMovement');
    const Tenant = require('../../../models/Tenant');

    return {
      product: {
        relation: Model.BelongsToOneRelation,
        modelClass: Product,
        join: {
          from: 'stock_levels.productId',
          to: 'products.id'
        }
      },
      location: {
        relation: Model.BelongsToOneRelation,
        modelClass: Location,
        join: {
          from: 'stock_levels.locationId',
          to: 'locations.id'
        }
      },
      stockMovements: {
        relation: Model.HasManyRelation,
        modelClass: StockMovement,
        join: {
          from: 'stock_levels.id',
          to: 'stock_movements.stockLevelId'
        }
      },
      tenant: {
        relation: Model.BelongsToOneRelation,
        modelClass: Tenant,
        join: {
          from: 'stock_levels.tenantId',
          to: 'tenants.id'
        }
      }
    };
  }

  /**
   * Update stock quantity
   * @param {Object} trx - Transaction object
   * @param {number} quantity - Quantity to add (positive) or subtract (negative)
   * @param {string} reason - Reason for stock update
   * @param {string} referenceId - Reference ID (e.g., sales order ID)
   * @param {string} referenceType - Reference type (e.g., 'sales_order')
   * @param {string} userId - User ID who performed the update
   * @returns {Promise<Object>} Updated stock level
   */
  async updateStock(trx, quantity, reason, referenceId, referenceType, userId) {
    const { StockMovement } = require('./StockMovement');
    
    // Create stock movement
    await StockMovement.query(trx)
      .insert({
        stockLevelId: this.id,
        productId: this.productId,
        locationId: this.locationId,
        quantity,
        reason,
        referenceId,
        referenceType,
        createdById: userId,
        tenantId: this.tenantId
      });
    
    // Update stock level
    const newQuantity = this.quantity + quantity;
    
    return this.$query(trx)
      .patchAndFetch({
        quantity: newQuantity,
        updatedAt: new Date().toISOString()
      });
  }

  /**
   * Check if stock level is below reorder point
   * @returns {boolean} True if stock level is below reorder point
   */
  isBelowReorderPoint() {
    if (!this.reorderPoint) {
      return false;
    }
    
    return this.quantity <= this.reorderPoint;
  }

  /**
   * Get stock status
   * @returns {string} Stock status
   */
  getStockStatus() {
    if (!this.minimumLevel) {
      return this.quantity > 0 ? 'in_stock' : 'out_of_stock';
    }
    
    if (this.quantity <= 0) {
      return 'out_of_stock';
    }
    
    if (this.quantity < this.minimumLevel) {
      return 'low_stock';
    }
    
    if (this.maximumLevel && this.quantity > this.maximumLevel) {
      return 'overstock';
    }
    
    return 'in_stock';
  }
}

module.exports = StockLevel;