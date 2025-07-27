const { Model } = require('objection');
const BaseModel = require('../../../models/BaseModel');

/**
 * Product model
 * @extends BaseModel
 */
class Product extends BaseModel {
  static get tableName() {
    return 'products';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'sku', 'tenantId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string', maxLength: 1000 },
        sku: { type: 'string', maxLength: 50 },
        barcode: { type: 'string', maxLength: 50 },
        categoryId: { type: ['string', 'null'], format: 'uuid' },
        unitOfMeasure: { type: 'string', maxLength: 50 },
        purchasePrice: { type: 'number' },
        sellingPrice: { type: 'number' },
        taxRate: { type: 'number' },
        reorderLevel: { type: 'number' },
        targetStockLevel: { type: 'number' },
        leadTime: { type: 'number' },
        isActive: { type: 'boolean', default: true },
        isSellable: { type: 'boolean', default: true },
        isPurchasable: { type: 'boolean', default: true },
        isStockable: { type: 'boolean', default: true },
        imageUrl: { type: ['string', 'null'], maxLength: 500 },
        weight: { type: 'number' },
        weightUnit: { type: 'string', maxLength: 20 },
        dimensions: {
          type: 'object',
          properties: {
            length: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' },
            unit: { type: 'string', maxLength: 20 }
          }
        },
        attributes: { type: 'object' },
        tenantId: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Category = require('./Category');
    const StockLevel = require('./StockLevel');
    const SalesOrderItem = require('../../sales/models/SalesOrderItem');
    const InvoiceItem = require('../../sales/models/InvoiceItem');
    const Tenant = require('../../../models/Tenant');

    return {
      category: {
        relation: Model.BelongsToOneRelation,
        modelClass: Category,
        join: {
          from: 'products.categoryId',
          to: 'categories.id'
        }
      },
      stockLevels: {
        relation: Model.HasManyRelation,
        modelClass: StockLevel,
        join: {
          from: 'products.id',
          to: 'stock_levels.productId'
        }
      },
      salesOrderItems: {
        relation: Model.HasManyRelation,
        modelClass: SalesOrderItem,
        join: {
          from: 'products.id',
          to: 'sales_order_items.productId'
        }
      },
      invoiceItems: {
        relation: Model.HasManyRelation,
        modelClass: InvoiceItem,
        join: {
          from: 'products.id',
          to: 'invoice_items.productId'
        }
      },
      tenant: {
        relation: Model.BelongsToOneRelation,
        modelClass: Tenant,
        join: {
          from: 'products.tenantId',
          to: 'tenants.id'
        }
      }
    };
  }

  /**
   * Get current stock level
   * @param {Object} trx - Transaction object
   * @param {string} locationId - Location ID (optional)
   * @returns {Promise<number>} Current stock level
   */
  async getCurrentStock(trx, locationId = null) {
    const { StockLevel } = require('./StockLevel');
    
    const query = StockLevel.query(trx)
      .where('productId', this.id);
    
    if (locationId) {
      query.where('locationId', locationId);
    }
    
    const stockLevels = await query;
    
    return stockLevels.reduce((total, stock) => total + stock.quantity, 0);
  }

  /**
   * Check if product is in stock
   * @param {Object} trx - Transaction object
   * @param {number} quantity - Quantity to check
   * @param {string} locationId - Location ID (optional)
   * @returns {Promise<boolean>} True if product is in stock
   */
  async isInStock(trx, quantity = 1, locationId = null) {
    const currentStock = await this.getCurrentStock(trx, locationId);
    return currentStock >= quantity;
  }

  /**
   * Generate SKU
   * @param {Object} trx - Transaction object
   * @param {string} prefix - SKU prefix
   * @returns {Promise<string>} Generated SKU
   */
  static async generateSKU(trx, prefix = 'P') {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const lastProduct = await this.query(trx)
      .where('sku', 'like', `${prefix}${year}${month}%`)
      .orderBy('sku', 'desc')
      .first();
    
    let sequence = 1;
    if (lastProduct) {
      const lastSequence = parseInt(lastProduct.sku.substring(5), 10);
      sequence = lastSequence + 1;
    }
    
    return `${prefix}${year}${month}${sequence.toString().padStart(4, '0')}`;
  }
}

module.exports = Product;