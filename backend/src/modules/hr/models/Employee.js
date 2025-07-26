const BaseModel = require('../../../models/BaseModel');

class Employee extends BaseModel {
  constructor() {
    super('employees');
    this.softDeletes = true;
  }

  // Find employee by code
  async findByCode(employeeCode, tenantId = null) {
    try {
      return await this.query(tenantId)
        .where('employee_code', employeeCode)
        .first();
    } catch (error) {
      throw error;
    }
  }

  // Find employee with user details
  async findWithUser(id, tenantId = null) {
    try {
      return await this.query(tenantId)
        .select(
          'employees.*',
          'users.email',
          'users.first_name',
          'users.last_name',
          'users.phone',
          'users.avatar_url',
          'users.is_active as user_active'
        )
        .leftJoin('users', 'employees.user_id', 'users.id')
        .where('employees.id', id)
        .first();
    } catch (error) {
      throw error;
    }
  }

  // Find employees with department and position details
  async findAllWithDetails(options = {}) {
    try {
      const {
        tenantId,
        page = 1,
        limit = 20,
        orderBy = 'created_at',
        orderDirection = 'desc',
        filters = {},
        search = null
      } = options;

      let query = this.query(tenantId)
        .select(
          'employees.*',
          'users.email',
          'users.first_name',
          'users.last_name',
          'users.phone',
          'users.avatar_url',
          'departments.name as department_name',
          'positions.title as position_title',
          'managers.first_name as manager_first_name',
          'managers.last_name as manager_last_name',
          'branches.name as branch_name'
        )
        .leftJoin('users', 'employees.user_id', 'users.id')
        .leftJoin('departments', 'employees.department_id', 'departments.id')
        .leftJoin('positions', 'employees.position_id', 'positions.id')
        .leftJoin('employees as manager_emp', 'employees.manager_id', 'manager_emp.id')
        .leftJoin('users as managers', 'manager_emp.user_id', 'managers.id')
        .leftJoin('branches', 'employees.branch_id', 'branches.id');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'department_id') {
            query = query.where('employees.department_id', value);
          } else if (key === 'position_id') {
            query = query.where('employees.position_id', value);
          } else if (key === 'status') {
            query = query.where('employees.status', value);
          } else if (key === 'employment_type') {
            query = query.where('employees.employment_type', value);
          } else {
            query = query.where(`employees.${key}`, value);
          }
        }
      });

      // Apply search
      if (search) {
        query = query.where(function() {
          this.where('employees.employee_code', 'ILIKE', `%${search}%`)
              .orWhere('users.first_name', 'ILIKE', `%${search}%`)
              .orWhere('users.last_name', 'ILIKE', `%${search}%`)
              .orWhere('users.email', 'ILIKE', `%${search}%`);
        });
      }

      // Get total count
      const totalQuery = this.query(tenantId)
        .leftJoin('users', 'employees.user_id', 'users.id');
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          totalQuery.where(`employees.${key}`, value);
        }
      });
      
      if (search) {
        totalQuery.where(function() {
          this.where('employees.employee_code', 'ILIKE', `%${search}%`)
              .orWhere('users.first_name', 'ILIKE', `%${search}%`)
              .orWhere('users.last_name', 'ILIKE', `%${search}%`)
              .orWhere('users.email', 'ILIKE', `%${search}%`);
        });
      }
      
      const [{ count }] = await totalQuery.count('employees.id as count');
      const total = parseInt(count);

      // Apply pagination and ordering
      const offset = (page - 1) * limit;
      query = query.orderBy(`employees.${orderBy}`, orderDirection)
                   .limit(limit)
                   .offset(offset);

      const results = await query;

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
      throw error;
    }
  }

  // Get employees by department
  async findByDepartment(departmentId, tenantId = null) {
    try {
      return await this.query(tenantId)
        .where('department_id', departmentId)
        .where('status', 'active');
    } catch (error) {
      throw error;
    }
  }

  // Get employees by manager
  async findByManager(managerId, tenantId = null) {
    try {
      return await this.query(tenantId)
        .where('manager_id', managerId)
        .where('status', 'active');
    } catch (error) {
      throw error;
    }
  }

  // Get employee hierarchy
  async getHierarchy(employeeId, tenantId = null) {
    try {
      // Get subordinates
      const subordinates = await this.findByManager(employeeId, tenantId);
      
      // Get manager chain
      const managerChain = [];
      let currentEmployee = await this.findById(employeeId, tenantId);
      
      while (currentEmployee && currentEmployee.manager_id) {
        const manager = await this.findById(currentEmployee.manager_id, tenantId);
        if (manager) {
          managerChain.push(manager);
          currentEmployee = manager;
        } else {
          break;
        }
      }

      return {
        subordinates,
        managerChain
      };
    } catch (error) {
      throw error;
    }
  }

  // Update employee status
  async updateStatus(id, status, tenantId = null) {
    try {
      const updateData = {
        status,
        status_updated_at: new Date()
      };

      if (status === 'terminated') {
        updateData.termination_date = new Date();
      }

      return await this.update(id, updateData, tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Get active employees count
  async getActiveCount(tenantId = null) {
    try {
      const result = await this.query(tenantId)
        .where('status', 'active')
        .count('* as count')
        .first();

      return parseInt(result.count);
    } catch (error) {
      throw error;
    }
  }

  // Get employees by employment type
  async findByEmploymentType(employmentType, tenantId = null) {
    try {
      return await this.query(tenantId)
        .where('employment_type', employmentType)
        .where('status', 'active');
    } catch (error) {
      throw error;
    }
  }

  // Get employees hired in date range
  async findHiredInRange(startDate, endDate, tenantId = null) {
    try {
      return await this.query(tenantId)
        .whereBetween('hire_date', [startDate, endDate])
        .orderBy('hire_date', 'desc');
    } catch (error) {
      throw error;
    }
  }

  // Get employee statistics
  async getStatistics(tenantId = null) {
    try {
      const stats = {};

      // Total employees
      const total = await this.query(tenantId)
        .count('* as count')
        .first();
      stats.total = parseInt(total.count);

      // Active employees
      const active = await this.query(tenantId)
        .where('status', 'active')
        .count('* as count')
        .first();
      stats.active = parseInt(active.count);

      // By employment type
      const byEmploymentType = await this.query(tenantId)
        .select('employment_type')
        .count('* as count')
        .groupBy('employment_type');
      stats.byEmploymentType = byEmploymentType.reduce((acc, item) => {
        acc[item.employment_type] = parseInt(item.count);
        return acc;
      }, {});

      // By department
      const byDepartment = await this.query(tenantId)
        .select('departments.name as department_name')
        .count('employees.id as count')
        .leftJoin('departments', 'employees.department_id', 'departments.id')
        .groupBy('departments.id', 'departments.name');
      stats.byDepartment = byDepartment.reduce((acc, item) => {
        acc[item.department_name || 'Unassigned'] = parseInt(item.count);
        return acc;
      }, {});

      // Recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentHires = await this.query(tenantId)
        .where('hire_date', '>=', thirtyDaysAgo)
        .count('* as count')
        .first();
      stats.recentHires = parseInt(recentHires.count);

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Search employees
  async search(searchTerm, tenantId = null, limit = 10) {
    try {
      return await this.query(tenantId)
        .select(
          'employees.*',
          'users.first_name',
          'users.last_name',
          'users.email',
          'departments.name as department_name',
          'positions.title as position_title'
        )
        .leftJoin('users', 'employees.user_id', 'users.id')
        .leftJoin('departments', 'employees.department_id', 'departments.id')
        .leftJoin('positions', 'employees.position_id', 'positions.id')
        .where(function() {
          this.where('employees.employee_code', 'ILIKE', `%${searchTerm}%`)
              .orWhere('users.first_name', 'ILIKE', `%${searchTerm}%`)
              .orWhere('users.last_name', 'ILIKE', `%${searchTerm}%`)
              .orWhere('users.email', 'ILIKE', `%${searchTerm}%`);
        })
        .limit(limit);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new Employee();