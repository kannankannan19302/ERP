# AgriERP System Architecture

## 1. System Overview

AgriERP follows a modern microservices-inspired architecture with a modular monolith approach, designed for scalability, maintainability, and customization.

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Admin Panel   │  Employee Portal │    Customer Portal          │
│   (React/Next)  │   (React/Next)   │     (React/Next)           │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  • Authentication & Authorization                               │
│  • Rate Limiting & Throttling                                  │
│  • Request Routing & Load Balancing                            │
│  • API Versioning                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                           │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Core Modules  │  Custom Modules │    Builder Engine           │
│   • HR & Payroll│  • User-Created │    • Module Generator       │
│   • Accounting  │  • Workflows    │    • Form Builder          │
│   • Sales       │  • Custom Fields│    • Report Builder        │
│   • Purchase    │  • Approvals    │    • Workflow Engine       │
│   • Inventory   │                 │                             │
│   • CRM         │                 │                             │
│   • Marketing   │                 │                             │
│   • Manufacturing│                │                             │
│   • Logistics   │                 │                             │
│   • Contracts   │                 │                             │
│   • Analytics   │                 │                             │
│   • E-commerce  │                 │                             │
│   • POS         │                 │                             │
│   • Projects    │                 │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Business Logic │  Integration    │    Notification Services    │
│  • Validation   │  • REST APIs    │    • Email Service         │
│  • Calculations │  • GraphQL      │    • SMS Service           │
│  • Workflows    │  • Webhooks     │    • WhatsApp Service      │
│  • Approvals    │  • Third-party  │    • Push Notifications    │
│                 │    APIs         │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Database      │   File Storage  │    Cache Layer              │
│   • PostgreSQL  │   • Local FS    │    • Redis                 │
│   • SQL Server  │   • AWS S3      │    • In-Memory Cache       │
│   • Oracle      │   • Azure Blob  │                             │
│                 │   • GCP Storage │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

## 2. Component Architecture

### 2.1 Frontend Architecture

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Common components (buttons, forms, etc.)
│   │   ├── layout/          # Layout components (header, sidebar, etc.)
│   │   └── modules/         # Module-specific components
│   ├── pages/               # Next.js pages
│   │   ├── admin/           # Admin panel pages
│   │   ├── employee/        # Employee portal pages
│   │   └── customer/        # Customer portal pages
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API service calls
│   ├── store/               # State management (Redux/Zustand)
│   ├── utils/               # Utility functions
│   └── styles/              # Global styles and themes
```

### 2.2 Backend Architecture

```
backend/
├── src/
│   ├── controllers/         # Request handlers
│   ├── models/              # Database models
│   ├── services/            # Business logic
│   ├── middleware/          # Express middleware
│   ├── routes/              # API routes
│   ├── utils/               # Utility functions
│   └── modules/             # Feature modules
│       ├── hr/              # HR module
│       ├── accounting/      # Accounting module
│       ├── sales/           # Sales module
│       ├── purchase/        # Purchase module
│       ├── inventory/       # Inventory module
│       ├── crm/             # CRM module
│       ├── marketing/       # Marketing module
│       ├── manufacturing/   # Manufacturing module
│       ├── logistics/       # Logistics module
│       ├── contracts/       # Contracts module
│       ├── analytics/       # Analytics module
│       ├── ecommerce/       # E-commerce module
│       ├── pos/             # POS module
│       ├── projects/        # Project management module
│       └── builder/         # Builder module
```

## 3. Database Architecture

### 3.1 Multi-Database Support

The system uses a database abstraction layer to support multiple database engines:

```javascript
// Database abstraction layer
class DatabaseAdapter {
  constructor(type, config) {
    this.type = type; // 'postgresql', 'sqlserver', 'oracle'
    this.config = config;
    this.connection = this.createConnection();
  }

