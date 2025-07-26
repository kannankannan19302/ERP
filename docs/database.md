# AgriERP Database Design & ERD

## 1. Database Schema Overview

The AgriERP system uses a comprehensive database schema designed to support multi-tenancy, role-based access control, and all ERP modules with agriculture-specific features.

## 2. Core System Tables

### 2.1 Multi-Tenancy & Authentication

```sql
-- Tenants (Multi-company support)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    database_name VARCHAR(100),
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies (Multiple companies per tenant)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    registration_number VARCHAR(100),
    tax_id VARCHAR(50),
    address JSONB,
    contact_info JSONB,
    logo_url VARCHAR(500),
    currency_code VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    fiscal_year_start DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branches/Locations
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    type VARCHAR(50) DEFAULT 'branch', -- branch, warehouse, store, farm
    address JSONB,
    contact_info JSONB,
    manager_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    language_code VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    last_login_at TIMESTAMP,
    email_verified_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Roles
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- create, read, update, delete, approve
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Permissions
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);
```

### 2.2 Audit & System Tables

```sql
-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- System Settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSONB,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, category, key)
);

-- File Attachments
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    file_path VARCHAR(500),
    storage_type VARCHAR(20) DEFAULT 'local', -- local, s3, azure, gcp
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,
    channels VARCHAR(100)[], -- email, sms, push, whatsapp
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. HR & Payroll Module

```sql
-- Employees
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    department_id UUID,
    position_id UUID,
    manager_id UUID REFERENCES employees(id),
    branch_id UUID REFERENCES branches(id),
    hire_date DATE NOT NULL,
    employment_type VARCHAR(50), -- full-time, part-time, contract, intern
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, terminated
    personal_info JSONB,
    emergency_contacts JSONB,
    bank_details JSONB,
    documents JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES departments(id),
    manager_id UUID REFERENCES employees(id),
    budget DECIMAL(15,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Positions/Job Titles
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    department_id UUID REFERENCES departments(id),
    description TEXT,
    requirements JSONB,
    salary_range JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    break_duration INTEGER DEFAULT 0, -- minutes
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'present', -- present, absent, late, half-day
    notes TEXT,
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- Leave Types
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    max_days_per_year INTEGER,
    carry_forward_allowed BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT TRUE,
    is_paid BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Requests
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll
CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, processing, completed, cancelled
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    payroll_period_id UUID REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    basic_salary DECIMAL(15,2) NOT NULL,
    allowances JSONB DEFAULT '{}',
    deductions JSONB DEFAULT '{}',
    overtime_amount DECIMAL(15,2) DEFAULT 0,
    gross_salary DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. Accounting & Finance Module

```sql
-- Chart of Accounts
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- asset, liability, equity, income, expense
    parent_id UUID REFERENCES chart_of_accounts(id),
    level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, company_id, code)
);

-- Journals
CREATE TABLE journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL, -- sales, purchase, cash, bank, general
    default_account_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal Entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    journal_id UUID REFERENCES journals(id),
    entry_number VARCHAR(50) NOT NULL,
    reference VARCHAR(100),
    description TEXT,
    entry_date DATE NOT NULL,
    total_debit DECIMAL(15,2) NOT NULL,
    total_credit DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, posted, cancelled
    created_by UUID REFERENCES users(id),
    posted_by UUID REFERENCES users(id),
    posted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal Entry Lines
CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    description TEXT,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    partner_id UUID, -- Reference to customers/suppliers
    analytic_account_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Currencies
CREATE TABLE currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10),
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exchange Rates
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    from_currency_id UUID REFERENCES currencies(id),
    to_currency_id UUID REFERENCES currencies(id),
    rate DECIMAL(12,6) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, from_currency_id, to_currency_id, date)
);

-- Tax Configurations
CREATE TABLE tax_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    type VARCHAR(20) NOT NULL, -- sales, purchase, both
    account_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. Sales Module

```sql
-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'individual', -- individual, company
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    website VARCHAR(255),
    tax_id VARCHAR(50),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30, -- days
    price_list_id UUID,
    sales_person_id UUID REFERENCES employees(id),
    billing_address JSONB,
    shipping_address JSONB,
    contact_persons JSONB,
    tags VARCHAR(255)[],
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price Lists
CREATE TABLE price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    currency_id UUID REFERENCES currencies(id),
    is_default BOOLEAN DEFAULT FALSE,
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Orders
CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    order_date DATE NOT NULL,
    delivery_date DATE,
    sales_person_id UUID REFERENCES employees(id),
    price_list_id UUID REFERENCES price_lists(id),
    currency_id UUID REFERENCES currencies(id),
    exchange_rate DECIMAL(12,6) DEFAULT 1,
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, confirmed, delivered, invoiced, cancelled
    billing_address JSONB,
    shipping_address JSONB,
    terms_conditions TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Order Lines
CREATE TABLE sales_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID,
    description TEXT NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    line_total DECIMAL(15,2) NOT NULL,
    delivered_quantity DECIMAL(12,3) DEFAULT 0,
    invoiced_quantity DECIMAL(12,3) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    sales_order_id UUID REFERENCES sales_orders(id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    currency_id UUID REFERENCES currencies(id),
    exchange_rate DECIMAL(12,6) DEFAULT 1,
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
    billing_address JSONB,
    payment_terms TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Lines
CREATE TABLE invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    sales_order_line_id UUID REFERENCES sales_order_lines(id),
    product_id UUID,
    description TEXT NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    line_total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    invoice_id UUID REFERENCES invoices(id),
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency_id UUID REFERENCES currencies(id),
    exchange_rate DECIMAL(12,6) DEFAULT 1,
    payment_method VARCHAR(50), -- cash, bank_transfer, credit_card, cheque
    reference VARCHAR(100),
    bank_account_id UUID,
    status VARCHAR(20) DEFAULT 'confirmed', -- draft, confirmed, cancelled
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 6. Purchase Module

```sql
-- Suppliers/Vendors
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'company', -- individual, company
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    website VARCHAR(255),
    tax_id VARCHAR(50),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30, -- days
    currency_id UUID REFERENCES currencies(id),
    billing_address JSONB,
    shipping_address JSONB,
    contact_persons JSONB,
    bank_details JSONB,
    tags VARCHAR(255)[],
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    buyer_id UUID REFERENCES employees(id),
    currency_id UUID REFERENCES currencies(id),
    exchange_rate DECIMAL(12,6) DEFAULT 1,
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, confirmed, received, invoiced, cancelled
    delivery_address JSONB,
    terms_conditions TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Order Lines
CREATE TABLE purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID,
    description TEXT NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    line_total DECIMAL(15,2) NOT NULL,
    received_quantity DECIMAL(12,3) DEFAULT 0,
    invoiced_quantity DECIMAL(12,3) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Bills
CREATE TABLE vendor_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    bill_number VARCHAR(50) NOT NULL,
    vendor_reference VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    currency_id UUID REFERENCES currencies(id),
    exchange_rate DECIMAL(12,6) DEFAULT 1,
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, confirmed, paid, overdue, cancelled
    payment_terms TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 7. Inventory & Warehouse Module

```sql
-- Product Categories
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Units of Measure
CREATE TABLE units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    category VARCHAR(50), -- weight, volume, length, area, time, unit
    ratio DECIMAL(12,6) DEFAULT 1, -- conversion ratio to base unit
    is_base_unit BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories(id),
    type VARCHAR(20) DEFAULT 'stockable', -- stockable, consumable, service
    unit_of_measure_id UUID REFERENCES units_of_measure(id),
    purchase_unit_id UUID REFERENCES units_of_measure(id),
    sales_unit_id UUID REFERENCES units_of_measure(id),
    cost_price DECIMAL(15,2) DEFAULT 0,
    sales_price DECIMAL(15,2) DEFAULT 0,
    weight DECIMAL(12,3),
    volume DECIMAL(12,3),
    dimensions JSONB, -- length, width, height
    barcode VARCHAR(100),
    internal_reference VARCHAR(100),
    supplier_reference VARCHAR(100),
    min_stock_level DECIMAL(12,3) DEFAULT 0,
    max_stock_level DECIMAL(12,3) DEFAULT 0,
    reorder_level DECIMAL(12,3) DEFAULT 0,
    lead_time INTEGER DEFAULT 0, -- days
    shelf_life INTEGER, -- days
    storage_conditions TEXT,
    images JSONB,
    attributes JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouses/Locations
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    type VARCHAR(50) DEFAULT 'warehouse', -- warehouse, store, transit, farm
    address JSONB,
    manager_id UUID REFERENCES employees(id),
    capacity DECIMAL(15,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Locations (within warehouses)
CREATE TABLE stock_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    type VARCHAR(50) DEFAULT 'internal', -- internal, customer, supplier, transit, inventory_loss
    parent_id UUID REFERENCES stock_locations(id),
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Movements
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    location_from_id UUID REFERENCES stock_locations(id),
    location_to_id UUID REFERENCES stock_locations(id),
    movement_type VARCHAR(50) NOT NULL, -- in, out, internal, adjustment
    reference VARCHAR(100),
    reference_id UUID, -- Reference to source document (PO, SO, etc.)
    quantity DECIMAL(12,3) NOT NULL,
    unit_cost DECIMAL(15,2),
    total_value DECIMAL(15,2),
    lot_number VARCHAR(100),
    serial_number VARCHAR(100),
    expiry_date DATE,
    movement_date TIMESTAMP NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Current Stock (Computed view or materialized view)
CREATE TABLE current_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    location_id UUID REFERENCES stock_locations(id),
    quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(12,3) DEFAULT 0,
    available_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    average_cost DECIMAL(15,2) DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    last_movement_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, product_id, location_id)
);

-- Lot/Batch Tracking
CREATE TABLE lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    lot_number VARCHAR(100) NOT NULL,
    production_date DATE,
    expiry_date DATE,
    supplier_id UUID REFERENCES suppliers(id),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    quality_status VARCHAR(20) DEFAULT 'approved', -- approved, rejected, quarantine
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, product_id, lot_number)
);

