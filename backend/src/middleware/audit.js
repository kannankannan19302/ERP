const logger = require('../utils/logger');
const config = require('../config');
const AuditLog = require('../models/AuditLog');

class AuditMiddleware {
  // Main audit logging middleware
  static auditRequest(req, res, next) {
    if (!config.features.auditLogs) {
      return next();
    }

    // Skip audit for certain endpoints
    if (AuditMiddleware.shouldSkipAudit(req)) {
      return next();
    }

    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Capture request start time
    const startTime = Date.now();
    
    // Capture request data
    const requestData = {
      method: req.method,
      url: req.originalUrl,
      headers: AuditMiddleware.sanitizeHeaders(req.headers),
      query: req.query,
      body: AuditMiddleware.sanitizeBody(req.body),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: null,
      tenantId: null,
      timestamp: new Date().toISOString()
    };

    // Override response methods to capture response data
    res.send = function(data) {
      AuditMiddleware.logResponse(requestData, res, data, startTime);
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      AuditMiddleware.logResponse(requestData, res, data, startTime);
      return originalJson.call(this, data);
    };

    // Store request data for later use
    req.auditData = requestData;

    next();
  }

  // Log response data
  static async logResponse(requestData, res, responseData, startTime) {
    try {
      const endTime = Date.now();
      const duration = endTime - startTime;

      const auditEntry = {
        ...requestData,
        statusCode: res.statusCode,
        responseTime: duration,
        responseSize: JSON.stringify(responseData).length,
        success: res.statusCode < 400
      };

      // Add user context if available
      if (res.req.user) {
        auditEntry.userId = res.req.user.id;
        auditEntry.userEmail = res.req.user.email;
      }

      // Add tenant context if available
      if (res.req.tenant) {
        auditEntry.tenantId = res.req.tenant.id;
      }

      // Log to database asynchronously
      setImmediate(() => {
        AuditMiddleware.saveAuditLog(auditEntry);
      });

      // Log to application logger
      logger.logRequest(res.req, res, duration);

    } catch (error) {
      logger.error('Error logging audit response:', error);
    }
  }

  // Save audit log to database
  static async saveAuditLog(auditData) {
    try {
      await AuditLog.create(auditData);
    } catch (error) {
      logger.error('Error saving audit log:', error);
    }
  }

  // Data change audit middleware
  static auditDataChange(action = 'UPDATE') {
    return async (req, res, next) => {
      if (!config.features.auditLogs) {
        return next();
      }

      try {
        // Store original data for comparison
        if (action === 'UPDATE' && req.params.id) {
          const resourceId = req.params.id;
          const modelName = AuditMiddleware.extractModelName(req.route.path);
          
          if (modelName) {
            const Model = require(`../models/${modelName}`);
            const originalData = await Model.findById(resourceId);
            req.originalData = originalData;
          }
        }

        // Override response to capture changes
        const originalJson = res.json;
        res.json = function(data) {
          if (data.success && data.data) {
            setImmediate(() => {
              AuditMiddleware.logDataChange(req, action, data.data);
            });
          }
          return originalJson.call(this, data);
        };

        next();
      } catch (error) {
        logger.error('Error setting up data change audit:', error);
        next();
      }
    };
  }

  // Log data changes
  static async logDataChange(req, action, newData) {
    try {
      const auditEntry = {
        tenantId: req.tenantId,
        userId: req.user?.id,
        action,
        tableName: AuditMiddleware.extractTableName(req.route.path),
        recordId: newData.id || req.params.id,
        oldValues: req.originalData || null,
        newValues: newData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      };

      await AuditLog.createDataChangeLog(auditEntry);
      
      logger.logAudit(
        action,
        auditEntry.tableName,
        auditEntry.userId,
        auditEntry.tenantId,
        auditEntry.oldValues,
        auditEntry.newValues
      );

    } catch (error) {
      logger.error('Error logging data change:', error);
    }
  }

  // Authentication audit middleware
  static auditAuth(action) {
    return (req, res, next) => {
      const originalJson = res.json;
      
      res.json = function(data) {
        if (action === 'LOGIN' && data.success) {
          setImmediate(() => {
            AuditMiddleware.logAuthEvent(req, action, {
              success: true,
              userId: data.data?.user?.id,
              email: data.data?.user?.email
            });
          });
        } else if (action === 'LOGOUT') {
          setImmediate(() => {
            AuditMiddleware.logAuthEvent(req, action, {
              success: data.success,
              userId: req.user?.id
            });
          });
        } else if (!data.success) {
          setImmediate(() => {
            AuditMiddleware.logAuthEvent(req, action, {
              success: false,
              error: data.error?.message,
              attemptedEmail: req.body?.email
            });
          });
        }
        
        return originalJson.call(this, data);
      };

      next();
    };
  }

