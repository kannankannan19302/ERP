const BaseModel = require('./BaseModel');

class Tenant extends BaseModel {
  constructor() {
    super('tenants');
    this.tenantIsolation = false; // Tenants table is not tenant-isolated
  }

  // Find tenant by subdomain
  async findBySubdomain(subdomain) {
    try {
      return await this.db(this.tableName)
        .where('subdomain', subdomain)
        .where('is_active', true)
        .first();
    } catch (error) {
      throw error;
    }
  }

  // Find tenant by identifier (subdomain or ID)
  async findByIdentifier(identifier) {
    try {
      // Try to find by subdomain first
      let tenant = await this.findBySubdomain(identifier);
      
      // If not found, try by ID
      if (!tenant) {
        tenant = await this.findById(identifier);
      }

      return tenant;
    } catch (error) {
      throw error;
    }
  }

  // Create tenant with default settings
  async create(data) {
    try {
      const tenantData = {
        ...data,
        settings: data.settings || {
          timezone: 'UTC',
          currency: 'USD',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '24h',
          language: 'en'
        },
        subscription_plan: data.subscription_plan || 'basic',
        is_active: true
      };

      const tenant = await super.create(tenantData);

      // Create default company for the tenant
      await this.createDefaultCompany(tenant.id, data.companyName || data.name);

      return tenant;
    } catch (error) {
      throw error;
    }
  }

  // Create default company for tenant
  async createDefaultCompany(tenantId, companyName) {
    try {
      const Company = require('./Company');
      
      const companyData = {
        tenant_id: tenantId,
        name: companyName,
        code: 'DEFAULT',
        currency_code: 'USD',
        timezone: 'UTC',
        is_active: true
      };

      return await Company.create(companyData);
    } catch (error) {
      throw error;
    }
  }

  // Get tenant statistics
  async getStatistics(tenantId) {
    try {
      const stats = {};

      // Get user count
      const userCount = await this.db('users')
        .where('tenant_id', tenantId)
        .where('is_active', true)
        .count('* as count')
        .first();
      stats.activeUsers = parseInt(userCount.count);

      // Get company count
      const companyCount = await this.db('companies')
        .where('tenant_id', tenantId)
        .where('is_active', true)
        .count('* as count')
        .first();
      stats.companies = parseInt(companyCount.count);

      // Get storage usage (placeholder)
      stats.storageUsed = 0;

      // Get last activity
      const lastActivity = await this.db('audit_logs')
        .where('tenant_id', tenantId)
        .orderBy('created_at', 'desc')
        .select('created_at')
        .first();
      stats.lastActivity = lastActivity?.created_at || null;

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Update tenant settings
  async updateSettings(tenantId, settings) {
    try {
      const tenant = await this.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const updatedSettings = {
        ...tenant.settings,
        ...settings
      };

      return await this.update(tenantId, {
        settings: updatedSettings
      });
    } catch (error) {
      throw error;
    }
  }

  // Get tenant by user
  async findByUser(userId) {
    try {
      return await this.db(this.tableName)
        .select('tenants.*')
        .join('users', 'tenants.id', 'users.tenant_id')
        .where('users.id', userId)
        .where('tenants.is_active', true)
        .first();
    } catch (error) {
      throw error;
    }
  }

  // Activate tenant
  async activate(tenantId) {
    try {
      return await this.update(tenantId, {
        is_active: true,
        activated_at: new Date()
      });
    } catch (error) {
      throw error;
    }
  }

  // Deactivate tenant
  async deactivate(tenantId, reason = null) {
    try {
      return await this.update(tenantId, {
        is_active: false,
        deactivated_at: new Date(),
        deactivation_reason: reason
      });
    } catch (error) {
      throw error;
    }
  }

  // Update subscription plan
  async updateSubscriptionPlan(tenantId, plan) {
    try {
      return await this.update(tenantId, {
        subscription_plan: plan,
        plan_updated_at: new Date()
      });
    } catch (error) {
      throw error;
    }
  }

  // Get tenants by subscription plan
  async findBySubscriptionPlan(plan) {
    try {
      return await this.db(this.tableName)
        .where('subscription_plan', plan)
        .where('is_active', true);
    } catch (error) {
      throw error;
    }
  }

  // Check if subdomain is available
  async isSubdomainAvailable(subdomain, excludeTenantId = null) {
    try {
      let query = this.db(this.tableName)
        .where('subdomain', subdomain);

      if (excludeTenantId) {
        query = query.where('id', '!=', excludeTenantId);
      }

      const existing = await query.first();
      return !existing;
    } catch (error) {
      throw error;
    }
  }

  // Get tenant usage metrics
  async getUsageMetrics(tenantId, startDate, endDate) {
    try {
      const metrics = {};

      // API calls
      const apiCalls = await this.db('audit_logs')
        .where('tenant_id', tenantId)
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first();
      metrics.apiCalls = parseInt(apiCalls.count);

      // Storage usage
      const storageUsage = await this.db('attachments')
        .where('tenant_id', tenantId)
        .sum('file_size as total')
        .first();
      metrics.storageUsage = parseInt(storageUsage.total) || 0;

      // Active users
      const activeUsers = await this.db('users')
        .where('tenant_id', tenantId)
        .where('is_active', true)
        .whereBetween('last_login_at', [startDate, endDate])
        .countDistinct('id as count')
        .first();
      metrics.activeUsers = parseInt(activeUsers.count);

      return metrics;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new Tenant();