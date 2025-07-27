const { Model } = require('objection');
const BaseModel = require('../../../models/BaseModel');

/**
 * StockMovement model
 * @extends BaseModel
 */
class StockMovement extends BaseModel {
  static get tableName() {
    return 'stock_movements';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['productId', 'locationId', 'quantity', 'reason', 'tenantId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        stockLevelId: { type: 'string', format: 'uuid' },
        productId: { type: 'string', format: 'uuid' },
        locationId: { type: 'string', format: 'uuid' },
        quantity: { type: 'number' },
        reason: { 
          type: 'string', 
          enum: [
            'purchase', 
            'sale', 
            'return', 
            'adjustment', 
            'transfer_in', 
            'transfer_out', 
            'inventory_count', 
            'production', 
            'consumption', 
            'waste', 
            'other'
          ] 
        },
        notes: { type: 'string', maxLength: 1000 },
        referenceId: { type: ['string', 'null'], format: 'uuid' },
        referenceType: { 
          type: ['string', 'null'], 
          enum: [
            'purchase_order', 
            'sales_order', 
            'inventory_adjustment', 
            'stock_transfer', 
            'production_order', 
            'other'
          ] 
        },
        createdById: { type: 'string', format: 'uuid' },
        tenantId: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Product = require('./Product');
    const Location = require('./Location');
    const StockLevel = require('./StockLevel');
    const Tenant = require('../../../models/Tenant');
    const User = require('../../../models/User');

    return {
      product: {
        relation: Model.BelongsToOneRelation,
        modelClass: Product,
        join: {
          from: 'stock_movements.productId',
          to: 'products.id'
        }
      },
      location: {
        relation: Model.BelongsToOneRelation,
        modelClass: Location,
        join: {
          from: 'stock_movements.locationId',
          to: 'locations.id'
        }
      },
      stockLevel: {
        relation: Model.BelongsToOneRelation,
        modelClass: StockLevel,
        join: {
          from: 'stock_movements.stockLevelId',
          to: 'stock_levels.id'
        }
      },
      tenant: {
        relation: Model.BelongsToOneRelation,
        modelClass: Tenant,
        join: {
          from: 'stock_movements.tenantId',
          to: 'tenants.id'
        }
      },
      createdBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'stock_movements.createdById',
          to: 'users.id'
        }
      }
    };
  }

  /**
   * Get movement type (in/out)
   * @returns {string} Movement type
   */
  getMovementType() {
    if (this.quantity > 0) {
      return 'in';
    } else if (this.quantity < 0) {
      return 'out';
    }
    return 'adjustment';
  }

  /**
   * Get formatted quantity
   * @returns {string} Formatted quantity
   */
  getFormattedQuantity() {
    const type = this.getMovementType();
    const absQuantity = Math.abs(this.quantity);
    
    if (type === 'in') {
      return `+${absQuantity}`;
    } else if (type === 'out') {
      return `-${absQuantity}`;
    }
    return '±0';
  }
}

module.exports = StockMovement;