const { body, param, query } = require('express-validator');

class EmployeeValidator {
  // Validation rules for creating employee
  static createEmployee() {
    return [
      body('employee_code')
        .notEmpty()
        .withMessage('Employee code is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Employee code must be between 3 and 50 characters')
        .matches(/^[A-Z0-9-_]+$/)
        .withMessage('Employee code can only contain uppercase letters, numbers, hyphens, and underscores'),

      body('department_id')
        .optional()
        .isUUID()
        .withMessage('Department ID must be a valid UUID'),

      body('position_id')
        .optional()
        .isUUID()
        .withMessage('Position ID must be a valid UUID'),

      body('manager_id')
        .optional()
        .isUUID()
        .withMessage('Manager ID must be a valid UUID'),

      body('branch_id')
        .optional()
        .isUUID()
        .withMessage('Branch ID must be a valid UUID'),

      body('hire_date')
        .notEmpty()
        .withMessage('Hire date is required')
        .isISO8601()
        .withMessage('Hire date must be a valid date'),

      body('employment_type')
        .notEmpty()
        .withMessage('Employment type is required')
        .isIn(['full-time', 'part-time', 'contract', 'intern', 'temporary'])
        .withMessage('Invalid employment type'),

      body('status')
        .optional()
        .isIn(['active', 'inactive', 'terminated'])
        .withMessage('Invalid status'),

      // User data validation (if creating user along with employee)
      body('user.first_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('First name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),

      body('user.last_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Last name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),

      body('user.email')
        .optional()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),

      body('user.phone')
        .optional()
        .isMobilePhone()
        .withMessage('Valid phone number is required'),

      body('user.password')
        .optional()
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

      // Personal info validation
      body('personal_info.date_of_birth')
        .optional()
        .isISO8601()
        .withMessage('Date of birth must be a valid date'),

      body('personal_info.gender')
        .optional()
        .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
        .withMessage('Invalid gender'),

      body('personal_info.marital_status')
        .optional()
        .isIn(['single', 'married', 'divorced', 'widowed'])
        .withMessage('Invalid marital status'),

      body('personal_info.nationality')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nationality must be between 2 and 100 characters'),

      // Bank details validation
      body('bank_details.account_number')
        .optional()
        .isLength({ min: 8, max: 20 })
        .withMessage('Account number must be between 8 and 20 characters')
        .isNumeric()
        .withMessage('Account number must contain only numbers'),

      body('bank_details.routing_number')
        .optional()
        .isLength({ min: 9, max: 9 })
        .withMessage('Routing number must be exactly 9 characters')
        .isNumeric()
        .withMessage('Routing number must contain only numbers'),

      body('bank_details.bank_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Bank name must be between 2 and 100 characters')
    ];
  }

  // Validation rules for updating employee
  static updateEmployee() {
    return [
      param('id')
        .isUUID()
        .withMessage('Employee ID must be a valid UUID'),

      body('employee_code')
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage('Employee code must be between 3 and 50 characters')
        .matches(/^[A-Z0-9-_]+$/)
        .withMessage('Employee code can only contain uppercase letters, numbers, hyphens, and underscores'),

      body('department_id')
        .optional()
        .isUUID()
        .withMessage('Department ID must be a valid UUID'),

      body('position_id')
        .optional()
        .isUUID()
        .withMessage('Position ID must be a valid UUID'),

      body('manager_id')
        .optional()
        .isUUID()
        .withMessage('Manager ID must be a valid UUID'),

      body('branch_id')
        .optional()
        .isUUID()
        .withMessage('Branch ID must be a valid UUID'),

      body('hire_date')
        .optional()
        .isISO8601()
        .withMessage('Hire date must be a valid date'),

      body('employment_type')
        .optional()
        .isIn(['full-time', 'part-time', 'contract', 'intern', 'temporary'])
        .withMessage('Invalid employment type'),

      body('status')
        .optional()
        .isIn(['active', 'inactive', 'terminated'])
        .withMessage('Invalid status'),

      // User data validation
      body('user.first_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('First name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),

      body('user.last_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Last name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),

      body('user.email')
        .optional()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),

      body('user.phone')
        .optional()
        .isMobilePhone()
        .withMessage('Valid phone number is required')
    ];
  }

