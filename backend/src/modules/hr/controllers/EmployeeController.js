const Employee = require('../models/Employee');
const User = require('../../../models/User');
const ErrorHandler = require('../../../middleware/errorHandler');
const logger = require('../../../utils/logger');
const { validationResult } = require('express-validator');

class EmployeeController {
  // Get all employees
  static async getEmployees(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        department_id,
        position_id,
        status,
        employment_type,
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = req.query;

      const options = {
        tenantId: req.tenantId,
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy,
        orderDirection,
        filters: {
          ...(department_id && { department_id }),
          ...(position_id && { position_id }),
          ...(status && { status }),
          ...(employment_type && { employment_type })
        },
        search
      };

      const result = await Employee.findAllWithDetails(options);

      res.json({
        success: true,
        data: result.data,
        meta: {
          pagination: result.pagination,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get employee by ID
  static async getEmployee(req, res, next) {
    try {
      const { id } = req.params;
      
      const employee = await Employee.findWithUser(id, req.tenantId);
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EMPLOYEE_NOT_FOUND',
            message: 'Employee not found'
          }
        });
      }

      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new employee
  static async createEmployee(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const employeeData = req.body;
      
      // Check if employee code already exists
      const existingEmployee = await Employee.findByCode(
        employeeData.employee_code, 
        req.tenantId
      );
      
      if (existingEmployee) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMPLOYEE_CODE_EXISTS',
            message: 'Employee code already exists'
          }
        });
      }

      // Create user if user data is provided
      let userId = employeeData.user_id;
      
      if (employeeData.user && !userId) {
        const userData = {
          ...employeeData.user,
          company_id: req.company?.id
        };
        
        const user = await User.create(userData, req.tenantId);
        userId = user.id;
      }

      // Create employee
      const employee = await Employee.create({
        ...employeeData,
        user_id: userId,
        company_id: req.company?.id
      }, req.tenantId);

      // Get employee with details
      const employeeWithDetails = await Employee.findWithUser(employee.id, req.tenantId);

      logger.info('Employee created', {
        employeeId: employee.id,
        employeeCode: employee.employee_code,
        userId: req.user.id,
        tenantId: req.tenantId
      });

      res.status(201).json({
        success: true,
        data: employeeWithDetails,
        message: 'Employee created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update employee
  static async updateEmployee(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Check if employee exists
      const existingEmployee = await Employee.findById(id, req.tenantId);
      if (!existingEmployee) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EMPLOYEE_NOT_FOUND',
            message: 'Employee not found'
          }
        });
      }

      // Check if employee code is being changed and if it already exists
      if (updateData.employee_code && updateData.employee_code !== existingEmployee.employee_code) {
        const codeExists = await Employee.findByCode(updateData.employee_code, req.tenantId);
        if (codeExists) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'EMPLOYEE_CODE_EXISTS',
              message: 'Employee code already exists'
            }
          });
        }
      }

      // Update employee
      const updatedEmployee = await Employee.update(id, updateData, req.tenantId);

      // Update user data if provided
      if (updateData.user && existingEmployee.user_id) {
        await User.update(existingEmployee.user_id, updateData.user, req.tenantId);
      }

      // Get updated employee with details
      const employeeWithDetails = await Employee.findWithUser(id, req.tenantId);

      logger.info('Employee updated', {
        employeeId: id,
        userId: req.user.id,
        tenantId: req.tenantId
      });

      res.json({
        success: true,
        data: employeeWithDetails,
        message: 'Employee updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete employee
  static async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;

      // Check if employee exists
      const employee = await Employee.findById(id, req.tenantId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EMPLOYEE_NOT_FOUND',
            message: 'Employee not found'
          }
        });
      }

      // Soft delete employee
      await Employee.delete(id, req.tenantId);

      logger.info('Employee deleted', {
        employeeId: id,
        userId: req.user.id,
        tenantId: req.tenantId
      });

      res.json({
        success: true,
        message: 'Employee deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update employee status
  static async updateEmployeeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'terminated'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Invalid employee status'
          }
        });
      }

      // Check if employee exists
      const employee = await Employee.findById(id, req.tenantId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EMPLOYEE_NOT_FOUND',
            message: 'Employee not found'
          }
        });
      }

      // Update status
      await Employee.updateStatus(id, status, req.tenantId);

      // Get updated employee
      const updatedEmployee = await Employee.findWithUser(id, req.tenantId);

      logger.info('Employee status updated', {
        employeeId: id,
        oldStatus: employee.status,
        newStatus: status,
        userId: req.user.id,
        tenantId: req.tenantId
      });

      res.json({
        success: true,
        data: updatedEmployee,
        message: 'Employee status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get employee hierarchy
  static async getEmployeeHierarchy(req, res, next) {
    try {
      const { id } = req.params;

      // Check if employee exists
      const employee = await Employee.findById(id, req.tenantId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EMPLOYEE_NOT_FOUND',
            message: 'Employee not found'
          }
        });
      }

      const hierarchy = await Employee.getHierarchy(id, req.tenantId);

      res.json({
        success: true,
        data: hierarchy
      });
    } catch (error) {
      next(error);
    }
  }

  // Get employee statistics
  static async getEmployeeStatistics(req, res, next) {
    try {
      const statistics = await Employee.getStatistics(req.tenantId);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }

  // Search employees
  static async searchEmployees(req, res, next) {
    try {
      const { q: searchTerm, limit = 10 } = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'SEARCH_TERM_REQUIRED',
            message: 'Search term is required'
          }
        });
      }

      const employees = await Employee.search(searchTerm, req.tenantId, parseInt(limit));

      res.json({
        success: true,
        data: employees
      });
    } catch (error) {
      next(error);
    }
  }

  // Get employees by department
  static async getEmployeesByDepartment(req, res, next) {
    try {
      const { departmentId } = req.params;

      const employees = await Employee.findByDepartment(departmentId, req.tenantId);

      res.json({
        success: true,
        data: employees
      });
    } catch (error) {
      next(error);
    }
  }

  // Get employees by manager
  static async getEmployeesByManager(req, res, next) {
    try {
      const { managerId } = req.params;

      const employees = await Employee.findByManager(managerId, req.tenantId);

      res.json({
        success: true,
        data: employees
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk update employees
  static async bulkUpdateEmployees(req, res, next) {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_UPDATES',
            message: 'Updates array is required'
          }
        });
      }

      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          const { id, ...data } = update;
          const updatedEmployee = await Employee.update(id, data, req.tenantId);
          results.push(updatedEmployee);
        } catch (error) {
          errors.push({
            id: update.id,
            error: error.message
          });
        }
      }

      logger.info('Bulk employee update completed', {
        successful: results.length,
        failed: errors.length,
        userId: req.user.id,
        tenantId: req.tenantId
      });

      res.json({
        success: true,
        data: {
          successful: results,
          failed: errors
        },
        message: `Bulk update completed: ${results.length} successful, ${errors.length} failed`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = EmployeeController;