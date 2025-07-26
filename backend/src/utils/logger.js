const winston = require('winston');
const path = require('path');
const config = require('../config');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: 'agrierp-backend',
    version: config.app.version
  },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      tailable: true
    }),
    
    // Separate file for errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Add request logging helper
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    tenantId: req.tenant?.id
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

// Add database query logging helper
logger.logQuery = (query, duration, error = null) => {
  const logData = {
    query: query.sql || query,
    bindings: query.bindings,
    duration: `${duration}ms`
  };

  if (error) {
    logger.error('Database Query Error', { ...logData, error: error.message });
  } else if (duration > 1000) {
    logger.warn('Slow Database Query', logData);
  } else {
    logger.debug('Database Query', logData);
  }
};

// Add audit logging helper
logger.logAudit = (action, resource, userId, tenantId, oldData = null, newData = null) => {
  logger.info('Audit Log', {
    action,
    resource,
    userId,
    tenantId,
    oldData,
    newData,
    timestamp: new Date().toISOString()
  });
};

// Add security logging helper
logger.logSecurity = (event, details, req = null) => {
  const logData = {
    event,
    details,
    timestamp: new Date().toISOString()
  };

  if (req) {
    logData.ip = req.ip;
    logData.userAgent = req.get('User-Agent');
    logData.userId = req.user?.id;
    logData.tenantId = req.tenant?.id;
  }

  logger.warn('Security Event', logData);
};

// Add performance logging helper
logger.logPerformance = (operation, duration, metadata = {}) => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    ...metadata
  };

  if (duration > 5000) {
    logger.warn('Performance Issue', logData);
  } else {
    logger.debug('Performance Log', logData);
  }
};

module.exports = logger;