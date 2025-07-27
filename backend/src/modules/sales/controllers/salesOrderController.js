const SalesOrder = require('../models/SalesOrder');
const SalesOrderItem = require('../models/SalesOrderItem');
const Customer = require('../models/Customer');
const logger = require('../../../utils/logger');
const { NotFoundError, BadRequestError } = require('../../../utils/errors');
const { transaction } = require('objection');

/**
 * Get all sales orders
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getAllSalesOrders = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status,
      customerId,
      sort = 'orderDate', 
      order = 'desc' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = SalesOrder.query()
      .where('tenantId', req.user.tenantId)
      .orderBy(sort, order)
      .limit(limit)
      .offset(offset)
      .withGraphFetched('customer');
    
    if (search) {
      query = query.where(builder => {
        builder.where('orderNumber', 'ilike', `%${search}%`)
          .orWhereExists(
            Customer.query()
              .whereColumn('customers.id', 'sales_orders.customerId')
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
    
    const [salesOrders, total] = await Promise.all([
      query,
      SalesOrder.query()
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
              subBuilder.where('orderNumber', 'ilike', `%${search}%`)
                .orWhereExists(
                  Customer.query()
                    .whereColumn('customers.id', 'sales_orders.customerId')
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
        salesOrders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error in getAllSalesOrders:', error);
    next(error);
  }
};

/**
 * Get sales order by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getSalesOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const salesOrder = await SalesOrder.query()
      .findById(id)
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('[customer, items.product, invoices]');
    
    if (!salesOrder) {
      throw new NotFoundError('Sales order not found');
    }
    
    res.json({
      success: true,
      data: salesOrder
    });
  } catch (error) {
    logger.error('Error in getSalesOrderById:', error);
    next(error);
  }
};

/**
 * Create new sales order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.createSalesOrder = async (req, res, next) => {
  const trx = await transaction.start(SalesOrder.knex());
  
  try {
    const { customerId, orderDate, deliveryDate, status, shippingAddress, items, notes } = req.body;
    
    // Check if customer exists and belongs to tenant
    const customer = await Customer.query(trx)
      .findById(customerId)
      .where('tenantId', req.user.tenantId);
    
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }
    
    // Generate order number
    const orderNumber = await SalesOrder.generateOrderNumber(trx);
    
    // Create sales order
    const salesOrderData = {
      orderNumber,
      customerId,
      orderDate,
      deliveryDate,
      status,
      shippingAddress: shippingAddress || customer.address,
      shippingCity: shippingAddress ? shippingAddress.city : customer.city,
      shippingState: shippingAddress ? shippingAddress.state : customer.state,
      shippingCountry: shippingAddress ? shippingAddress.country : customer.country,
      shippingPostalCode: shippingAddress ? shippingAddress.postalCode : customer.postalCode,
      notes,
      tenantId: req.user.tenantId,
      createdById: req.user.id
    };
    
    const salesOrder = await SalesOrder.query(trx)
      .insert(salesOrderData)
      .returning('*');
    
    // Create sales order items
    if (items && items.length > 0) {
      const salesOrderItems = await Promise.all(
        items.map(async item => {
          const itemData = {
            salesOrderId: salesOrder.id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            discountRate: item.discountRate || 0
          };
          
          // Calculate totals
          const { subtotal, taxAmount, discountAmount, total } = new SalesOrderItem(itemData).calculateTotals();
          
          return SalesOrderItem.query(trx)
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
      
      // Calculate order totals
      const totals = {
        subtotal: salesOrderItems.reduce((sum, item) => sum + item.subtotal, 0),
        taxAmount: salesOrderItems.reduce((sum, item) => sum + item.taxAmount, 0),
        discountAmount: salesOrderItems.reduce((sum, item) => sum + item.discountAmount, 0),
        total: salesOrderItems.reduce((sum, item) => sum + item.total, 0)
      };
      
      // Update sales order with totals
      await SalesOrder.query(trx)
        .patchAndFetchById(salesOrder.id, totals);
      
      // Add items to sales order object
      salesOrder.items = salesOrderItems;
    }
    
    await trx.commit();
    
    res.status(201).json({
      success: true,
      data: salesOrder,
      message: 'Sales order created successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in createSalesOrder:', error);
    next(error);
  }
};

/**
 * Update sales order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.updateSalesOrder = async (req, res, next) => {
  const trx = await transaction.start(SalesOrder.knex());
  
  try {
    const { id } = req.params;
    const { customerId, orderDate, deliveryDate, status, shippingAddress, items, notes } = req.body;
    
    // Check if sales order exists and belongs to tenant
    const existingSalesOrder = await SalesOrder.query(trx)
      .findById(id)
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('items');
    
    if (!existingSalesOrder) {
      throw new NotFoundError('Sales order not found');
    }
    
    // Check if status can be updated
    if (existingSalesOrder.status === 'cancelled' && status !== 'cancelled') {
      throw new BadRequestError('Cannot update a cancelled sales order');
    }
    
    if (existingSalesOrder.status === 'delivered' && !['delivered', 'cancelled'].includes(status)) {
      throw new BadRequestError('Cannot change status of a delivered sales order');
    }
    
    // Update sales order
    const salesOrderData = {
      customerId,
      orderDate,
      deliveryDate,
      status,
      shippingAddress: shippingAddress?.address,
      shippingCity: shippingAddress?.city,
      shippingState: shippingAddress?.state,
      shippingCountry: shippingAddress?.country,
      shippingPostalCode: shippingAddress?.postalCode,
      notes,
      updatedAt: new Date().toISOString()
    };
    
    const salesOrder = await SalesOrder.query(trx)
      .patchAndFetchById(id, salesOrderData);
    
    // Update sales order items
    if (items && items.length > 0) {
      // Delete existing items
      await SalesOrderItem.query(trx)
        .delete()
        .where('salesOrderId', id);
      
      // Create new items
      const salesOrderItems = await Promise.all(
        items.map(async item => {
          const itemData = {
            salesOrderId: id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            discountRate: item.discountRate || 0
          };
          
          // Calculate totals
          const { subtotal, taxAmount, discountAmount, total } = new SalesOrderItem(itemData).calculateTotals();
          
          return SalesOrderItem.query(trx)
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
      
      // Calculate order totals
      const totals = {
        subtotal: salesOrderItems.reduce((sum, item) => sum + item.subtotal, 0),
        taxAmount: salesOrderItems.reduce((sum, item) => sum + item.taxAmount, 0),
        discountAmount: salesOrderItems.reduce((sum, item) => sum + item.discountAmount, 0),
        total: salesOrderItems.reduce((sum, item) => sum + item.total, 0)
      };
      
      // Update sales order with totals
      await SalesOrder.query(trx)
        .patchAndFetchById(id, totals);
      
      // Add items to sales order object
      salesOrder.items = salesOrderItems;
    }
    
    await trx.commit();
    
    res.json({
      success: true,
      data: salesOrder,
      message: 'Sales order updated successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in updateSalesOrder:', error);
    next(error);
  }
};

/**
 * Delete sales order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.deleteSalesOrder = async (req, res, next) => {
  const trx = await transaction.start(SalesOrder.knex());
  
  try {
    const { id } = req.params;
    
    // Check if sales order exists and belongs to tenant
    const existingSalesOrder = await SalesOrder.query(trx)
      .findById(id)
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('invoices');
    
    if (!existingSalesOrder) {
      throw new NotFoundError('Sales order not found');
    }
    
    // Check if sales order has invoices
    if (existingSalesOrder.invoices && existingSalesOrder.invoices.length > 0) {
      throw new BadRequestError('Cannot delete sales order with related invoices');
    }
    
    // Delete sales order items
    await SalesOrderItem.query(trx)
      .delete()
      .where('salesOrderId', id);
    
    // Delete sales order
    await SalesOrder.query(trx)
      .deleteById(id);
    
    await trx.commit();
    
    res.json({
      success: true,
      message: 'Sales order deleted successfully'
    });
  } catch (error) {
    await trx.rollback();
    logger.error('Error in deleteSalesOrder:', error);
    next(error);
  }
};

/**
 * Update sales order status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.updateSalesOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Check if sales order exists and belongs to tenant
    const existingSalesOrder = await SalesOrder.query()
      .findById(id)
      .where('tenantId', req.user.tenantId);
    
    if (!existingSalesOrder) {
      throw new NotFoundError('Sales order not found');
    }
    
    // Check if status can be updated
    if (existingSalesOrder.status === 'cancelled' && status !== 'cancelled') {
      throw new BadRequestError('Cannot update a cancelled sales order');
    }
    
    if (existingSalesOrder.status === 'delivered' && !['delivered', 'cancelled'].includes(status)) {
      throw new BadRequestError('Cannot change status of a delivered sales order');
    }
    
    // Update sales order status
    const updatedSalesOrder = await SalesOrder.query()
      .patchAndFetchById(id, {
        status,
        updatedAt: new Date().toISOString()
      });
    
    res.json({
      success: true,
      data: updatedSalesOrder,
      message: 'Sales order status updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateSalesOrderStatus:', error);
    next(error);
  }
};