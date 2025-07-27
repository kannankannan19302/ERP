const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');
const SalesOrder = require('../models/SalesOrder');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const logger = require('../../../utils/logger');
const { NotFoundError, BadRequestError } = require('../../../utils/errors');
const { transaction } = require('objection');

/**
 * Get all invoices
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getAllInvoices = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status,
      customerId,
      sort = 'invoiceDate', 
      order = 'desc' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = Invoice.query()
      .where('tenantId', req.user.tenantId)
      .orderBy(sort, order)
      .limit(limit)
      .offset(offset)
      .withGraphFetched('customer');
    
    if (search) {
      query = query.where(builder => {
        builder.where('invoiceNumber', 'ilike', `%${search}%`)
          .orWhereExists(
            Customer.query()
              .whereColumn('customers.id', 'invoices.customerId')
              .where('name', 'ilike', `%${search}%`)
          );
      });
    }
    
    if (status) {
      query = query.where('status', status);
    }
    
    if (customerId) {
      query = query.where('customerId', customerId);
    }
    
    const [invoices, total] = await Promise.all([
      query,
      Invoice.query()
        .where('tenantId', req.user.tenantId)
        .modify(builder => {
          if (status) {
            builder.where('status', status);
          }
          if (customerId) {
            builder.where('customerId', customerId);
          }
          if (search) {
            builder.where(subBuilder => {
              subBuilder.where('invoiceNumber', 'ilike', `%${search}%`)
                .orWhereExists(
                  Customer.query()
                    .whereColumn('customers.id', 'invoices.customerId')
                    .where('name', 'ilike', `%${search}%`)
                );
            });
          }
        })
        .resultSize()
    ]);
    
    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error in getAllInvoices:', error);
    next(error);
  }
};

/**
 * Get invoice by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const invoice = await Invoice.query()
      .findById(id)
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('[customer, items.product, salesOrder, payments]');
    
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    logger.error('Error in getInvoiceById:', error);
    next(error);
  }
};

/**
 * Create new invoice
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.createInvoice = async (req, res, next) => {
  const trx = await transaction.start(Invoice.knex());
  
  try {
    const { 
      customerId, 
      salesOrderId, 
      invoiceDate, 
      dueDate, 
      status, 
      items, 
      notes 
    } = req.body;
    
    // Check if customer exists and belongs to tenant
    const customer = await Customer.query(trx)
      .findById(customerId)
      .where('tenantId', req.user.tenantId);
    
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }
    
    // Check if sales order exists if provided
    let salesOrder = null;
    if (salesOrderId) {
      salesOrder = await SalesOrder.query(trx)
        .findById(salesOrderId)
        .where('tenantId', req.user.tenantId)
        .withGraphFetched('items');
      
      if (!salesOrder) {
        throw new NotFoundError('Sales order not found');
      }
      
      if (salesOrder.customerId !== customerId) {
        throw new BadRequestError('Sales order does not belong to the specified customer');
      }
    }
    
    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber(trx);
    
    // Create invoice
    const invoiceData = {
      invoiceNumber,
      customerId,
      salesOrderId,
      invoiceDate,
      dueDate,
      status,
      notes,
      tenantId: req.user.tenantId,
      createdById: req.user.id
    };
    
    const invoice = await Invoice.query(trx)
      .insert(invoiceData)
      .returning('*');
    
    // Create invoice items
    let invoiceItems = [];
    
    if (items && items.length > 0) {
      // Use provided items
      invoiceItems = await Promise.all(
        items.map(async item => {
          const itemData = {
            invoiceId: invoice.id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            discountRate: item.discountRate || 0
          };
          
          // Calculate totals
          const { subtotal, taxAmount, discountAmount, total } = new InvoiceItem(itemData).calculateTotals();
          
          return InvoiceItem.query(trx)
            .insert({
              ...itemData,
              subtotal,
              taxAmount,
              discountAmount,
              total
            })
            .returning('*');
        })
      );
    } else if (salesOrder && salesOrder.items) {
      // Use sales order items
      invoiceItems = await Promise.all(
        salesOrder.items.map(async item => {
          const itemData = {
            invoiceId: invoice.id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            discountRate: item.discountRate || 0,
            subtotal: item.subtotal,
            taxAmount: item.taxAmount,
            discountAmount: item.discountAmount,
            total: item.total
          };
          
          return InvoiceItem.query(trx)
            .insert(itemData)
            .returning('*');
        })
      );
    }
    
    // Calculate invoice totals
    const totals = {
      subtotal: invoiceItems.reduce((sum, item) => sum + item.subtotal, 0),
      taxAmount: invoiceItems.reduce((sum, item) => sum + item.taxAmount, 0),
      discountAmount: invoiceItems.reduce((sum, item) => sum + item.discountAmount, 0),
      total: invoiceItems.reduce((sum, item) => sum + item.total, 0),
      amountPaid: 0,
      balanceDue: invoiceItems.reduce((sum, item) => sum + item.total, 0)
    };
    
    // Update invoice with totals
    await Invoice.query(trx)
      .patchAndFetchById(invoice.id, totals);
    
    // Add items to invoice object
    invoice.items = invoiceItems;
    
    await trx.commit();
    
    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in createInvoice:', error);
    next(error);
  }
};

/**
 * Update invoice
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.updateInvoice = async (req, res, next) => {
  const trx = await transaction.start(Invoice.knex());
  
  try {
    const { id } = req.params;
    const { 
      invoiceDate, 
      dueDate, 
      status, 
      items, 
      notes 
    } = req.body;
    
    // Check if invoice exists and belongs to tenant
    const existingInvoice = await Invoice.query(trx)
      .findById(id)
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('[items, payments]');
    
    if (!existingInvoice) {
      throw new NotFoundError('Invoice not found');
    }
    
    // Check if invoice can be updated
    if (existingInvoice.status === 'cancelled') {
      throw new BadRequestError('Cannot update a cancelled invoice');
    }
    
    if (existingInvoice.status === 'paid' && status !== 'paid') {
      throw new BadRequestError('Cannot change status of a fully paid invoice');
    }
    
    // Update invoice
    const invoiceData = {
      invoiceDate,
      dueDate,
      status,
      notes,
      updatedAt: new Date().toISOString()
    };
    
    const invoice = await Invoice.query(trx)
      .patchAndFetchById(id, invoiceData);
    
    // Update invoice items
    if (items && items.length > 0) {
      // Delete existing items
      await InvoiceItem.query(trx)
        .delete()
        .where('invoiceId', id);
      
      // Create new items
      const invoiceItems = await Promise.all(
        items.map(async item => {
          const itemData = {
            invoiceId: id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            discountRate: item.discountRate || 0
          };
          
          // Calculate totals
          const { subtotal, taxAmount, discountAmount, total } = new InvoiceItem(itemData).calculateTotals();
          
          return InvoiceItem.query(trx)
            .insert({
              ...itemData,
              subtotal,
              taxAmount,
              discountAmount,
              total
            })
            .returning('*');
        })
      );
      
      // Calculate invoice totals
      const amountPaid = existingInvoice.payments 
        ? existingInvoice.payments.reduce((sum, payment) => sum + payment.amount, 0) 
        : 0;
      
      const totals = {
        subtotal: invoiceItems.reduce((sum, item) => sum + item.subtotal, 0),
        taxAmount: invoiceItems.reduce((sum, item) => sum + item.taxAmount, 0),
        discountAmount: invoiceItems.reduce((sum, item) => sum + item.discountAmount, 0),
        total: invoiceItems.reduce((sum, item) => sum + item.total, 0),
        amountPaid,
        balanceDue: invoiceItems.reduce((sum, item) => sum + item.total, 0) - amountPaid
      };
      
      // Update invoice with totals
      await Invoice.query(trx)
        .patchAndFetchById(id, totals);
      
      // Add items to invoice object
      invoice.items = invoiceItems;
    }
    
    await trx.commit();
    
    res.json({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in updateInvoice:', error);
    next(error);
  }
};

/**
 * Delete invoice
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.deleteInvoice = async (req, res, next) => {
  const trx = await transaction.start(Invoice.knex());
  
  try {
    const { id } = req.params;
    
    // Check if invoice exists and belongs to tenant
    const existingInvoice = await Invoice.query(trx)
      .findById(id)
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('payments');
    
    if (!existingInvoice) {
      throw new NotFoundError('Invoice not found');
    }
    
    // Check if invoice has payments
    if (existingInvoice.payments && existingInvoice.payments.length > 0) {
      throw new BadRequestError('Cannot delete invoice with payments');
    }
    
    // Delete invoice items
    await InvoiceItem.query(trx)
      .delete()
      .where('invoiceId', id);
    
    // Delete invoice
    await Invoice.query(trx)
      .deleteById(id);
    
    await trx.commit();
    
    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in deleteInvoice:', error);
    next(error);
  }
};

/**
 * Record payment for invoice
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.recordPayment = async (req, res, next) => {
  const trx = await transaction.start(Invoice.knex());
  
  try {
    const { id } = req.params;
    const { amount, paymentDate, paymentMethod, referenceNumber, notes } = req.body;
    
    // Check if invoice exists and belongs to tenant
    const invoice = await Invoice.query(trx)
      .findById(id)
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('payments');
    
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }
    
    // Check if invoice is cancelled
    if (invoice.status === 'cancelled') {
      throw new BadRequestError('Cannot record payment for a cancelled invoice');
    }
    
    // Calculate current balance
    const currentTotal = invoice.total || 0;
    const currentAmountPaid = invoice.payments 
      ? invoice.payments.reduce((sum, payment) => sum + payment.amount, 0) 
      : 0;
    const currentBalanceDue = currentTotal - currentAmountPaid;
    
    // Check if payment amount is valid
    if (amount <= 0) {
      throw new BadRequestError('Payment amount must be greater than zero');
    }
    
    if (amount > currentBalanceDue) {
      throw new BadRequestError('Payment amount cannot exceed the balance due');
    }
    
    // Create payment
    const payment = await Payment.query(trx)
      .insert({
        invoiceId: id,
        amount,
        paymentDate,
        paymentMethod,
        referenceNumber,
        notes,
        tenantId: req.user.tenantId,
        createdById: req.user.id
      })
      .returning('*');
    
    // Update invoice
    const newAmountPaid = currentAmountPaid + amount;
    const newBalanceDue = currentTotal - newAmountPaid;
    const newStatus = newBalanceDue <= 0 ? 'paid' : 'partially_paid';
    
    const updatedInvoice = await Invoice.query(trx)
      .patchAndFetchById(id, {
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    
    await trx.commit();
    
    res.status(201).json({
      success: true,
      data: {
        payment,
        invoice: updatedInvoice
      },
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in recordPayment:', error);
    next(error);
  }
};

/**
 * Get invoice payments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getInvoicePayments = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if invoice exists and belongs to tenant
    const invoice = await Invoice.query()
      .findById(id)
      .where('tenantId', req.user.tenantId);
    
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }
    
    // Get payments
    const payments = await Payment.query()
      .where('invoiceId', id)
      .orderBy('paymentDate', 'desc');
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    logger.error('Error in getInvoicePayments:', error);
    next(error);
  }
};