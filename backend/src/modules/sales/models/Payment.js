const { Model } = require('objection');
const BaseModel = require('../../../models/BaseModel');

/**
 * Payment model
 * @extends BaseModel
 */
class Payment extends BaseModel {
  static get tableName() {
    return 'payments';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['invoiceId', 'amount', 'paymentDate', 'paymentMethod', 'tenantId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        invoiceId: { type: 'string', format: 'uuid' },
        amount: { type: 'number', minimum: 0 },
        paymentDate: { type: 'string', format: 'date-time' },
        paymentMethod: { 
          type: 'string', 
          enum: ['cash', 'check', 'credit_card', 'bank_transfer', 'online', 'other'] 
        },
        referenceNumber: { type: 'string', maxLength: 100 },
        notes: { type: 'string', maxLength: 1000 },
        tenantId: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Invoice = require('./Invoice');
    const Tenant = require('../../../models/Tenant');
    const User = require('../../../models/User');

    return {
      invoice: {
        relation: Model.BelongsToOneRelation,
        modelClass: Invoice,
        join: {
          from: 'payments.invoiceId',
          to: 'invoices.id'
        }
      },
      tenant: {
        relation: Model.BelongsToOneRelation,
        modelClass: Tenant,
        join: {
          from: 'payments.tenantId',
          to: 'tenants.id'
        }
      },
      createdBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'payments.createdById',
          to: 'users.id'
        }
      }
    };
  }

  /**
   * Process payment and update invoice
   * @param {Object} trx - Transaction object
   * @returns {Promise<Object>} Updated invoice
   */
  async processPayment(trx) {
    const { Invoice } = require('./Invoice');
    
    // Get the invoice
    const invoice = await Invoice.query(trx)
      .findById(this.invoiceId)
      .withGraphFetched('payments');
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Calculate new totals
    const { total, amountPaid, balanceDue } = invoice.calculateTotals();
    
    // Update invoice with new payment amount and status
    const updatedInvoice = await Invoice.query(trx)
      .patchAndFetchById(this.invoiceId, {
        amountPaid: amountPaid + this.amount,
        balanceDue: balanceDue - this.amount,
        status: invoice.updateStatus()
      });
    
    return updatedInvoice;
  }
}

module.exports = Payment;