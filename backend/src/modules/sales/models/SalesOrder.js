const { Model } = require('objection');
const BaseModel = require('../../../models/BaseModel');

/**
 * SalesOrder model
 * @extends BaseModel
 */
class SalesOrder extends BaseModel {
  static get tableName() {
    return 'sales_orders';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['customerId', 'orderDate', 'status', 'tenantId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        orderNumber: { type: 'string', maxLength: 50 },
        customerId: { type: 'string', format: 'uuid' },
        orderDate: { type: 'string', format: 'date-time' },
        deliveryDate: { type: 'string', format: 'date-time' },
        status: { 
          type: 'string', 
          enum: ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] 
        },
        shippingAddress: { type: 'string', maxLength: 500 },
        shippingCity: { type: 'string', maxLength: 100 },
        shippingState: { type: 'string', maxLength: 100 },
        shippingCountry: { type: 'string', maxLength: 100 },
        shippingPostalCode: { type: 'string', maxLength: 20 },
        notes: { type: 'string', maxLength: 1000 },
        subtotal: { type: 'number' },
        taxAmount: { type: 'number' },
        discountAmount: { type: 'number' },
        total: { type: 'number' },
        tenantId: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Customer = require('./Customer');
    const SalesOrderItem = require('./SalesOrderItem');
    const Invoice = require('./Invoice');
    const Tenant = require('../../../models/Tenant');
    const User = require('../../../models/User');

    return {
      customer: {
        relation: Model.BelongsToOneRelation,
        modelClass: Customer,
        join: {
          from: 'sales_orders.customerId',
          to: 'customers.id'
        }
      },
      items: {
        relation: Model.HasManyRelation,
        modelClass: SalesOrderItem,
        join: {
          from: 'sales_orders.id',
          to: 'sales_order_items.salesOrderId'
        }
      },
      invoices: {
        relation: Model.HasManyRelation,
        modelClass: Invoice,
        join: {
          from: 'sales_orders.id',
          to: 'invoices.salesOrderId'
        }
      },
      tenant: {
        relation: Model.BelongsToOneRelation,
        modelClass: Tenant,
        join: {
          from: 'sales_orders.tenantId',
          to: 'tenants.id'
        }
      },
      createdBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'sales_orders.createdById',
          to: 'users.id'
        }
      }
    };
  }

  /**
   * Generate order number
   * @param {Object} trx - Transaction object
   * @returns {Promise<string>} Generated order number
   */
  static async generateOrderNumber(trx) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const lastOrder = await this.query(trx)
      .where('orderNumber', 'like', `SO-${year}${month}-%`)
      .orderBy('orderNumber', 'desc')
      .first();
    
    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2], 10);
      sequence = lastSequence + 1;
    }
    
    return `SO-${year}${month}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate order totals
   * @returns {Object} Order totals
   */
  calculateTotals() {
    if (!this.items || !this.items.length) {
      return {
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        total: 0
      };
    }
    
    const subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = this.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const discountAmount = this.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const total = subtotal + taxAmount - discountAmount;
    
    return {
      subtotal,
      taxAmount,
      discountAmount,
      total
    };
  }
}

module.exports = SalesOrder;