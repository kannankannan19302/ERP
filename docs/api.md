# AgriERP API Specifications

## 1. API Overview

The AgriERP system provides comprehensive REST and GraphQL APIs for all modules. All APIs follow RESTful principles with consistent response formats, proper HTTP status codes, and comprehensive error handling.

### 1.1 Base URL Structure
```
Production: https://api.agrierp.com/v1
Development: http://localhost:3000/api/v1
```

### 1.2 Authentication
All API endpoints require authentication using JWT tokens:
```
Authorization: Bearer <jwt_token>
```

### 1.3 Standard Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 1.4 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

## 2. Authentication & Authorization APIs

### 2.1 Authentication Endpoints

#### POST /auth/login
Login with email and password
```json
// Request
{
  "email": "user@example.com",
  "password": "password123",
  "tenant": "company-subdomain"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["admin", "sales_manager"]
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 3600
    },
    "permissions": ["users.read", "sales.create", "inventory.update"]
  }
}
```

#### POST /auth/refresh
Refresh access token
```json
// Request
{
  "refreshToken": "jwt_refresh_token"
}

// Response
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "expiresIn": 3600
  }
}
```

#### POST /auth/logout
Logout and invalidate tokens
```json
// Request
{
  "refreshToken": "jwt_refresh_token"
}

// Response
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /auth/forgot-password
Request password reset
```json
// Request
{
  "email": "user@example.com",
  "tenant": "company-subdomain"
}

// Response
{
  "success": true,
  "message": "Password reset email sent"
}
```

### 2.2 User Management Endpoints

#### GET /users
Get list of users with pagination and filtering
```
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- search: string
- role: string
- status: active|inactive
- company: uuid
- department: uuid
```

#### GET /users/:id
Get user by ID
```json
// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "avatar": "https://example.com/avatar.jpg",
    "roles": [
      {
        "id": "uuid",
        "name": "Sales Manager",
        "permissions": ["sales.create", "sales.read"]
      }
    ],
    "company": {
      "id": "uuid",
      "name": "ABC Company"
    },
    "department": {
      "id": "uuid",
      "name": "Sales"
    },
    "isActive": true,
    "lastLoginAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /users
Create new user
```json
// Request
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "password": "password123",
  "companyId": "uuid",
  "departmentId": "uuid",
  "roleIds": ["uuid1", "uuid2"]
}
```

#### PUT /users/:id
Update user
```json
// Request
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1234567890",
  "departmentId": "uuid",
  "roleIds": ["uuid1", "uuid2"],
  "isActive": true
}
```

#### DELETE /users/:id
Deactivate user (soft delete)

## 3. HR & Payroll APIs

### 3.1 Employee Management

#### GET /hr/employees
Get employees list
```
Query Parameters:
- page, limit, search (standard pagination)
- department: uuid
- position: uuid
- status: active|inactive|terminated
- hireDate: date range (from,to)
```

#### POST /hr/employees
Create employee
```json
// Request
{
  "employeeCode": "EMP001",
  "userId": "uuid", // optional, if user already exists
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-15",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  },
  "employmentInfo": {
    "hireDate": "2024-01-01",
    "employmentType": "full-time",
    "departmentId": "uuid",
    "positionId": "uuid",
    "managerId": "uuid",
    "branchId": "uuid",
    "salary": 50000
  },
  "bankDetails": {
    "accountNumber": "1234567890",
    "routingNumber": "123456789",
    "bankName": "ABC Bank"
  }
}
```

### 3.2 Attendance Management

#### GET /hr/attendance
Get attendance records
```
Query Parameters:
- employeeId: uuid
- date: date or date range (from,to)
- status: present|absent|late|half-day
```

