const path = require('path');

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1'
  },

  // Database configuration
  database: {
    type: process.env.DB_TYPE || 'postgresql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'agrierp_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    
    // SQL Server specific
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    
    // Oracle specific
    serviceName: process.env.DB_SERVICE_NAME,
    
    // Connection pool settings
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
      createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT) || 30000,
      destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT) || 5000,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL) || 1000,
      createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL) || 200
    }
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'agrierp:',
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'agrierp',
    audience: process.env.JWT_AUDIENCE || 'agrierp-users'
  },

  // Email configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'noreply@agrierp.com',
    templates: {
      path: path.join(__dirname, '../templates/email'),
      options: {
        viewEngine: {
          extname: '.hbs',
          layoutsDir: path.join(__dirname, '../templates/email/layouts'),
          defaultLayout: 'main',
          partialsDir: path.join(__dirname, '../templates/email/partials')
        },
        viewPath: path.join(__dirname, '../templates/email'),
        extName: '.hbs'
      }
    }
  },

  // File storage configuration
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    uploadPath: process.env.UPLOAD_PATH || 'uploads/',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ],
    
    // AWS S3 configuration
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET
    },
    
    // Azure Blob Storage configuration
    azure: {
      accountName: process.env.AZURE_STORAGE_ACCOUNT,
      accountKey: process.env.AZURE_STORAGE_KEY,
      containerName: process.env.AZURE_CONTAINER || 'agrierp-files'
    },
    
    // Google Cloud Storage configuration
    gcp: {
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE,
      bucket: process.env.GCP_BUCKET
    }
  },

  // SMS configuration
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    }
  },

  // WhatsApp configuration
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL,
    apiKey: process.env.WHATSAPP_API_KEY
  },

  // OAuth configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/auth/microsoft/callback'
    }
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD'
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    trustProxy: process.env.TRUST_PROXY === 'true'
  },

  // Multi-tenancy configuration
  multiTenancy: {
    enabled: process.env.MULTI_TENANCY_ENABLED !== 'false',
    defaultTenant: process.env.DEFAULT_TENANT || 'default',
    tenantHeader: process.env.TENANT_HEADER || 'x-tenant-id',
    subdomainTenancy: process.env.SUBDOMAIN_TENANCY === 'true'
  },

  // Feature flags
  features: {
    graphql: process.env.ENABLE_GRAPHQL === 'true',
    websockets: process.env.ENABLE_WEBSOCKETS !== 'false',
    cronJobs: process.env.ENABLE_CRON_JOBS !== 'false',
    auditLogs: process.env.ENABLE_AUDIT_LOGS !== 'false',
    swagger: process.env.SWAGGER_ENABLED === 'true'
  },

  // Cache configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    maxKeys: parseInt(process.env.CACHE_MAX_KEYS) || 1000,
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600 // 10 minutes
  },

  // Pagination defaults
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT) || 20,
    maxLimit: parseInt(process.env.MAX_PAGE_LIMIT) || 100
  },

  // Application specific
  app: {
    name: 'AgriERP',
    version: process.env.npm_package_version || '1.0.0',
    description: 'Agriculture-based ERP System',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@agrierp.com',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001'
  }
};

module.exports = config;