  // Validation rules for updating employee status
  static updateEmployeeStatus() {
    return [
      param('id')
        .isUUID()
        .withMessage('Employee ID must be a valid UUID'),

      body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['active', 'inactive', 'terminated'])
        .withMessage('Invalid status')
    ];
  }

  // Validation rules for getting employee by ID
  static getEmployee() {
    return [
      param('id')
        .isUUID()
        .withMessage('Employee ID must be a valid UUID')
    ];
  }

  // Validation rules for getting employees list
  static getEmployees() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

      query('orderBy')
        .optional()
        .isIn(['created_at', 'updated_at', 'hire_date', 'employee_code', 'first_name', 'last_name'])
        .withMessage('Invalid orderBy field'),

      query('orderDirection')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Order direction must be asc or desc'),

      query('department_id')
        .optional()
        .isUUID()
        .withMessage('Department ID must be a valid UUID'),

      query('position_id')
        .optional()
        .isUUID()
        .withMessage('Position ID must be a valid UUID'),

      query('status')
        .optional()
        .isIn(['active', 'inactive', 'terminated'])
        .withMessage('Invalid status'),

      query('employment_type')
        .optional()
        .isIn(['full-time', 'part-time', 'contract', 'intern', 'temporary'])
        .withMessage('Invalid employment type'),

      query('search')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Search term must be between 2 and 100 characters')
    ];
  }

  // Validation rules for searching employees
  static searchEmployees() {
    return [
      query('q')
        .notEmpty()
        .withMessage('Search term is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Search term must be between 2 and 100 characters'),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
    ];
  }

  // Validation rules for getting employees by department
  static getEmployeesByDepartment() {
    return [
      param('departmentId')
        .isUUID()
        .withMessage('Department ID must be a valid UUID')
    ];
  }

  // Validation rules for getting employees by manager
  static getEmployeesByManager() {
    return [
      param('managerId')
        .isUUID()
        .withMessage('Manager ID must be a valid UUID')
    ];
  }

  // Validation rules for bulk update
  static bulkUpdateEmployees() {
    return [
      body('updates')
        .isArray({ min: 1, max: 100 })
        .withMessage('Updates must be an array with 1-100 items'),

      body('updates.*.id')
        .isUUID()
        .withMessage('Each update must have a valid UUID'),

      body('updates.*.employee_code')
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage('Employee code must be between 3 and 50 characters'),

      body('updates.*.status')
        .optional()
        .isIn(['active', 'inactive', 'terminated'])
        .withMessage('Invalid status'),

      body('updates.*.employment_type')
        .optional()
        .isIn(['full-time', 'part-time', 'contract', 'intern', 'temporary'])
        .withMessage('Invalid employment type')
    ];
  }

  // Custom validation for employee code uniqueness
  static async validateEmployeeCodeUnique(employeeCode, tenantId, excludeId = null) {
    const Employee = require('../models/Employee');
    
    const existing = await Employee.query(tenantId)
      .where('employee_code', employeeCode)
      .modify(query => {
        if (excludeId) {
          query.where('id', '!=', excludeId);
        }
      })
      .first();

    return !existing;
  }

  // Custom validation for manager hierarchy (prevent circular references)
  static async validateManagerHierarchy(employeeId, managerId, tenantId) {
    if (!managerId || employeeId === managerId) {
      return false;
    }

    const Employee = require('../models/Employee');
    
    // Check if the proposed manager is a subordinate of the employee
    let currentManagerId = managerId;
    const visited = new Set();

    while (currentManagerId && !visited.has(currentManagerId)) {
      visited.add(currentManagerId);
      
      const manager = await Employee.findById(currentManagerId, tenantId);
      if (!manager) break;

      if (manager.manager_id === employeeId) {
        return false; // Circular reference detected
      }

      currentManagerId = manager.manager_id;
    }

    return true;
  }

  // Custom validation for department and position compatibility
  static async validateDepartmentPosition(departmentId, positionId, tenantId) {
    if (!departmentId || !positionId) {
      return true; // Skip validation if either is not provided
    }

    // This would check if the position belongs to the department
    // Implementation depends on your business logic
    return true;
  }
}

module.exports = EmployeeValidator;