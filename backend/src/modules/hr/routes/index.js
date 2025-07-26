const express = require('express');
const router = express.Router();

// Import HR sub-module routes
const employeeRoutes = require('./employeeRoutes');
// const departmentRoutes = require('./departmentRoutes');
// const positionRoutes = require('./positionRoutes');
// const attendanceRoutes = require('./attendanceRoutes');
// const leaveRoutes = require('./leaveRoutes');
// const payrollRoutes = require('./payrollRoutes');

// HR module info
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      module: 'Human Resources',
      version: '1.0.0',
      description: 'Complete HR management system',
      features: [
        'Employee Management',
        'Department Management',
        'Position Management',
        'Attendance Tracking',
        'Leave Management',
        'Payroll Processing'
      ]
    }
  });
});

// Employee management routes
router.use('/employees', employeeRoutes);

// Department management routes
// router.use('/departments', departmentRoutes);

// Position management routes
// router.use('/positions', positionRoutes);

// Attendance management routes
// router.use('/attendance', attendanceRoutes);

// Leave management routes
// router.use('/leaves', leaveRoutes);

// Payroll management routes
// router.use('/payroll', payrollRoutes);

module.exports = router;