const express = require('express');
const router = express.Router();

// Import module routes
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const hrRoutes = require('../modules/hr/routes');
// const salesRoutes = require('../modules/sales/routes');
// const purchaseRoutes = require('../modules/purchase/routes');
// const inventoryRoutes = require('../modules/inventory/routes');
// const accountingRoutes = require('../modules/accounting/routes');
// const crmRoutes = require('../modules/crm/routes');
// const agricultureRoutes = require('../modules/agriculture/routes');
// const builderRoutes = require('../modules/builder/routes');

// API version and health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'AgriERP API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    },
    message: 'AgriERP API is running successfully'
  });
});

// Authentication routes
router.use('/auth', authRoutes);

// User management routes
router.use('/users', userRoutes);

// HR module routes
router.use('/hr', hrRoutes);

// Sales module routes
// router.use('/sales', salesRoutes);

// Purchase module routes
// router.use('/purchase', purchaseRoutes);

// Inventory module routes
// router.use('/inventory', inventoryRoutes);

// Accounting module routes
// router.use('/accounting', accountingRoutes);

// CRM module routes
// router.use('/crm', crmRoutes);

// Agriculture module routes
// router.use('/agriculture', agricultureRoutes);

// Builder module routes
// router.use('/builder', builderRoutes);

module.exports = router;