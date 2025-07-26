const database = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = database.getConnection();
    this.primaryKey = 'id';
    this.timestamps = true;
    this.softDeletes = false;
    this.tenantIsolation = true;
  }

  // Get query builder with tenant isolation
  query(tenantId = null) {
    let query = this.db(this.tableName);
    
    if (this.tenantIsolation && tenantId) {
      query = query.where('tenant_id', tenantId);
    }
    
    if (this.softDeletes) {
      query = query.whereNull('deleted_at');
    }
    
    return query;
  }

  // Find by ID
  async findById(id, tenantId = null) {
    try {
      const startTime = Date.now();
      
      const result = await this.query(tenantId)
        .where(this.primaryKey, id)
        .first();
      
      const duration = Date.now() - startTime;
      logger.logQuery(`SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`, duration);
      
      return result || null;
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by ID:`, error);
      throw error;
    }
  }

  // Find all with pagination
  async findAll(options = {}) {
    try {
      const {
        tenantId,
        page = 1,
        limit = 20,
        orderBy = 'created_at',
        orderDirection = 'desc',
        filters = {},
        search = null,
        searchFields = []
      } = options;

      const startTime = Date.now();
      
      let query = this.query(tenantId);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            query = query.whereIn(key, value);
          } else if (typeof value === 'object' && value.operator) {
            this.applyOperatorFilter(query, key, value);
          } else {
            query = query.where(key, value);
          }
        }
      });

      // Apply search
      if (search && searchFields.length > 0) {
        query = database.buildFullTextSearch(query, search, searchFields);
      }

      // Get total count
      const totalQuery = query.clone();
      const [{ count }] = await totalQuery.count('* as count');
      const total = parseInt(count);

      // Apply pagination
      query = database.buildPaginationQuery(query, page, limit);
      
      // Apply ordering
      query = query.orderBy(orderBy, orderDirection);
      
      const results = await query;
      
      const duration = Date.now() - startTime;
      logger.logQuery(`SELECT * FROM ${this.tableName} with pagination`, duration);
      
      return {
        data: results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error(`Error finding all ${this.tableName}:`, error);
      throw error;
    }
  }

  // Create new record
  async create(data, tenantId = null) {
    try {
      const startTime = Date.now();
      
      const recordData = {
        ...data,
        [this.primaryKey]: data[this.primaryKey] || uuidv4()
      };

      if (this.tenantIsolation && tenantId) {
        recordData.tenant_id = tenantId;
      }

      if (this.timestamps) {
        const now = new Date();
        recordData.created_at = now;
        recordData.updated_at = now;
      }

      const [result] = await this.db(this.tableName)
        .insert(recordData)
        .returning('*');
      
      const duration = Date.now() - startTime;
      logger.logQuery(`INSERT INTO ${this.tableName}`, duration);
      
      return result;
    } catch (error) {
      logger.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  // Update record
  async update(id, data, tenantId = null) {
    try {
      const startTime = Date.now();
      
      const updateData = { ...data };
      
      if (this.timestamps) {
        updateData.updated_at = new Date();
      }

      let query = this.db(this.tableName)
        .where(this.primaryKey, id);

      if (this.tenantIsolation && tenantId) {
        query = query.where('tenant_id', tenantId);
      }

      if (this.softDeletes) {
        query = query.whereNull('deleted_at');
      }

      const [result] = await query
        .update(updateData)
        .returning('*');
      
      const duration = Date.now() - startTime;
      logger.logQuery(`UPDATE ${this.tableName} WHERE ${this.primaryKey} = ?`, duration);
      
      return result;
    } catch (error) {
      logger.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }
  }

  // Delete record (soft or hard delete)
  async delete(id, tenantId = null, hard = false) {
    try {
      const startTime = Date.now();
      
      let query = this.db(this.tableName)
        .where(this.primaryKey, id);

      if (this.tenantIsolation && tenantId) {
        query = query.where('tenant_id', tenantId);
      }

      let result;
      
      if (this.softDeletes && !hard) {
        // Soft delete
        result = await query.update({
          deleted_at: new Date(),
          updated_at: new Date()
        });
      } else {
        // Hard delete
        result = await query.del();
      }
      
      const duration = Date.now() - startTime;
      logger.logQuery(`DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`, duration);
      
      return result > 0;
    } catch (error) {
      logger.error(`Error deleting ${this.tableName}:`, error);
      throw error;
    }
  }

  // Restore soft deleted record
  async restore(id, tenantId = null) {
    try {
      if (!this.softDeletes) {
        throw new Error('Soft deletes not enabled for this model');
      }

      const startTime = Date.now();
      
      let query = this.db(this.tableName)
        .where(this.primaryKey, id);

      if (this.tenantIsolation && tenantId) {
        query = query.where('tenant_id', tenantId);
      }

      const result = await query.update({
        deleted_at: null,
        updated_at: new Date()
      });
      
      const duration = Date.now() - startTime;
      logger.logQuery(`RESTORE ${this.tableName} WHERE ${this.primaryKey} = ?`, duration);
      
      return result > 0;
    } catch (error) {
      logger.error(`Error restoring ${this.tableName}:`, error);
      throw error;
    }
  }

  // Bulk create
  async bulkCreate(records, tenantId = null) {
    try {
      const startTime = Date.now();
      
      const recordsData = records.map(record => {
        const recordData = {
          ...record,
          [this.primaryKey]: record[this.primaryKey] || uuidv4()
        };

        if (this.tenantIsolation && tenantId) {
          recordData.tenant_id = tenantId;
        }

        if (this.timestamps) {
          const now = new Date();
          recordData.created_at = now;
          recordData.updated_at = now;
        }

        return recordData;
      });

      const result = await this.db(this.tableName)
        .insert(recordsData)
        .returning('*');
      
      const duration = Date.now() - startTime;
      logger.logQuery(`BULK INSERT INTO ${this.tableName} (${records.length} records)`, duration);
      
      return result;
    } catch (error) {
      logger.error(`Error bulk creating ${this.tableName}:`, error);
      throw error;
    }
  }

  // Bulk update
  async bulkUpdate(updates, tenantId = null) {
    try {
      const startTime = Date.now();
      
      const results = [];
      
      for (const update of updates) {
        const { id, ...data } = update;
        const result = await this.update(id, data, tenantId);
        results.push(result);
      }
      
      const duration = Date.now() - startTime;
      logger.logQuery(`BULK UPDATE ${this.tableName} (${updates.length} records)`, duration);
      
      return results;
    } catch (error) {
      logger.error(`Error bulk updating ${this.tableName}:`, error);
      throw error;
    }
  }

  // Upsert (insert or update)
  async upsert(data, conflictColumns = [this.primaryKey], tenantId = null) {
    try {
      const startTime = Date.now();
      
      const recordData = { ...data };

      if (this.tenantIsolation && tenantId) {
        recordData.tenant_id = tenantId;
      }

      if (this.timestamps) {
        const now = new Date();
        recordData.created_at = now;
        recordData.updated_at = now;
      }

      const result = await database.upsert(this.tableName, recordData, conflictColumns);
      
      const duration = Date.now() - startTime;
      logger.logQuery(`UPSERT ${this.tableName}`, duration);
      
      return result;
    } catch (error) {
      logger.error(`Error upserting ${this.tableName}:`, error);
      throw error;
    }
  }

  // Count records
  async count(filters = {}, tenantId = null) {
    try {
      const startTime = Date.now();
      
      let query = this.query(tenantId);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.where(key, value);
        }
      });

      const [{ count }] = await query.count('* as count');
      
      const duration = Date.now() - startTime;
      logger.logQuery(`COUNT ${this.tableName}`, duration);
      
      return parseInt(count);
    } catch (error) {
      logger.error(`Error counting ${this.tableName}:`, error);
      throw error;
    }
  }

  // Check if record exists
  async exists(id, tenantId = null) {
    try {
      const count = await this.query(tenantId)
        .where(this.primaryKey, id)
        .count('* as count')
        .first();
      
      return parseInt(count.count) > 0;
    } catch (error) {
      logger.error(`Error checking existence in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Get distinct values
  async distinct(column, filters = {}, tenantId = null) {
    try {
      const startTime = Date.now();
      
      let query = this.query(tenantId).distinct(column);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.where(key, value);
        }
      });

      const results = await query;
      
      const duration = Date.now() - startTime;
      logger.logQuery(`SELECT DISTINCT ${column} FROM ${this.tableName}`, duration);
      
      return results.map(row => row[column]);
    } catch (error) {
      logger.error(`Error getting distinct values from ${this.tableName}:`, error);
      throw error;
    }
  }

  // Apply operator filter
  applyOperatorFilter(query, key, filter) {
    const { operator, value } = filter;
    
    switch (operator) {
      case 'gt':
        return query.where(key, '>', value);
      case 'gte':
        return query.where(key, '>=', value);
      case 'lt':
        return query.where(key, '<', value);
      case 'lte':
        return query.where(key, '<=', value);
      case 'ne':
        return query.where(key, '!=', value);
      case 'in':
        return query.whereIn(key, value);
      case 'nin':
        return query.whereNotIn(key, value);
      case 'like':
        return query.where(key, 'LIKE', `%${value}%`);
      case 'ilike':
        return query.where(key, 'ILIKE', `%${value}%`);
      case 'between':
        return query.whereBetween(key, value);
      case 'null':
        return query.whereNull(key);
      case 'notnull':
        return query.whereNotNull(key);
      default:
        return query.where(key, value);
    }
  }

  // Transaction wrapper
  async transaction(callback) {
    const trx = await this.db.transaction();
    
    try {
      const result = await callback(trx);
      await trx.commit();
      return result;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  // Raw query
  async raw(query, bindings = []) {
    try {
      const startTime = Date.now();
      
      const result = await this.db.raw(query, bindings);
      
      const duration = Date.now() - startTime;
      logger.logQuery(query, duration);
      
      return result;
    } catch (error) {
      logger.error('Error executing raw query:', error);
      throw error;
    }
  }
}

module.exports = BaseModel;