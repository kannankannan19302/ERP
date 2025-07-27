const { Model } = require('objection');
const BaseModel = require('../../../models/BaseModel');

/**
 * SalesOrderItem model
 * @extends BaseModel
 */
class SalesOrderItem extends BaseModel {
  static get tableName() {
    return 'sales_order_items';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['salesOrderId', 'productId', 'quantity', 'unitPrice'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        salesOrderId: { type: 'string', format: 'uuid' },
        productId: { type: 'string', format: 'uuid' },
        description: { type: 'string', maxLength: 500 },
        quantity: { type: 'number', minimum: 0 },
        unitPrice: { type: 'number', minimum: 0 },
        taxRate: { type: 'number', minimum: 0 },
        taxAmount: { type: 'number', minimum: 0 },
        discountRate: { type: 'number', minimum: 0 },
        discountAmount: { type: 'number', minimum: 0 },
        subtotal: { type: 'number', minimum: 0 },
        total: { type: 'number', minimum: 0 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const SalesOrder = require('./SalesOrder');
    const Product = require('../../inventory/models/Product');

    return {
      salesOrder: {
        relation: Model.BelongsToOneRelation,
        modelClass: SalesOrder,
        join: {
          from: 'sales_order_items.salesOrderId',
          to: 'sales_orders.id'
        }
      },
      product: {
        relation: Model.BelongsToOneRelation,
        modelClass: Product,
        join: {
          from: 'sales_order_items.productId',
          to: 'products.id'
        }
      }
    };
  }

  /**
   * Calculate item totals
   * @returns {Object} Item totals
   */
  calculateTotals() {
    const subtotal = this.quantity * this.unitPrice;
    const taxAmount = subtotal * (this.taxRate || 0) / 100;
    const discountAmount = subtotal * (this.discountRate || 0) / 100;
    const total = subtotal + taxAmount - discountAmount;
    
    return {
      subtotal,
      taxAmount,
      discountAmount,
      total
    };
  }
}

module.exports = SalesOrderItem;