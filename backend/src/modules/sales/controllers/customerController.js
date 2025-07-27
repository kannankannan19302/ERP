const Customer = require('../models/Customer');
const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/errors');

/**
 * Get all customers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getAllCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, sort = 'name', order = 'asc' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = Customer.query()
      .where('tenantId', req.user.tenantId)
      .orderBy(sort, order)
      .limit(limit)
      .offset(offset);
    
    if (search) {
      query = query.where(builder => {
        builder.where('name', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`)
          .orWhere('phone', 'ilike', `%${search}%`);
      });
    }
    
    const [customers, total] = await Promise.all([
      query,
      Customer.query()
        .where('tenantId', req.user.tenantId)
        .resultSize()
    ]);
    
    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error in getAllCustomers:', error);
    next(error);
  }
};

/**
 * Get customer by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.query()
      .findById(id)
      .where('tenantId', req.user.tenantId)
      .withGraphFetched('[salesOrders, invoices]');
    
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }
    
    // Get customer with sales statistics
    const customerWithStats = await customer.getWithStats();
    
    res.json({
      success: true,
      data: customerWithStats
    });
  } catch (error) {
    logger.error('Error in getCustomerById:', error);
    next(error);
  }
};

/**
 * Create new customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.createCustomer = async (req, res, next) => {
  try {
    const customerData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdById: req.user.id
    };
    
    const customer = await Customer.query()
      .insert(customerData)
      .returning('*');
    
    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    logger.error('Error in createCustomer:', error);
    next(error);
  }
};

/**
 * Update customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if customer exists and belongs to tenant
    const existingCustomer = await Customer.query()
      .findById(id)
      .where('tenantId', req.user.tenantId);
    
    if (!existingCustomer) {
      throw new NotFoundError('Customer not found');
    }
    
    const updatedCustomer = await Customer.query()
      .patchAndFetchById(id, {
        ...req.body,
        updatedAt: new Date().toISOString()
      });
    
    res.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateCustomer:', error);
    next(error);
  }
};

/**
 * Delete customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if customer exists and belongs to tenant
    const existingCustomer = await Customer.query()
      .findById(id)
      .where('tenantId', req.user.tenantId);
    
    if (!existingCustomer) {
      throw new NotFoundError('Customer not found');
    }
    
    // Check if customer has related records
    const [salesOrders, invoices] = await Promise.all([
      existingCustomer.$relatedQuery('salesOrders').resultSize(),
      existingCustomer.$relatedQuery('invoices').resultSize()
    ]);
    
    if (salesOrders > 0 || invoices > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CUSTOMER_HAS_RELATED_RECORDS',
          message: 'Cannot delete customer with related sales orders or invoices'
        }
      });
    }
    
    // Delete customer
    await Customer.query()
      .deleteById(id)
      .where('tenantId', req.user.tenantId);
    
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteCustomer:', error);
    next(error);
  }
};

/**
 * Get customer statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getCustomerStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if customer exists and belongs to tenant
    const customer = await Customer.query()
      .findById(id)
      .where('tenantId', req.user.tenantId);
    
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }
    
    // Get customer with sales statistics
    const customerWithStats = await customer.getWithStats();
    
    res.json({
      success: true,
      data: {
        stats: customerWithStats.stats
      }
    });
  } catch (error) {
    logger.error('Error in getCustomerStats:', error);
    next(error);
  }
};