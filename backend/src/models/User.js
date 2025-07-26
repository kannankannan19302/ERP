const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');
const config = require('../config');

class User extends BaseModel {
  constructor() {
    super('users');
    this.softDeletes = true;
  }

  // Find user by email
  async findByEmail(email, tenantId = null) {
    try {
      return await this.query(tenantId)
        .where('email', email)
        .first();
    } catch (error) {
      throw error;
    }
  }

  // Create user with password hashing
  async create(data, tenantId = null) {
    try {
      const userData = { ...data };
      
      // Hash password if provided
      if (userData.password) {
        userData.password_hash = await this.hashPassword(userData.password);
        delete userData.password;
      }

      return await super.create(userData, tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Update user with password hashing
  async update(id, data, tenantId = null) {
    try {
      const userData = { ...data };
      
      // Hash password if provided
      if (userData.password) {
        userData.password_hash = await this.hashPassword(userData.password);
        delete userData.password;
      }

      return await super.update(id, userData, tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw error;
    }
  }

  // Hash password
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, config.security.bcryptRounds);
    } catch (error) {
      throw error;
    }
  }

  // Get user with roles
  async findWithRoles(id, tenantId = null) {
    try {
      const user = await this.query(tenantId)
        .select(
          'users.*',
          this.db.raw(`
            COALESCE(
              JSON_AGG(
                DISTINCT jsonb_build_object(
                  'id', roles.id,
                  'name', roles.name,
                  'description', roles.description
                )
              ) FILTER (WHERE roles.id IS NOT NULL),
              '[]'::json
            ) as roles
          `)
        )
        .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
        .leftJoin('roles', 'user_roles.role_id', 'roles.id')
        .where('users.id', id)
        .groupBy('users.id')
        .first();

      if (user && user.roles) {
        user.roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles;
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Get users with roles and pagination
  async findAllWithRoles(options = {}) {
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
          'users.*',
          this.db.raw(`
            COALESCE(
              JSON_AGG(
                DISTINCT jsonb_build_object(
                  'id', roles.id,
                  'name', roles.name,
                  'description', roles.description
                )
              ) FILTER (WHERE roles.id IS NOT NULL),
              '[]'::json
            ) as roles
          `)
        )
        .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
        .leftJoin('roles', 'user_roles.role_id', 'roles.id')
        .groupBy('users.id');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.where(`users.${key}`, value);
        }
      });

      // Apply search
      if (search) {
        query = query.where(function() {
          this.where('users.first_name', 'ILIKE', `%${search}%`)
              .orWhere('users.last_name', 'ILIKE', `%${search}%`)
              .orWhere('users.email', 'ILIKE', `%${search}%`);
        });
      }

      // Get total count
      const totalQuery = this.query(tenantId);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          totalQuery.where(key, value);
        }
      });
      if (search) {
        totalQuery.where(function() {
          this.where('first_name', 'ILIKE', `%${search}%`)
              .orWhere('last_name', 'ILIKE', `%${search}%`)
              .orWhere('email', 'ILIKE', `%${search}%`);
        });
      }
      const [{ count }] = await totalQuery.count('* as count');
      const total = parseInt(count);

      // Apply pagination and ordering
      const offset = (page - 1) * limit;
      query = query.orderBy(`users.${orderBy}`, orderDirection)
                   .limit(limit)
                   .offset(offset);

      const results = await query;

      // Parse roles JSON
      results.forEach(user => {
        if (user.roles) {
          user.roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles;
        }
      });

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

  // Assign role to user
  async assignRole(userId, roleId, assignedBy = null, tenantId = null) {
    try {
      const userRole = {
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy,
        assigned_at: new Date(),
        is_active: true
      };

      if (tenantId) {
        userRole.tenant_id = tenantId;
      }

      return await this.db('user_roles').insert(userRole);
    } catch (error) {
      throw error;
    }
  }

  // Remove role from user
  async removeRole(userId, roleId, tenantId = null) {
    try {
      let query = this.db('user_roles')
        .where('user_id', userId)
        .where('role_id', roleId);

      if (tenantId) {
        query = query.where('tenant_id', tenantId);
      }

      return await query.del();
    } catch (error) {
      throw error;
    }
  }

  // Get user permissions
  async getUserPermissions(userId, tenantId = null) {
    try {
      const permissions = await this.db('permissions')
        .select('permissions.*')
        .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
        .join('roles', 'role_permissions.role_id', 'roles.id')
        .join('user_roles', 'roles.id', 'user_roles.role_id')
        .where('user_roles.user_id', userId)
        .where('user_roles.is_active', true)
        .modify(query => {
          if (tenantId) {
            query.where('user_roles.tenant_id', tenantId);
          }
        });

      return permissions;
    } catch (error) {
      throw error;
    }
  }

  // Check if user has permission
  async hasPermission(userId, permission, tenantId = null) {
    try {
      const count = await this.db('permissions')
        .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
        .join('roles', 'role_permissions.role_id', 'roles.id')
        .join('user_roles', 'roles.id', 'user_roles.role_id')
        .where('user_roles.user_id', userId)
        .where('user_roles.is_active', true)
        .where('permissions.name', permission)
        .modify(query => {
          if (tenantId) {
            query.where('user_roles.tenant_id', tenantId);
          }
        })
        .count('* as count')
        .first();

      return parseInt(count.count) > 0;
    } catch (error) {
      throw error;
    }
  }

  // Update last login
  async updateLastLogin(id, tenantId = null) {
    try {
      return await this.update(id, {
        last_login_at: new Date()
      }, tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Get active users count
  async getActiveUsersCount(tenantId = null) {
    try {
      const result = await this.query(tenantId)
        .where('is_active', true)
        .count('* as count')
        .first();

      return parseInt(result.count);
    } catch (error) {
      throw error;
    }
  }

  // Get users by role
  async findByRole(roleName, tenantId = null) {
    try {
      return await this.query(tenantId)
        .select('users.*')
        .join('user_roles', 'users.id', 'user_roles.user_id')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('roles.name', roleName)
        .where('user_roles.is_active', true);
    } catch (error) {
      throw error;
    }
  }

  // Deactivate user
  async deactivate(id, tenantId = null) {
    try {
      return await this.update(id, {
        is_active: false,
        deactivated_at: new Date()
      }, tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Activate user
  async activate(id, tenantId = null) {
    try {
      return await this.update(id, {
        is_active: true,
        deactivated_at: null
      }, tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(id, newPassword, tenantId = null) {
    try {
      const passwordHash = await this.hashPassword(newPassword);
      
      return await this.update(id, {
        password_hash: passwordHash,
        password_changed_at: new Date()
      }, tenantId);
    } catch (error) {
      throw error;
    }
  }

  // Verify email
  async verifyEmail(id, tenantId = null) {
    try {
      return await this.update(id, {
        email_verified_at: new Date()
      }, tenantId);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new User();