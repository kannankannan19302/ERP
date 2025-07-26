const BaseModel = require('./BaseModel');

class Company extends BaseModel {
  constructor() {
    super('companies');
    this.softDeletes = true;
  }

  // Find company by tenant and ID
  async findByTenantAndId(tenantId, companyId) {
    try {
      return await this.query(tenantId)
        .where('id', companyId)
        .first();
    } catch (error) {
      throw error;
    }
  }

  // Find companies by tenant
  async findByTenant(tenantId) {
    try {
      return await this.query(tenantId)
        .where('is_active', true)
        .orderBy('name');
    } catch (error) {
      throw error;
    }
  }

  // Create company with default settings
  async create(data, tenantId = null) {
    try {
      const companyData = {
        ...data,
        currency_code: data.currency_code || 'USD',
        timezone: data.timezone || 'UTC',
        fiscal_year_start: data.fiscal_year_start || new Date(`${new Date().getFullYear()}-01-01`),
        is_active: true
      };

      return await super.create(companyData, tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Get company statistics
  async getStatistics(companyId, tenantId = null) {
    try {
      const stats = {};

      // Get employee count
      const employeeCount = await this.db('employees')
        .where('company_id', companyId)
        .where('tenant_id', tenantId)
        .where('status', 'active')
        .count('* as count')
        .first();
      stats.employees = parseInt(employeeCount.count);

      // Get customer count
      const customerCount = await this.db('customers')
        .where('company_id', companyId)
        .where('tenant_id', tenantId)
        .where('is_active', true)
        .count('* as count')
        .first();
      stats.customers = parseInt(customerCount.count);

      return stats;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new Company();