  // Log authentication events
  static async logAuthEvent(req, action, details) {
    try {
      const auditEntry = {
        tenantId: req.tenantId,
        userId: details.userId || null,
        action: `AUTH_${action}`,
        details: {
          ...details,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        }
      };

      await AuditLog.createAuthLog(auditEntry);
      
      logger.logSecurity(`AUTH_${action}`, details, req);

    } catch (error) {
      logger.error('Error logging auth event:', error);
    }
  }

  // Security event audit
  static async auditSecurityEvent(req, event, details = {}) {
    try {
      const auditEntry = {
        tenantId: req.tenantId,
        userId: req.user?.id,
        action: `SECURITY_${event}`,
        details: {
          ...details,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          timestamp: new Date().toISOString()
        }
      };

      await AuditLog.createSecurityLog(auditEntry);
      
      logger.logSecurity(event, details, req);

    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }

  // File operation audit
  static auditFileOperation(operation) {
    return (req, res, next) => {
      const originalJson = res.json;
      
      res.json = function(data) {
        if (data.success) {
          setImmediate(() => {
            AuditMiddleware.logFileOperation(req, operation, data.data);
          });
        }
        
        return originalJson.call(this, data);
      };

      next();
    };
  }

  // Log file operations
  static async logFileOperation(req, operation, fileData) {
    try {
      const auditEntry = {
        tenantId: req.tenantId,
        userId: req.user?.id,
        action: `FILE_${operation}`,
        details: {
          fileName: fileData?.filename || req.file?.filename,
          fileSize: fileData?.size || req.file?.size,
          mimeType: fileData?.mimeType || req.file?.mimetype,
          operation,
          timestamp: new Date().toISOString()
        }
      };

      await AuditLog.createFileLog(auditEntry);

    } catch (error) {
      logger.error('Error logging file operation:', error);
    }
  }

  // Helper methods
  static shouldSkipAudit(req) {
    const skipPaths = [
      '/health',
      '/metrics',
      '/favicon.ico',
      '/api/v1/auth/refresh'
    ];

    const skipMethods = ['OPTIONS'];

    return skipPaths.some(path => req.path.startsWith(path)) ||
           skipMethods.includes(req.method);
  }

  static sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    
    return sanitized;
  }

  static sanitizeBody(body) {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'confirmPassword',
      'currentPassword',
      'newPassword',
      'token',
      'refreshToken',
      'apiKey',
      'secret'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  static extractModelName(routePath) {
    // Extract model name from route path
    // e.g., /api/v1/users/:id -> User
    const pathParts = routePath.split('/');
    const resourcePart = pathParts.find(part => !part.includes(':') && part !== 'api' && part !== 'v1');
    
    if (resourcePart) {
      return resourcePart.charAt(0).toUpperCase() + resourcePart.slice(1, -1);
    }
    
    return null;
  }

  static extractTableName(routePath) {
    // Extract table name from route path
    // e.g., /api/v1/users/:id -> users
    const pathParts = routePath.split('/');
    return pathParts.find(part => !part.includes(':') && part !== 'api' && part !== 'v1');
  }

  // Get audit logs with filtering
  static async getAuditLogs(filters = {}) {
    try {
      return await AuditLog.findWithFilters(filters);
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      throw error;
    }
  }

  // Generate audit report
  static async generateAuditReport(tenantId, startDate, endDate, options = {}) {
    try {
      const filters = {
        tenantId,
        startDate,
        endDate,
        ...options
      };

      const logs = await AuditLog.findWithFilters(filters);
      
      const report = {
        summary: {
          totalEvents: logs.length,
          uniqueUsers: new Set(logs.map(log => log.userId).filter(Boolean)).size,
          dateRange: { startDate, endDate },
          generatedAt: new Date().toISOString()
        },
        events: logs,
        statistics: AuditMiddleware.calculateAuditStatistics(logs)
      };

      return report;
    } catch (error) {
      logger.error('Error generating audit report:', error);
      throw error;
    }
  }

  static calculateAuditStatistics(logs) {
    const stats = {
      byAction: {},
      byUser: {},
      byHour: {},
      byDay: {},
      errorRate: 0
    };

    logs.forEach(log => {
      // By action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      
      // By user
      if (log.userId) {
        stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
      }
      
      // By hour
      const hour = new Date(log.timestamp).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
      
      // By day
      const day = new Date(log.timestamp).toDateString();
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;
    });

    // Calculate error rate
    const errorLogs = logs.filter(log => !log.success);
    stats.errorRate = logs.length > 0 ? (errorLogs.length / logs.length) * 100 : 0;

    return stats;
  }
}

module.exports = AuditMiddleware;