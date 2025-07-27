const { Model } = require('objection');
const BaseModel = require('../../../models/BaseModel');

/**
 * Location model
 * @extends BaseModel
 */
class Location extends BaseModel {
  static get tableName() {
    return 'locations';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'tenantId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string', maxLength: 1000 },
        address: { type: 'string', maxLength: 500 },
        city: { type: 'string', maxLength: 100 },
        state: { type: 'string', maxLength: 100 },
        country: { type: 'string', maxLength: 100 },
        postalCode: { type: 'string', maxLength: 20 },
        phone: { type: 'string', maxLength: 20 },
        email: { type: 'string', format: 'email', maxLength: 255 },
        isActive: { type: 'boolean', default: true },
        isDefault: { type: 'boolean', default: false },
        locationType: { 
          type: 'string', 
          enum: ['warehouse', 'store', 'production', 'transit', 'supplier', 'customer', 'other'] 
        },
        parentId: { type: ['string', 'null'], format: 'uuid' },
        tenantId: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const StockLevel = require('./StockLevel');
    const StockMovement = require('./StockMovement');
    const Tenant = require('../../../models/Tenant');

    return {
      stockLevels: {
        relation: Model.HasManyRelation,
        modelClass: StockLevel,
        join: {
          from: 'locations.id',
          to: 'stock_levels.locationId'
        }
      },
      stockMovements: {
        relation: Model.HasManyRelation,
        modelClass: StockMovement,
        join: {
          from: 'locations.id',
          to: 'stock_movements.locationId'
        }
      },
      parent: {
        relation: Model.BelongsToOneRelation,
        modelClass: Location,
        join: {
          from: 'locations.parentId',
          to: 'locations.id'
        }
      },
      children: {
        relation: Model.HasManyRelation,
        modelClass: Location,
        join: {
          from: 'locations.id',
          to: 'locations.parentId'
        }
      },
      tenant: {
        relation: Model.BelongsToOneRelation,
        modelClass: Tenant,
        join: {
          from: 'locations.tenantId',
          to: 'tenants.id'
        }
      }
    };
  }

  /**
   * Get location with full path
   * @param {Object} trx - Transaction object
   * @returns {Promise<Object>} Location with full path
   */
  async getWithPath(trx) {
    if (!this.parentId) {
      return {
        ...this,
        path: [this.name],
        fullPath: this.name
      };
    }
    
    const parent = await Location.query(trx)
      .findById(this.parentId);
    
    if (!parent) {
      return {
        ...this,
        path: [this.name],
        fullPath: this.name
      };
    }
    
    const parentWithPath = await parent.getWithPath(trx);
    const path = [...parentWithPath.path, this.name];
    
    return {
      ...this,
      path,
      fullPath: path.join(' > ')
    };
  }

  /**
   * Get all descendant locations
   * @param {Object} trx - Transaction object
   * @returns {Promise<Array>} Descendant locations
   */
  async getDescendants(trx) {
    const children = await Location.query(trx)
      .where('parentId', this.id);
    
    if (!children.length) {
      return [];
    }
    
    const descendants = [...children];
    
    for (const child of children) {
      const childDescendants = await child.getDescendants(trx);
      descendants.push(...childDescendants);
    }
    
    return descendants;
  }

  /**
   * Get total stock value
   * @param {Object} trx - Transaction object
   * @returns {Promise<number>} Total stock value
   */
  async getTotalStockValue(trx) {
    const { Product } = require('./Product');
    
    const stockLevels = await this.$relatedQuery('stockLevels', trx)
      .withGraphFetched('product');
    
    return stockLevels.reduce((total, stockLevel) => {
      const product = stockLevel.product;
      if (!product || !product.purchasePrice) {
        return total;
      }
      
      return total + (stockLevel.quantity * product.purchasePrice);
    }, 0);
  }
}

module.exports = Location;