const { Model } = require('objection');
const BaseModel = require('../../../models/BaseModel');

/**
 * Customer model
 * @extends BaseModel
 */
class Customer extends BaseModel {
  static get tableName() {
    return 'customers';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'email', 'tenantId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        email: { type: 'string', format: 'email', maxLength: 255 },
        phone: { type: 'string', maxLength: 20 },
        address: { type: 'string', maxLength: 500 },
        city: { type: 'string', maxLength: 100 },
        state: { type: 'string', maxLength: 100 },
        country: { type: 'string', maxLength: 100 },
        postalCode: { type: 'string', maxLength: 20 },
        notes: { type: 'string', maxLength: 1000 },
        customerType: { type: 'string', enum: ['individual', 'business', 'government'] },
        creditLimit: { type: 'number' },
        isActive: { type: 'boolean', default: true },
        tenantId: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const SalesOrder = require('./SalesOrder');
    const Invoice = require('./Invoice');
    const Tenant = require('../../../models/Tenant');

    return {
      salesOrders: {
        relation: Model.HasManyRelation,
        modelClass: SalesOrder,
        join: {
          from: 'customers.id',
          to: 'sales_orders.customerId'
        }
      },
      invoices: {
        relation: Model.HasManyRelation,
        modelClass: Invoice,
        join: {
          from: 'customers.id',
          to: 'invoices.customerId'
        }
      },
      tenant: {
        relation: Model.BelongsToOneRelation,
        modelClass: Tenant,
        join: {
          from: 'customers.tenantId',
          to: 'tenants.id'
        }
      }
    };
  }

  /**
   * Get customer with sales statistics
   * @param {Object} trx - Transaction object
   * @returns {Promise<Object>} Customer with sales statistics
   */
  async getWithStats(trx) {
    const { Invoice } = require('./Invoice');
    
    const stats = await Invoice.query(trx)
      .where('customerId', this.id)
      .select(
        Invoice.raw('SUM(total) as totalSales'),
        Invoice.raw('COUNT(*) as invoiceCount'),
        Invoice.raw('AVG(total) as averageSale')
      )
      .first();
    
    return {
      ...this,
      stats: {
        totalSales: stats?.totalSales || 0,
        invoiceCount: stats?.invoiceCount || 0,
        averageSale: stats?.averageSale || 0
      }
    };
  }
}

module.exports = Customer;