#### POST /hr/attendance/check-in
Employee check-in
```json
// Request
{
  "employeeId": "uuid",
  "checkInTime": "2024-01-15T09:00:00Z",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

#### POST /hr/attendance/check-out
Employee check-out
```json
// Request
{
  "attendanceId": "uuid",
  "checkOutTime": "2024-01-15T18:00:00Z",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

### 3.3 Leave Management

#### GET /hr/leave-requests
Get leave requests
```
Query Parameters:
- employeeId: uuid
- status: pending|approved|rejected
- leaveType: uuid
- dateRange: from,to
```

#### POST /hr/leave-requests
Submit leave request
```json
// Request
{
  "employeeId": "uuid",
  "leaveTypeId": "uuid",
  "startDate": "2024-02-01",
  "endDate": "2024-02-05",
  "daysRequested": 5,
  "reason": "Family vacation"
}
```

#### PUT /hr/leave-requests/:id/approve
Approve leave request
```json
// Request
{
  "approvedBy": "uuid",
  "comments": "Approved for vacation"
}
```

## 4. Sales APIs

### 4.1 Customer Management

#### GET /sales/customers
Get customers list
```
Query Parameters:
- page, limit, search
- type: individual|company
- salesPerson: uuid
- tags: array of strings
- isActive: boolean
```

#### POST /sales/customers
Create customer
```json
// Request
{
  "customerCode": "CUST001",
  "name": "ABC Company",
  "type": "company",
  "email": "contact@abc.com",
  "phone": "+1234567890",
  "taxId": "123456789",
  "creditLimit": 10000,
  "paymentTerms": 30,
  "salesPersonId": "uuid",
  "billingAddress": {
    "street": "123 Business Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "shippingAddress": {
    "street": "456 Warehouse St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10002",
    "country": "USA"
  },
  "contactPersons": [
    {
      "name": "John Smith",
      "email": "john@abc.com",
      "phone": "+1234567890",
      "designation": "Purchase Manager"
    }
  ]
}
```

### 4.2 Sales Orders

#### GET /sales/orders
Get sales orders
```
Query Parameters:
- page, limit, search
- customerId: uuid
- status: draft|confirmed|delivered|invoiced|cancelled
- dateRange: from,to
- salesPerson: uuid
```

#### POST /sales/orders
Create sales order
```json
// Request
{
  "customerId": "uuid",
  "orderDate": "2024-01-15",
  "deliveryDate": "2024-01-20",
  "salesPersonId": "uuid",
  "currencyId": "uuid",
  "priceListId": "uuid",
  "billingAddress": {
    "street": "123 Business Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "shippingAddress": {
    "street": "456 Warehouse St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10002"
  },
  "lines": [
    {
      "productId": "uuid",
      "description": "Product A",
      "quantity": 10,
      "unitPrice": 100,
      "discountPercent": 5,
      "taxAmount": 50
    }
  ],
  "notes": "Special delivery instructions"
}
```

#### PUT /sales/orders/:id/confirm
Confirm sales order
```json
// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "SO-2024-001",
    "status": "confirmed",
    "confirmedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 4.3 Invoicing

#### GET /sales/invoices
Get invoices
```
Query Parameters:
- customerId: uuid
- status: draft|sent|paid|overdue|cancelled
- dateRange: from,to
- dueDate: from,to
```

#### POST /sales/invoices
Create invoice
```json
// Request
{
  "customerId": "uuid",
  "salesOrderId": "uuid", // optional
  "invoiceDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "currencyId": "uuid",
  "lines": [
    {
      "productId": "uuid",
      "description": "Product A",
      "quantity": 10,
      "unitPrice": 100,
      "discountPercent": 5,
      "taxAmount": 50
    }
  ],
  "paymentTerms": "Net 30 days",
  "notes": "Thank you for your business"
}
```

#### POST /sales/invoices/:id/send
Send invoice to customer
```json
// Request
{
  "sendEmail": true,
  "emailTemplate": "default_invoice",
  "customMessage": "Please find attached invoice"
}
```

## 5. Purchase APIs

### 5.1 Supplier Management

#### GET /purchase/suppliers
Get suppliers list
```
Query Parameters:
- page, limit, search
- type: individual|company
- isActive: boolean
- tags: array of strings
```

#### POST /purchase/suppliers
Create supplier
```json
// Request
{
  "supplierCode": "SUPP001",
  "name": "XYZ Suppliers",
  "type": "company",
  "email": "contact@xyz.com",
  "phone": "+1234567890",
  "taxId": "987654321",
  "creditLimit": 50000,
  "paymentTerms": 30,
  "currencyId": "uuid",
  "billingAddress": {
    "street": "789 Supplier St",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60601",
    "country": "USA"
  },
  "bankDetails": {
    "accountNumber": "9876543210",
    "routingNumber": "987654321",
    "bankName": "XYZ Bank",
    "swiftCode": "XYZBUS33"
  }
}
```

### 5.2 Purchase Orders

#### GET /purchase/orders
Get purchase orders
```
Query Parameters:
- supplierId: uuid
- status: draft|confirmed|received|invoiced|cancelled
- dateRange: from,to
- buyer: uuid
```

#### POST /purchase/orders
Create purchase order
```json
// Request
{
  "supplierId": "uuid",
  "orderDate": "2024-01-15",
  "expectedDeliveryDate": "2024-01-25",
  "buyerId": "uuid",
  "currencyId": "uuid",
  "deliveryAddress": {
    "street": "123 Warehouse St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "lines": [
    {
      "productId": "uuid",
      "description": "Raw Material A",
      "quantity": 100,
      "unitPrice": 50,
      "discountPercent": 2,
      "taxAmount": 100
    }
  ],
  "termsConditions": "Standard purchase terms",
  "notes": "Urgent delivery required"
}
```

## 6. Inventory APIs

### 6.1 Product Management

#### GET /inventory/products
Get products list
```
Query Parameters:
- page, limit, search
- categoryId: uuid
- type: stockable|consumable|service
- isActive: boolean
- lowStock: boolean (products below reorder level)
```

#### POST /inventory/products
Create product
```json
// Request
{
  "sku": "PROD001",
  "name": "Product A",
  "description": "High quality product",
  "categoryId": "uuid",
  "type": "stockable",
  "unitOfMeasureId": "uuid",
  "purchaseUnitId": "uuid",
  "salesUnitId": "uuid",
  "costPrice": 50,
  "salesPrice": 100,
  "weight": 1.5,
  "volume": 0.5,
  "dimensions": {
    "length": 10,
    "width": 5,
    "height": 3
  },
  "barcode": "1234567890123",
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "reorderLevel": 20,
  "leadTime": 7,
  "shelfLife": 365,
  "storageConditions": "Store in cool, dry place",
  "attributes": {
    "color": "Red",
    "size": "Medium",
    "material": "Cotton"
  }
}
```

### 6.2 Stock Management

#### GET /inventory/stock
Get current stock levels
```
Query Parameters:
- productId: uuid
- locationId: uuid
- warehouseId: uuid
- lowStock: boolean
- zeroStock: boolean
```

#### POST /inventory/stock/adjustment
Stock adjustment
```json
// Request
{
  "productId": "uuid",
  "locationId": "uuid",
  "adjustmentType": "increase|decrease",
  "quantity": 10,
  "reason": "Physical count adjustment",
  "reference": "ADJ-001",
  "unitCost": 50
}
```

#### GET /inventory/stock/movements
Get stock movements
```
Query Parameters:
- productId: uuid
- locationId: uuid
- movementType: in|out|internal|adjustment
- dateRange: from,to
```

### 6.3 Warehouse Management

#### GET /inventory/warehouses
Get warehouses list

#### POST /inventory/warehouses
Create warehouse
```json
// Request
{
  "name": "Main Warehouse",
  "code": "WH001",
  "type": "warehouse",
  "branchId": "uuid",
  "address": {
    "street": "123 Warehouse Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "managerId": "uuid",
  "capacity": 10000
}
```

## 7. Agriculture-Specific APIs

### 7.1 Farmer Management

#### GET /agriculture/farmers
Get farmers list
```
Query Parameters:
- page, limit, search
- agentId: uuid
- farmingType: organic|conventional|mixed
- isActive: boolean
```

#### POST /agriculture/farmers
Create farmer
```json
// Request
{
  "farmerCode": "FARM001",
  "name": "John Farmer",
  "contactPerson": "John Farmer",
  "phone": "+1234567890",
  "email": "john@farm.com",
  "address": {
    "street": "123 Farm Road",
    "city": "Rural Town",
    "state": "IA",
    "zipCode": "50001"
  },
  "farmSize": 100, // acres
  "cropsGrown": ["corn", "soybeans", "wheat"],
  "farmingType": "conventional",
  "certificationDetails": {
    "organic": false,
    "gmp": true,
    "certifyingBody": "USDA"
  },
  "bankDetails": {
    "accountNumber": "1234567890",
    "routingNumber": "123456789",
    "bankName": "Rural Bank"
  },
  "agentId": "uuid"
}
```

### 7.2 Farmer Contracts

#### GET /agriculture/contracts
Get farmer contracts
```
Query Parameters:
- farmerId: uuid
- cropType: string
- season: string
- contractYear: number
- status: draft|active|completed|cancelled
```

#### POST /agriculture/contracts
Create farmer contract
```json
// Request
{
  "farmerId": "uuid",
  "cropType": "corn",
  "season": "kharif",
  "contractYear": 2024,
  "areaContracted": 50, // acres
  "expectedYield": 200, // tons
  "pricePerUnit": 250, // per ton
  "advanceAmount": 10000,
  "qualityParameters": {
    "moistureContent": "max 14%",
    "foreignMatter": "max 2%",
    "damagedGrains": "max 3%"
  },
  "deliverySchedule": [
    {
      "date": "2024-10-15",
      "quantity": 100,
      "location": "Main Warehouse"
    }
  ],
  "termsConditions": "Standard contract terms",
  "startDate": "2024-06-01",
  "endDate": "2024-11-30"
}
```

### 7.3 Crop Deliveries

#### GET /agriculture/deliveries
Get crop deliveries
```
Query Parameters:
- farmerId: uuid
- contractId: uuid
- cropType: string
- dateRange: from,to
- paymentStatus: pending|paid|partial
```

#### POST /agriculture/deliveries
Record crop delivery
```json
// Request
{
  "farmerContractId": "uuid",
  "farmerId": "uuid",
  "deliveryDate": "2024-10-15",
  "cropType": "corn",
  "quantityDelivered": 50, // tons
  "qualityGrade": "A",
  "moistureContent": 13.5,
  "qualityParameters": {
    "foreignMatter": 1.5,
    "damagedGrains": 2.0,
    "testWeight": 78
  },
  "pricePerUnit": 250,
  "deductions": {
    "qualityDeduction": 500,
    "advanceAdjustment": 2000,
    "transportCharges": 300
  },
  "warehouseId": "uuid",
  "receivedBy": "uuid",
  "qualityCheckedBy": "uuid",
  "notes": "Good quality delivery"
}
```

### 7.4 Agent Commissions

#### GET /agriculture/commissions
Get agent commissions
```
Query Parameters:
- agentId: uuid
- farmerId: uuid
- paymentStatus: pending|paid
- dateRange: from,to
```

#### POST /agriculture/commissions/calculate
Calculate commission for delivery
```json
// Request
{
  "deliveryId": "uuid",
  "commissionType": "percentage",
  "commissionRate": 2.5 // 2.5%
}

// Response
{
  "success": true,
  "data": {
    "agentId": "uuid",
    "farmerId": "uuid",
    "deliveryId": "uuid",
    "calculationBase": 12000, // net amount
    "commissionRate": 2.5,
    "commissionAmount": 300
  }
}
```

## 8. CRM APIs

### 8.1 Lead Management

#### GET /crm/leads
Get leads list
```
Query Parameters:
- assignedTo: uuid
- status: new|contacted|qualified|converted|lost
- source: website|referral|advertisement|cold_call
- dateRange: from,to
```

#### POST /crm/leads
Create lead
```json
// Request
{
  "name": "Jane Prospect",
  "companyName": "Prospect Company",
  "email": "jane@prospect.com",
  "phone": "+1234567890",
  "source": "website",
  "assignedTo": "uuid",
  "expectedRevenue": 50000,
  "expectedCloseDate": "2024-03-01",
  "address": {
    "street": "456 Prospect St",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02101"
  },
  "notes": "Interested in our premium products",
  "tags": ["hot-lead", "enterprise"]
}
```

#### PUT /crm/leads/:id/convert
Convert lead to customer
```json
// Request
{
  "createOpportunity": true,
  "opportunityName": "Prospect Company Deal",
  "expectedRevenue": 50000,
  "expectedCloseDate": "2024-03-01"
}
```

### 8.2 Opportunity Management

#### GET /crm/opportunities
Get opportunities
```
Query Parameters:
- assignedTo: uuid
- stage: string
- status: open|won|lost|cancelled
- expectedCloseDate: from,to
```

#### POST /crm/opportunities
Create opportunity
```json
// Request
{
  "name": "Big Deal Opportunity",
  "customerId": "uuid",
  "stage": "proposal",
  "probability": 60,
  "expectedRevenue": 100000,
  "expectedCloseDate": "2024-04-01",
  "assignedTo": "uuid",
  "source": "referral",
  "description": "Large order for agricultural products",
  "nextAction": "Send proposal",
  "nextActionDate": "2024-01-20"
}
```

### 8.3 Activity Management

#### GET /crm/activities
Get activities
```
Query Parameters:
- assignedTo: uuid
- type: call|meeting|task|email
- status: planned|in_progress|completed|cancelled
- dueDate: from,to
- relatedTo: lead|opportunity|customer
```

#### POST /crm/activities
Create activity
```json
// Request
{
  "type": "meeting",
  "subject": "Product Demo",
  "description": "Demonstrate our ERP solution",
  "relatedToType": "opportunity",
  "relatedToId": "uuid",
  "assignedTo": "uuid",
  "dueDate": "2024-01-20T14:00:00Z",
  "duration": 60, // minutes
  "location": "Customer Office",
  "attendees": [
    {
      "name": "John Customer",
      "email": "john@customer.com",
      "type": "external"
    }
  ],
  "priority": "high"
}
```

## 9. Builder Module APIs

### 9.1 Custom Module Management

#### GET /builder/modules
Get custom modules
```
Query Parameters:
- status: draft|published|archived
- createdBy: uuid
```

#### POST /builder/modules
Create custom module
```json
// Request
{
  "name": "Custom Inspection Module",
  "code": "custom_inspection",
  "description": "Module for quality inspections",
  "icon": "inspection",
  "color": "#4CAF50",
  "schemaDefinition": {
    "tableName": "custom_inspections",
    "fields": [
      {
        "name": "inspection_date",
        "type": "date",
        "required": true,
        "label": "Inspection Date"
      },
      {
        "name": "inspector_name",
        "type": "text",
        "required": true,
        "label": "Inspector Name"
      },
      {
        "name": "quality_score",
        "type": "number",
        "required": true,
        "label": "Quality Score",
        "validation": {
          "min": 0,
          "max": 100
        }
      },
      {
        "name": "status",
        "type": "select",
        "required": true,
        "label": "Status",
        "options": ["pending", "approved", "rejected"]
      }
    ]
  },
  "uiDefinition": {
    "listView": {
      "columns": ["inspection_date", "inspector_name", "quality_score", "status"],
      "filters": ["status", "inspection_date"],
      "searchFields": ["inspector_name"]
    },
    "formView": {
      "layout": "two-column",
      "sections": [
        {
          "title": "Basic Information",
          "fields": ["inspection_date", "inspector_name"]
        },
        {
          "title": "Quality Assessment",
          "fields": ["quality_score", "status"]
        }
      ]
    }
  },
  "workflowDefinition": {
    "states": ["draft", "submitted", "approved", "rejected"],
    "transitions": [
      {
        "from": "draft",
        "to": "submitted",
        "trigger": "submit",
        "conditions": ["quality_score >= 50"]
      },
      {
        "from": "submitted",
        "to": "approved",
        "trigger": "approve",
        "requiredRole": "quality_manager"
      }
    ]
  }
}
```

#### PUT /builder/modules/:id/publish
Publish custom module
```json
// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "published",
    "publishedAt": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### 9.2 Dynamic Data Management

#### GET /builder/modules/:moduleId/records
Get records from custom module
```
Query Parameters:
- page, limit, search
- filters: JSON object with field filters
- sort: field name and direction
```

#### POST /builder/modules/:moduleId/records
Create record in custom module
```json
// Request
{
  "recordData": {
    "inspection_date": "2024-01-15",
    "inspector_name": "John Inspector",
    "quality_score": 85,
    "status": "pending"
  }
}
```

#### PUT /builder/modules/:moduleId/records/:recordId
Update record in custom module

#### DELETE /builder/modules/:moduleId/records/:recordId
Delete record from custom module

### 9.3 Workflow Management

#### GET /builder/workflows
Get approval workflows

#### POST /builder/workflows
Create approval workflow
```json
// Request
{
  "name": "Purchase Order Approval",
  "moduleName": "purchase_orders",
  "conditions": {
    "totalAmount": {
      "operator": "greater_than",
      "value": 10000
    }
  },
  "steps": [
    {
      "stepNumber": 1,
      "name": "Department Manager Approval",
      "approverRole": "department_manager",
      "conditions": {
        "totalAmount": {
          "operator": "less_than",
          "value": 50000
        }
      }
    },
    {
      "stepNumber": 2,
      "name": "Finance Manager Approval",
      "approverRole": "finance_manager",
      "conditions": {
        "totalAmount": {
          "operator": "greater_than_equal",
          "value": 50000
        }
      }
    }
  ]
}
```

## 10. Analytics & Reporting APIs

### 10.1 Dashboard APIs

#### GET /analytics/dashboard/sales
Get sales dashboard data
```json
// Response
{
  "success": true,
  "data": {
    "totalSales": 150000,
    "salesGrowth": 12.5, // percentage
    "totalOrders": 45,
    "averageOrderValue": 3333.33,
    "topProducts": [
      {
        "productId": "uuid",
        "productName": "Product A",
        "salesAmount": 25000,
        "quantity": 100
      }
    ],
    "salesByMonth": [
      {
        "month": "2024-01",
        "sales": 50000,
        "orders": 15
      }
    ],
    "salesByRegion": [
      {
        "region": "North",
        "sales": 75000,
        "percentage": 50
      }
    ]
  }
}
```

#### GET /analytics/dashboard/inventory
Get inventory dashboard data
```json
// Response
{
  "success": true,
  "data": {
    "totalProducts": 250,
    "totalStockValue": 500000,
    "lowStockItems": 15,
    "outOfStockItems": 3,
    "topMovingProducts": [
      {
        "productId": "uuid",
        "productName": "Product A",
        "movementQuantity": 500,
        "movementValue": 25000
      }
    ],
    "stockByCategory": [
      {
        "categoryId": "uuid",
        "categoryName": "Raw Materials",
        "stockValue": 200000,
        "percentage": 40
      }
    ]
  }
}
```

### 10.2 Report Generation

#### POST /analytics/reports/generate
Generate custom report
```json
// Request
{
  "reportType": "sales_summary",
  "parameters": {
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "customerId": "uuid",
    "productCategory": "uuid",
    "groupBy": "month",
    "includeCharts": true
  },
  "format": "pdf", // pdf, excel, csv
  "emailTo": ["manager@company.com"]
}

// Response
{
  "success": true,
  "data": {
    "reportId": "uuid",
    "status": "generating",
    "estimatedTime": 30 // seconds
  }
}
```

#### GET /analytics/reports/:reportId/status
Get report generation status

#### GET /analytics/reports/:reportId/download
Download generated report

## 11. Integration APIs

### 11.1 Webhook Management

#### GET /integrations/webhooks
Get configured webhooks

#### POST /integrations/webhooks
Create webhook
```json
// Request
{
  "name": "Order Notification",
  "url": "https://external-system.com/webhook",
  "events": ["sales_order.created", "sales_order.confirmed"],
  "isActive": true,
  "headers": {
    "Authorization": "Bearer token123",
    "Content-Type": "application/json"
  },
  "retryPolicy": {
    "maxRetries": 3,
    "retryDelay": 5000 // milliseconds
  }
}
```

### 11.2 Data Import/Export

#### POST /integrations/import
Import data from file
```json
// Request (multipart/form-data)
{
  "file": "data.xlsx",
  "module": "products",
  "mapping": {
    "A": "sku",
    "B": "name",
    "C": "category",
    "D": "cost_price",
    "E": "sales_price"
  },
  "options": {
    "skipFirstRow": true,
    "updateExisting": true
  }
}
```

#### GET /integrations/export
Export data to file
```
Query Parameters:
- module: string (required)
- format: csv|excel|json
- filters: JSON object
- fields: comma-separated field names
```

This comprehensive API specification covers all major modules and functionalities of the AgriERP system, providing a solid foundation for frontend development and third-party integrations.