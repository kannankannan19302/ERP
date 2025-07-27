const { Model } = require('objection');
const BaseModel = require('../../../models/BaseModel');

/**
 * Invoice model
 * @extends BaseModel
 */
class Invoice extends BaseModel {
  static get tableName() {
    return 'invoices';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['customerId', 'invoiceDate', 'status', 'tenantId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        invoiceNumber: { type: 'string', maxLength: 50 },
        customerId: { type: 'string', format: 'uuid' },
        salesOrderId: { type: 'string', format: 'uuid' },
        invoiceDate: { type: 'string', format: 'date-time' },
        dueDate: { type: 'string', format: 'date-time' },
        status: { 
          type: 'string', 
          enum: ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'] 
        },
        notes: { type: 'string', maxLength: 1000 },
        subtotal: { type: 'number' },
        taxAmount: { type: 'number' },
        discountAmount: { type: 'number' },
        total: { type: 'number' },
        amountPaid: { type: 'number' },
        balanceDue: { type: 'number' },
        tenantId: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Customer = require('./Customer');
    const SalesOrder = require('./SalesOrder');
    const InvoiceItem = require('./InvoiceItem');
    const Payment = require('./Payment');
    const Tenant = require('../../../models/Tenant');
    const User = require('../../../models/User');

    return {
      customer: {
        relation: Model.BelongsToOneRelation,
        modelClass: Customer,
        join: {
          from: 'invoices.customerId',
          to: 'customers.id'
        }
      },
      salesOrder: {
        relation: Model.BelongsToOneRelation,
        modelClass: SalesOrder,
        join: {
          from: 'invoices.salesOrderId',
          to: 'sales_orders.id'
        }
      },
      items: {
        relation: Model.HasManyRelation,
        modelClass: InvoiceItem,
        join: {
          from: 'invoices.id',
          to: 'invoice_items.invoiceId'
        }
      },
      payments: {
        relation: Model.HasManyRelation,
        modelClass: Payment,
        join: {
          from: 'invoices.id',
          to: 'payments.invoiceId'
        }
      },
      tenant: {
        relation: Model.BelongsToOneRelation,
        modelClass: Tenant,
        join: {
          from: 'invoices.tenantId',
          to: 'tenants.id'
        }
      },
      createdBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'invoices.createdById',
          to: 'users.id'
        }
      }
    };
  }

  /**
   * Generate invoice number
   * @param {Object} trx - Transaction object
   * @returns {Promise<string>} Generated invoice number
   */
  static async generateInvoiceNumber(trx) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const lastInvoice = await this.query(trx)
      .where('invoiceNumber', 'like', `INV-${year}${month}-%`)
      .orderBy('invoiceNumber', 'desc')
      .first();
    
    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2], 10);
      sequence = lastSequence + 1;
    }
    
    return `INV-${year}${month}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate invoice totals
   * @returns {Object} Invoice totals
   */
  calculateTotals() {
    if (!this.items || !this.items.length) {
      return {
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        total: 0,
        balanceDue: 0
      };
    }
    
    const subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = this.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const discountAmount = this.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const total = subtotal + taxAmount - discountAmount;
    const amountPaid = this.payments ? this.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
    const balanceDue = total - amountPaid;
    
    return {
      subtotal,
      taxAmount,
      discountAmount,
      total,
      amountPaid,
      balanceDue
    };
  }

  /**
   * Update invoice status based on payments
   * @returns {string} Updated status
   */
  updateStatus() {
    if (this.status === 'cancelled') {
      return this.status;
    }
    
    const { total, amountPaid, balanceDue } = this.calculateTotals();
    
    if (balanceDue <= 0) {
      return 'paid';
    } else if (amountPaid > 0) {
      return 'partially_paid';
    } else if (new Date() > new Date(this.dueDate)) {
      return 'overdue';
    }
    
    return this.status;
  }
}

module.exports = Invoice;