-- Serial Number Tracking
CREATE TABLE serial_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    serial_number VARCHAR(100) NOT NULL,
    lot_id UUID REFERENCES lots(id),
    status VARCHAR(20) DEFAULT 'available', -- available, sold, damaged, lost
    location_id UUID REFERENCES stock_locations(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, product_id, serial_number)
);
```

## 8. Agriculture-Specific Tables

```sql
-- Farmers
CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    farmer_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address JSONB,
    farm_size DECIMAL(10,2), -- in acres/hectares
    crops_grown VARCHAR(255)[],
    farming_type VARCHAR(50), -- organic, conventional, mixed
    certification_details JSONB,
    bank_details JSONB,
    agent_id UUID REFERENCES employees(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Farmer Contracts
CREATE TABLE farmer_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    farmer_id UUID REFERENCES farmers(id),
    crop_type VARCHAR(100) NOT NULL,
    season VARCHAR(50), -- kharif, rabi, summer
    contract_year INTEGER NOT NULL,
    area_contracted DECIMAL(10,2) NOT NULL, -- in acres/hectares
    expected_yield DECIMAL(12,3), -- in tons/quintals
    price_per_unit DECIMAL(15,2) NOT NULL,
    advance_amount DECIMAL(15,2) DEFAULT 0,
    quality_parameters JSONB,
    delivery_schedule JSONB,
    terms_conditions TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, completed, cancelled
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crop Deliveries
CREATE TABLE crop_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    delivery_number VARCHAR(50) UNIQUE NOT NULL,
    farmer_contract_id UUID REFERENCES farmer_contracts(id),
    farmer_id UUID REFERENCES farmers(id),
    delivery_date DATE NOT NULL,
    crop_type VARCHAR(100) NOT NULL,
    quantity_delivered DECIMAL(12,3) NOT NULL,
    quality_grade VARCHAR(20),
    moisture_content DECIMAL(5,2),
    quality_parameters JSONB,
    price_per_unit DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    deductions JSONB, -- quality deductions, advance adjustments
    net_amount DECIMAL(15,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, partial
    warehouse_id UUID REFERENCES warehouses(id),
    received_by UUID REFERENCES employees(id),
    quality_checked_by UUID REFERENCES employees(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent Commissions
CREATE TABLE agent_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES employees(id),
    farmer_id UUID REFERENCES farmers(id),
    delivery_id UUID REFERENCES crop_deliveries(id),
    commission_type VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed
    commission_rate DECIMAL(5,2),
    commission_amount DECIMAL(15,2) NOT NULL,
    calculation_base DECIMAL(15,2), -- amount on which commission is calculated
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seasons/Crop Cycles
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Kharif 2024, Rabi 2024-25
    season_type VARCHAR(50) NOT NULL, -- kharif, rabi, summer
    year INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    sowing_start DATE,
    sowing_end DATE,
    harvest_start DATE,
    harvest_end DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 9. CRM Module

```sql
-- Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    lead_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    source VARCHAR(50), -- website, referral, advertisement, cold_call
    status VARCHAR(20) DEFAULT 'new', -- new, contacted, qualified, converted, lost
    stage VARCHAR(50) DEFAULT 'prospect',
    assigned_to UUID REFERENCES employees(id),
    expected_revenue DECIMAL(15,2),
    probability DECIMAL(5,2) DEFAULT 0,
    expected_close_date DATE,
    address JSONB,
    notes TEXT,
    tags VARCHAR(255)[],
    created_by UUID REFERENCES users(id),
    converted_to_customer_id UUID REFERENCES customers(id),
    converted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opportunities
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    opportunity_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    lead_id UUID REFERENCES leads(id),
    stage VARCHAR(50) NOT NULL,
    probability DECIMAL(5,2) DEFAULT 0,
    expected_revenue DECIMAL(15,2) NOT NULL,
    expected_close_date DATE,
    actual_close_date DATE,
    assigned_to UUID REFERENCES employees(id),
    source VARCHAR(50),
    description TEXT,
    next_action VARCHAR(255),
    next_action_date DATE,
    status VARCHAR(20) DEFAULT 'open', -- open, won, lost, cancelled
    loss_reason TEXT,
    tags VARCHAR(255)[],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities (Calls, Meetings, Tasks)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- call, meeting, task, email
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    related_to_type VARCHAR(50), -- lead, opportunity, customer, supplier
    related_to_id UUID,
    assigned_to UUID REFERENCES employees(id),
    created_by UUID REFERENCES users(id),
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'planned', -- planned, in_progress, completed, cancelled
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    duration INTEGER, -- minutes
    location VARCHAR(255),
    attendees JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 10. Builder Module Tables

```sql
-- Custom Modules
CREATE TABLE custom_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(20),
    version VARCHAR(20) DEFAULT '1.0.0',
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
    created_by UUID REFERENCES users(id),
    published_by UUID REFERENCES users(id),
    published_at TIMESTAMP,
    schema_definition JSONB NOT NULL,
    ui_definition JSONB,
    workflow_definition JSONB,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

-- Custom Fields
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    module_id UUID REFERENCES custom_modules(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    field_name VARCHAR(100) NOT NULL, -- database column name
    field_type VARCHAR(50) NOT NULL, -- text, number, date, boolean, select, multiselect
    is_required BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    validation_rules JSONB,
    options JSONB, -- for select/multiselect fields
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom Workflows
CREATE TABLE custom_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    module_id UUID REFERENCES custom_modules(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_event VARCHAR(100) NOT NULL, -- create, update, delete, status_change
    conditions JSONB,
    actions JSONB, -- email, notification, field_update, approval
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic Data Storage (for custom modules)
CREATE TABLE dynamic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    module_id UUID REFERENCES custom_modules(id) ON DELETE CASCADE,
    record_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approval Workflows
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    conditions JSONB,
    steps JSONB NOT NULL, -- array of approval steps
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approval Requests
CREATE TABLE approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES approval_workflows(id),
    record_type VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    current_step INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    requested_by UUID REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approval Steps
CREATE TABLE approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    approval_request_id UUID REFERENCES approval_requests(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    approver_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    comments TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 11. Entity Relationship Diagram (ERD)

```
Core System:
tenants (1) ──── (M) companies ──── (M) branches
    │                   │
    │                   └── (M) users ──── (M) user_roles ──── (M) roles
    │                           │
    └── (M) audit_logs          └── (M) employees
            │
            └── (M) departments ──── (M) positions

HR Module:
employees (1) ──── (M) attendance
    │
    ├── (M) leave_requests ──── (M) leave_types
    │
    └── (M) payslips ──── (M) payroll_periods

Accounting:
companies (1) ──── (M) chart_of_accounts
    │                       │
    ├── (M) journals ────── (M) journal_entries ──── (M) journal_entry_lines
    │
    └── (M) currencies ──── (M) exchange_rates

Sales:
companies (1) ──── (M) customers ──── (M) sales_orders ──── (M) sales_order_lines
    │                   │                   │
    │                   └── (M) invoices ── (M) invoice_lines
    │                           │
    └── (M) price_lists         └── (M) payments

Purchase:
companies (1) ──── (M) suppliers ──── (M) purchase_orders ──── (M) purchase_order_lines
                        │                       │
                        └── (M) vendor_bills    └── (M) stock_movements

Inventory:
companies (1) ──── (M) products ──── (M) current_stock
    │                   │               │
    ├── (M) warehouses ─┴── (M) stock_locations
    │       │
    │       └── (M) stock_movements ──── (M) lots ──── (M) serial_numbers
    │
    └── (M) product_categories

Agriculture:
companies (1) ──── (M) farmers ──── (M) farmer_contracts ──── (M) crop_deliveries
    │                   │                                           │
    ├── (M) seasons     └── (M) agent_commissions ─────────────────┘
    │
    └── (M) employees (agents)

CRM:
companies (1) ──── (M) leads ──── (M) opportunities
    │                   │               │
    └── (M) customers   └── (M) activities

Builder:
tenants (1) ──── (M) custom_modules ──── (M) custom_fields
    │                   │                       │
    │                   ├── (M) custom_workflows
    │                   │
    │                   └── (M) dynamic_records
    │
    └── (M) approval_workflows ──── (M) approval_requests ──── (M) approval_steps
```

## 12. Database Indexes & Performance

```sql
-- Core indexes for performance
CREATE INDEX CONCURRENTLY idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX CONCURRENTLY idx_users_company_active ON users(company_id, is_active);
CREATE INDEX CONCURRENTLY idx_audit_logs_tenant_date ON audit_logs(tenant_id, created_at);
CREATE INDEX CONCURRENTLY idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Sales indexes
CREATE INDEX CONCURRENTLY idx_sales_orders_customer_date ON sales_orders(customer_id, order_date);
CREATE INDEX CONCURRENTLY idx_sales_orders_status_date ON sales_orders(status, order_date);
CREATE INDEX CONCURRENTLY idx_invoices_customer_status ON invoices(customer_id, status);
CREATE INDEX CONCURRENTLY idx_invoices_due_date ON invoices(due_date) WHERE status IN ('sent', 'overdue');

-- Inventory indexes
CREATE INDEX CONCURRENTLY idx_stock_movements_product_date ON stock_movements(product_id, movement_date);
CREATE INDEX CONCURRENTLY idx_stock_movements_location_date ON stock_movements(location_from_id, movement_date);
CREATE INDEX CONCURRENTLY idx_current_stock_product_location ON current_stock(product_id, location_id);
CREATE INDEX CONCURRENTLY idx_products_sku ON products(sku);
CREATE INDEX CONCURRENTLY idx_products_category_active ON products(category_id, is_active);

-- Agriculture indexes
CREATE INDEX CONCURRENTLY idx_farmer_contracts_farmer_season ON farmer_contracts(farmer_id, season, contract_year);
CREATE INDEX CONCURRENTLY idx_crop_deliveries_farmer_date ON crop_deliveries(farmer_id, delivery_date);
CREATE INDEX CONCURRENTLY idx_crop_deliveries_contract_date ON crop_deliveries(farmer_contract_id, delivery_date);

-- CRM indexes
CREATE INDEX CONCURRENTLY idx_leads_assigned_status ON leads(assigned_to, status);
CREATE INDEX CONCURRENTLY idx_opportunities_assigned_stage ON opportunities(assigned_to, stage);
CREATE INDEX CONCURRENTLY idx_activities_assigned_due ON activities(assigned_to, due_date);

-- Builder module indexes
CREATE INDEX CONCURRENTLY idx_dynamic_records_module ON dynamic_records(module_id);
CREATE INDEX CONCURRENTLY idx_dynamic_records_tenant_module ON dynamic_records(tenant_id, module_id);
```

This comprehensive database design provides a solid foundation for the AgriERP system with proper normalization, indexing, and support for all required modules while maintaining flexibility for customization through the Builder module.