  createConnection() {
    switch (this.type) {
      case 'postgresql':
        return new PostgreSQLAdapter(this.config);
      case 'sqlserver':
        return new SQLServerAdapter(this.config);
      case 'oracle':
        return new OracleAdapter(this.config);
      default:
        throw new Error(`Unsupported database type: ${this.type}`);
    }
  }
}
```

### 3.2 Multi-Tenant Architecture

```sql
-- Core tenant structure
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    database_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- All other tables include tenant_id for data isolation
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    -- other fields
);
```

## 4. Security Architecture

### 4.1 Authentication & Authorization

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   Auth Service  │    │   Resource      │
│                 │    │                 │    │   Server        │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ 1. Login Request│───►│ 2. Validate     │    │                 │
│                 │    │    Credentials  │    │                 │
│                 │    │                 │    │                 │
│ 4. Store Tokens │◄───│ 3. Generate JWT │    │                 │
│                 │    │    & Refresh    │    │                 │
│                 │    │                 │    │                 │
│ 5. API Request  │────┼─────────────────┼───►│ 6. Verify JWT   │
│    + JWT        │    │                 │    │                 │
│                 │    │                 │    │                 │
│ 8. Response     │◄───┼─────────────────┼────│ 7. Process      │
│                 │    │                 │    │    Request      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 4.2 Role-Based Access Control (RBAC)

```sql
-- Roles and permissions structure
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- create, read, update, delete
    conditions JSONB -- field-level and record-level conditions
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id),
    permission_id UUID REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);
```

## 5. Module Architecture

### 5.1 Module Structure

Each module follows a consistent structure:

```
modules/[module-name]/
├── controllers/         # HTTP request handlers
├── models/             # Database models
├── services/           # Business logic
├── routes/             # API routes
├── validators/         # Input validation schemas
├── migrations/         # Database migrations
├── seeds/              # Sample data
├── tests/              # Unit and integration tests
└── config/             # Module configuration
```

### 5.2 Module Registration

```javascript
// Module registry system
class ModuleRegistry {
  constructor() {
    this.modules = new Map();
  }

  register(module) {
    this.modules.set(module.name, module);
    this.loadRoutes(module);
    this.runMigrations(module);
  }

  loadRoutes(module) {
    // Load module routes into Express app
  }

  runMigrations(module) {
    // Run module-specific database migrations
  }
}
```

## 6. Builder Module Architecture

### 6.1 Dynamic Schema Generation

```javascript
// Schema builder for custom modules
class SchemaBuilder {
  generateModel(schema) {
    const fields = schema.fields.map(field => ({
      name: field.name,
      type: this.mapFieldType(field.type),
      constraints: field.constraints
    }));

    return this.createDynamicModel(schema.tableName, fields);
  }

  generateAPI(schema) {
    return {
      routes: this.generateRoutes(schema),
      controllers: this.generateControllers(schema),
      validators: this.generateValidators(schema)
    };
  }
}
```

## 7. Integration Architecture

### 7.1 API Gateway

```javascript
// API Gateway configuration
const gateway = {
  routes: [
    {
      path: '/api/v1/hr/*',
      target: 'http://localhost:3001',
      module: 'hr'
    },
    {
      path: '/api/v1/accounting/*',
      target: 'http://localhost:3002',
      module: 'accounting'
    }
    // ... other modules
  ],
  middleware: [
    authenticationMiddleware,
    authorizationMiddleware,
    rateLimitingMiddleware,
    loggingMiddleware
  ]
};
```

### 7.2 Event-Driven Architecture

```javascript
// Event system for inter-module communication
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  emit(event, data) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
}
```

## 8. Deployment Architecture

### 8.1 Container Architecture

```dockerfile
# Multi-stage Docker build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 8.2 Cloud Deployment

```yaml
# Kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agrierp-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agrierp-backend
  template:
    metadata:
      labels:
        app: agrierp-backend
    spec:
      containers:
      - name: backend
        image: agrierp/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## 9. Performance & Scalability

### 9.1 Caching Strategy

```javascript
// Multi-level caching
const cacheStrategy = {
  levels: [
    {
      name: 'memory',
      ttl: 300, // 5 minutes
      maxSize: '100MB'
    },
    {
      name: 'redis',
      ttl: 3600, // 1 hour
      cluster: true
    },
    {
      name: 'database',
      persistent: true
    }
  ]
};
```

### 9.2 Database Optimization

```sql
-- Indexing strategy
CREATE INDEX CONCURRENTLY idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX CONCURRENTLY idx_orders_date_status ON orders(order_date, status);
CREATE INDEX CONCURRENTLY idx_inventory_product_location ON inventory(product_id, location_id);

-- Partitioning for large tables
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- other fields
) PARTITION BY RANGE (created_at);
```

This architecture provides a solid foundation for building a scalable, maintainable, and customizable ERP system that can grow with the business needs while maintaining performance and security standards.