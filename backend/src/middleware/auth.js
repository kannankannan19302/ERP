const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const User = require('../models/User');
const redis = require('../config/redis');

class AuthMiddleware {
  // Main authentication middleware
  static async authenticate(req, res, next) {
    try {
      const token = AuthMiddleware.extractToken(req);
      
      if (!token) {
        return AuthMiddleware.handleUnauthorized(res, 'No token provided');
      }

      // Check if token is blacklisted
      const isBlacklisted = await AuthMiddleware.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return AuthMiddleware.handleUnauthorized(res, 'Token has been revoked');
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Get user from database
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return AuthMiddleware.handleUnauthorized(res, 'User not found or inactive');
      }

      // Attach user and token info to request
      req.user = user;
      req.token = token;
      req.tokenPayload = decoded;

      // Update last activity
      await AuthMiddleware.updateLastActivity(user.id);

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return AuthMiddleware.handleUnauthorized(res, 'Invalid token');
      } else if (error.name === 'TokenExpiredError') {
        return AuthMiddleware.handleUnauthorized(res, 'Token expired');
      } else {
        logger.error('Authentication error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Authentication failed'
          }
        });
      }
    }
  }

  // Optional authentication (for public endpoints that can benefit from user context)
  static async optionalAuth(req, res, next) {
    try {
      const token = AuthMiddleware.extractToken(req);
      
      if (token) {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.userId);
        
        if (user && user.isActive) {
          req.user = user;
          req.token = token;
          req.tokenPayload = decoded;
        }
      }
      
      next();
    } catch (error) {
      // Ignore authentication errors for optional auth
      next();
    }
  }

  // Role-based authorization middleware
  static authorize(roles = []) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return AuthMiddleware.handleUnauthorized(res, 'Authentication required');
        }

        // Convert single role to array
        const requiredRoles = Array.isArray(roles) ? roles : [roles];
        
        // Super admin has access to everything
        if (req.user.roles.includes('super_admin')) {
          return next();
        }

        // Check if user has any of the required roles
        const hasRequiredRole = requiredRoles.some(role => 
          req.user.roles.includes(role)
        );

        if (!hasRequiredRole) {
          logger.logSecurity('UNAUTHORIZED_ACCESS_ATTEMPT', {
            userId: req.user.id,
            requiredRoles,
            userRoles: req.user.roles,
            endpoint: req.originalUrl
          }, req);

          return res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: 'You do not have permission to access this resource'
            }
          });
        }

        next();
      } catch (error) {
        logger.error('Authorization error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Authorization failed'
          }
        });
      }
    };
  }

  // Permission-based authorization middleware
  static requirePermission(permission) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return AuthMiddleware.handleUnauthorized(res, 'Authentication required');
        }

        // Super admin has all permissions
        if (req.user.roles.includes('super_admin')) {
          return next();
        }

        // Check if user has the required permission
        const hasPermission = await AuthMiddleware.checkUserPermission(req.user.id, permission);
        
        if (!hasPermission) {
          logger.logSecurity('PERMISSION_DENIED', {
            userId: req.user.id,
            permission,
            endpoint: req.originalUrl
          }, req);

          return res.status(403).json({
            success: false,
            error: {
              code: 'PERMISSION_DENIED',
              message: `Permission '${permission}' is required to access this resource`
            }
          });
        }

        next();
      } catch (error) {
        logger.error('Permission check error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'PERMISSION_CHECK_ERROR',
            message: 'Permission check failed'
          }
        });
      }
    };
  }

  // Resource ownership middleware
  static requireOwnership(resourceParam = 'id', resourceModel = null) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return AuthMiddleware.handleUnauthorized(res, 'Authentication required');
        }

        // Super admin and admin can access all resources
        if (req.user.roles.includes('super_admin') || req.user.roles.includes('admin')) {
          return next();
        }

        const resourceId = req.params[resourceParam];
        
        if (resourceModel) {
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

          // Check if user owns the resource or is assigned to it
          const isOwner = resource.createdBy === req.user.id || 
                         resource.assignedTo === req.user.id ||
                         resource.userId === req.user.id;

          if (!isOwner) {
            return res.status(403).json({
              success: false,
              error: {
                code: 'ACCESS_DENIED',
                message: 'You can only access your own resources'
              }
            });
          }
        }

        next();
      } catch (error) {
        logger.error('Ownership check error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'OWNERSHIP_CHECK_ERROR',
            message: 'Ownership check failed'
          }
        });
      }
    };
  }

  // Extract token from request headers
  static extractToken(req) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Also check query parameter for WebSocket connections
    return req.query.token || null;
  }

  // Check if token is blacklisted
  static async isTokenBlacklisted(token) {
    try {
      const redisClient = redis.getClient();
      const isBlacklisted = await redisClient.get(`blacklist:${token}`);
      return !!isBlacklisted;
    } catch (error) {
      logger.error('Error checking token blacklist:', error);
      return false; // Fail open for availability
    }
  }

  // Blacklist a token
  static async blacklistToken(token, expiresIn = 3600) {
    try {
      const redisClient = redis.getClient();
      await redisClient.setex(`blacklist:${token}`, expiresIn, 'true');
    } catch (error) {
      logger.error('Error blacklisting token:', error);
    }
  }

  // Update user's last activity
  static async updateLastActivity(userId) {
    try {
      const redisClient = redis.getClient();
      await redisClient.setex(`activity:${userId}`, 3600, new Date().toISOString());
    } catch (error) {
      logger.error('Error updating last activity:', error);
    }
  }

  // Check user permission
  static async checkUserPermission(userId, permission) {
    try {
      // This would typically query the database for user permissions
      // For now, we'll implement a basic check
      const user = await User.findById(userId);
      
      if (!user) return false;

      // Check role-based permissions
      for (const role of user.roles) {
        const rolePermissions = await AuthMiddleware.getRolePermissions(role);
        if (rolePermissions.includes(permission)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Error checking user permission:', error);
      return false;
    }
  }

  // Get permissions for a role
  static async getRolePermissions(roleName) {
    try {
      const redisClient = redis.getClient();
      const cacheKey = `role_permissions:${roleName}`;
      
      // Try to get from cache first
      let permissions = await redisClient.get(cacheKey);
      
      if (permissions) {
        return JSON.parse(permissions);
      }

      // If not in cache, get from database
      // This would query the role_permissions table
      permissions = []; // Placeholder
      
      // Cache for 1 hour
      await redisClient.setex(cacheKey, 3600, JSON.stringify(permissions));
      
      return permissions;
    } catch (error) {
      logger.error('Error getting role permissions:', error);
      return [];
    }
  }

  // Handle unauthorized access
  static handleUnauthorized(res, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message
      }
    });
  }

  // Generate JWT token
  static generateToken(payload, expiresIn = null) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: expiresIn || config.jwt.expiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });
  }

  // Generate refresh token
  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });
  }

  // Verify refresh token
  static verifyRefreshToken(token) {
    return jwt.verify(token, config.jwt.refreshSecret);
  }
}

module.exports = AuthMiddleware;