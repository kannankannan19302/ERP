const { Model } = require('objection');
const BaseModel = require('../../../models/BaseModel');

/**
 * InvoiceItem model
 * @extends BaseModel
 */
class InvoiceItem extends BaseModel {
  static get tableName() {
    return 'invoice_items';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['invoiceId', 'productId', 'quantity', 'unitPrice'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        invoiceId: { type: 'string', format: 'uuid' },
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
    const Invoice = require('./Invoice');
    const Product = require('../../inventory/models/Product');

    return {
      invoice: {
        relation: Model.BelongsToOneRelation,
        modelClass: Invoice,
        join: {
          from: 'invoice_items.invoiceId',
          to: 'invoices.id'
        }
      },
      product: {
        relation: Model.BelongsToOneRelation,
        modelClass: Product,
        join: {
          from: 'invoice_items.productId',
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

module.exports = InvoiceItem;