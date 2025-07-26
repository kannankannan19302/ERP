const BaseModel = require('./BaseModel');

class AuditLog extends BaseModel {
  constructor() {
    super('audit_logs');
    this.tenantIsolation = true;
    this.timestamps = false; // We handle timestamps manually
  }

  // Create audit log entry
  async create(data, tenantId = null) {
    try {
      const auditData = {
        ...data,
        created_at: new Date()
      };

      return await super.create(auditData, tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Create data change log
  async createDataChangeLog(data) {
    try {
      return await this.create({
        ...data,
        log_type: 'data_change'
      }, data.tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Create authentication log
  async createAuthLog(data) {
    try {
      return await this.create({
        ...data,
        log_type: 'authentication'
      }, data.tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Create security log
  async createSecurityLog(data) {
    try {
      return await this.create({
        ...data,
        log_type: 'security'
      }, data.tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Create file operation log
  async createFileLog(data) {
    try {
      return await this.create({
        ...data,
        log_type: 'file_operation'
      }, data.tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Find logs with filters
  async findWithFilters(filters = {}) {
    try {
      const {
        tenantId,
        userId,
        action,
        tableName,
        startDate,
        endDate,
        logType,
        page = 1,
        limit = 50
      } = filters;

      let query = this.query(tenantId);

      if (userId) {
        query = query.where('user_id', userId);
      }

      if (action) {
        query = query.where('action', action);
      }

      if (tableName) {
        query = query.where('table_name', tableName);
      }

      if (logType) {
        query = query.where('log_type', logType);
      }

      if (startDate && endDate) {
        query = query.whereBetween('created_at', [startDate, endDate]);
      }

      // Get total count
      const totalQuery = query.clone();
      const [{ count }] = await totalQuery.count('* as count');
      const total = parseInt(count);

      // Apply pagination and ordering
      const offset = (page - 1) * limit;
      const results = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return {
        data: results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get audit summary
  async getAuditSummary(tenantId, startDate, endDate) {
    try {
      const summary = {};

      // Total events
      const totalEvents = await this.query(tenantId)
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first();
      summary.totalEvents = parseInt(totalEvents.count);

      // Events by action
      const eventsByAction = await this.query(tenantId)
        .select('action')
        .count('* as count')
        .whereBetween('created_at', [startDate, endDate])
        .groupBy('action')
        .orderBy('count', 'desc');
      summary.eventsByAction = eventsByAction;

      // Events by user
      const eventsByUser = await this.query(tenantId)
        .select('user_id')
        .count('* as count')
        .whereBetween('created_at', [startDate, endDate])
        .whereNotNull('user_id')
        .groupBy('user_id')
        .orderBy('count', 'desc')
        .limit(10);
      summary.topUsers = eventsByUser;

      return summary;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuditLog();