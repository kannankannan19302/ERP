const config = require('../config');
const logger = require('../utils/logger');
const Tenant = require('../models/Tenant');
const redis = require('../config/redis');

class TenantMiddleware {
  // Main tenant resolution middleware
  static async resolveTenant(req, res, next) {
    try {
      if (!config.multiTenancy.enabled) {
        // If multi-tenancy is disabled, use default tenant
        req.tenant = { id: 'default', name: 'Default Tenant' };
        return next();
      }

      let tenantIdentifier = null;

      // Method 1: Extract from subdomain
      if (config.multiTenancy.subdomainTenancy) {
        tenantIdentifier = TenantMiddleware.extractFromSubdomain(req);
      }

      // Method 2: Extract from header
      if (!tenantIdentifier) {
        tenantIdentifier = req.headers[config.multiTenancy.tenantHeader];
      }

      // Method 3: Extract from query parameter
      if (!tenantIdentifier) {
        tenantIdentifier = req.query.tenant;
      }

      // Method 4: Extract from JWT token (if authenticated)
      if (!tenantIdentifier && req.headers.authorization) {
        tenantIdentifier = await TenantMiddleware.extractFromToken(req);
      }

      // Use default tenant if none found
      if (!tenantIdentifier) {
        tenantIdentifier = config.multiTenancy.defaultTenant;
      }

      // Resolve tenant from identifier
      const tenant = await TenantMiddleware.getTenant(tenantIdentifier);
      
      if (!tenant) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TENANT',
            message: 'Invalid or inactive tenant'
          }
        });
      }

      // Attach tenant to request
      req.tenant = tenant;
      req.tenantId = tenant.id;

      // Set tenant context for database queries
      req.dbContext = {
        tenantId: tenant.id,
        companyId: req.headers['x-company-id'] || null
      };

      next();
    } catch (error) {
      logger.error('Tenant resolution error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_RESOLUTION_ERROR',
          message: 'Failed to resolve tenant'
        }
      });
    }
  }

  // Extract tenant from subdomain
  static extractFromSubdomain(req) {
    const host = req.get('host');
    if (!host) return null;

    const parts = host.split('.');
    if (parts.length < 3) return null; // No subdomain

    const subdomain = parts[0];
    
    // Skip common subdomains
    const skipSubdomains = ['www', 'api', 'admin', 'app'];
    if (skipSubdomains.includes(subdomain)) return null;

    return subdomain;
  }

  // Extract tenant from JWT token
  static async extractFromToken(req) {
    try {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) return null;

      const decoded = jwt.verify(token, config.jwt.secret);
      return decoded.tenantId || null;
    } catch (error) {
      // Token might be invalid, but that's handled by auth middleware
      return null;
    }
  }

  // Get tenant by identifier (with caching)
  static async getTenant(identifier) {
    try {
      const redisClient = redis.getClient();
      const cacheKey = `tenant:${identifier}`;
      
      // Try cache first
      let tenant = await redisClient.get(cacheKey);
      
      if (tenant) {
        return JSON.parse(tenant);
      }

      // Get from database
      tenant = await Tenant.findByIdentifier(identifier);
      
      if (tenant && tenant.isActive) {
        // Cache for 1 hour
        await redisClient.setex(cacheKey, 3600, JSON.stringify(tenant));
        return tenant;
      }

      return null;
    } catch (error) {
      logger.error('Error getting tenant:', error);
      return null;
    }
  }

  // Company resolution middleware (for multi-company tenants)
  static async resolveCompany(req, res, next) {
    try {
      const companyId = req.headers['x-company-id'] || req.query.company;
      
      if (!companyId) {
        // Use user's default company if available
        if (req.user && req.user.companyId) {
          req.company = { id: req.user.companyId };
          req.dbContext.companyId = req.user.companyId;
        }
        return next();
      }

      // Validate company belongs to tenant
      const company = await TenantMiddleware.getCompany(req.tenantId, companyId);
      
      if (!company) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COMPANY',
            message: 'Invalid or inactive company'
          }
        });
      }

      req.company = company;
      req.dbContext.companyId = company.id;

      next();
    } catch (error) {
      logger.error('Company resolution error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'COMPANY_RESOLUTION_ERROR',
          message: 'Failed to resolve company'
        }
      });
    }
  }

  // Get company by ID (with caching)
  static async getCompany(tenantId, companyId) {
    try {
      const redisClient = redis.getClient();
      const cacheKey = `company:${tenantId}:${companyId}`;
      
      // Try cache first
      let company = await redisClient.get(cacheKey);
      
      if (company) {
        return JSON.parse(company);
      }

      // Get from database
      const Company = require('../models/Company');
      company = await Company.findByTenantAndId(tenantId, companyId);
      
      if (company && company.isActive) {
        // Cache for 30 minutes
        await redisClient.setex(cacheKey, 1800, JSON.stringify(company));
        return company;
      }

      return null;
    } catch (error) {
      logger.error('Error getting company:', error);
      return null;
    }
  }

  // Tenant isolation middleware for database queries
  static isolateData(req, res, next) {
    // Add tenant filter to all database queries
    const originalQuery = req.query || {};
    
    // Ensure tenant isolation
    req.query = {
      ...originalQuery,
      tenantId: req.tenantId
    };

    // Add company filter if available
    if (req.company) {
      req.query.companyId = req.company.id;
    }

    next();
  }

  // Validate tenant access to resource
  static validateTenantAccess(resourceModel, resourceIdParam = 'id') {
    return async (req, res, next) => {
      try {
        const resourceId = req.params[resourceIdParam];
        
        if (!resourceId) {
          return next();
        }

        const resource = await resourceModel.findById(resourceId);
        
        if (!resource) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'RESOURCE_NOT_FOUND',
              message: 'Resource not found'
            }
          });
        }

        // Check tenant ownership
        if (resource.tenantId !== req.tenantId) {
          logger.logSecurity('TENANT_ISOLATION_VIOLATION', {
            userId: req.user?.id,
            tenantId: req.tenantId,
            resourceTenantId: resource.tenantId,
            resourceId,
            resourceType: resourceModel.name
          }, req);

          return res.status(403).json({
            success: false,
            error: {
              code: 'ACCESS_DENIED',
              message: 'Access denied to resource'
            }
          });
        }

        // Check company ownership if applicable
        if (req.company && resource.companyId && resource.companyId !== req.company.id) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'COMPANY_ACCESS_DENIED',
              message: 'Access denied to resource from different company'
            }
          });
        }

        req.resource = resource;
        next();
      } catch (error) {
        logger.error('Tenant access validation error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'ACCESS_VALIDATION_ERROR',
            message: 'Failed to validate access'
          }
        });
      }
    };
  }

  // Clear tenant cache
  static async clearTenantCache(tenantIdentifier) {
    try {
      const redisClient = redis.getClient();
      await redisClient.del(`tenant:${tenantIdentifier}`);
    } catch (error) {
      logger.error('Error clearing tenant cache:', error);
    }
  }

  // Clear company cache
  static async clearCompanyCache(tenantId, companyId) {
    try {
      const redisClient = redis.getClient();
      await redisClient.del(`company:${tenantId}:${companyId}`);
    } catch (error) {
      logger.error('Error clearing company cache:', error);
    }
  }

  // Get tenant statistics
  static async getTenantStats(tenantId) {
    try {
      const redisClient = redis.getClient();
      const cacheKey = `tenant_stats:${tenantId}`;
      
      let stats = await redisClient.get(cacheKey);
      
      if (stats) {
        return JSON.parse(stats);
      }

      // Calculate stats from database
      stats = {
        users: 0,
        companies: 0,
        activeUsers: 0,
        storageUsed: 0,
        lastActivity: null
      };

      // Cache for 5 minutes
      await redisClient.setex(cacheKey, 300, JSON.stringify(stats));
      
      return stats;
    } catch (error) {
      logger.error('Error getting tenant stats:', error);
      return null;
    }
  }
}

module.exports = TenantMiddleware;