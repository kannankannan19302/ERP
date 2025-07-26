const express = require('express');
const router = express.Router();

const EmployeeController = require('../controllers/EmployeeController');
const EmployeeValidator = require('../validators/employeeValidator');
const AuthMiddleware = require('../../../middleware/auth');
const AuditMiddleware = require('../../../middleware/audit');
const ErrorHandler = require('../../../middleware/errorHandler');

// Apply authentication to all routes
router.use(AuthMiddleware.authenticate);

// Get employees list
router.get('/',
  EmployeeValidator.getEmployees(),
  AuthMiddleware.requirePermission('hr.employees.read'),
  ErrorHandler.asyncHandler(EmployeeController.getEmployees)
);

// Search employees
router.get('/search',
  EmployeeValidator.searchEmployees(),
  AuthMiddleware.requirePermission('hr.employees.read'),
  ErrorHandler.asyncHandler(EmployeeController.searchEmployees)
);

// Get employee statistics
router.get('/statistics',
  AuthMiddleware.requirePermission('hr.employees.read'),
  ErrorHandler.asyncHandler(EmployeeController.getEmployeeStatistics)
);

// Get employees by department
router.get('/department/:departmentId',
  EmployeeValidator.getEmployeesByDepartment(),
  AuthMiddleware.requirePermission('hr.employees.read'),
  ErrorHandler.asyncHandler(EmployeeController.getEmployeesByDepartment)
);

// Get employees by manager
router.get('/manager/:managerId',
  EmployeeValidator.getEmployeesByManager(),
  AuthMiddleware.requirePermission('hr.employees.read'),
  ErrorHandler.asyncHandler(EmployeeController.getEmployeesByManager)
);

// Get employee by ID
router.get('/:id',
  EmployeeValidator.getEmployee(),
  AuthMiddleware.requirePermission('hr.employees.read'),
  ErrorHandler.asyncHandler(EmployeeController.getEmployee)
);

// Get employee hierarchy
router.get('/:id/hierarchy',
  EmployeeValidator.getEmployee(),
  AuthMiddleware.requirePermission('hr.employees.read'),
  ErrorHandler.asyncHandler(EmployeeController.getEmployeeHierarchy)
);

// Create new employee
router.post('/',
  EmployeeValidator.createEmployee(),
  AuthMiddleware.requirePermission('hr.employees.create'),
  AuditMiddleware.auditDataChange('CREATE'),
  ErrorHandler.asyncHandler(EmployeeController.createEmployee)
);

// Bulk update employees
router.patch('/bulk',
  EmployeeValidator.bulkUpdateEmployees(),
  AuthMiddleware.requirePermission('hr.employees.update'),
  AuditMiddleware.auditDataChange('BULK_UPDATE'),
  ErrorHandler.asyncHandler(EmployeeController.bulkUpdateEmployees)
);

// Update employee
router.put('/:id',
  EmployeeValidator.updateEmployee(),
  AuthMiddleware.requirePermission('hr.employees.update'),
  AuditMiddleware.auditDataChange('UPDATE'),
  ErrorHandler.asyncHandler(EmployeeController.updateEmployee)
);

// Update employee status
router.patch('/:id/status',
  EmployeeValidator.updateEmployeeStatus(),
  AuthMiddleware.requirePermission('hr.employees.update'),
  AuditMiddleware.auditDataChange('STATUS_UPDATE'),
  ErrorHandler.asyncHandler(EmployeeController.updateEmployeeStatus)
);

// Delete employee
router.delete('/:id',
  EmployeeValidator.getEmployee(),
  AuthMiddleware.requirePermission('hr.employees.delete'),
  AuditMiddleware.auditDataChange('DELETE'),
  ErrorHandler.asyncHandler(EmployeeController.deleteEmployee)
);

module.exports = router;