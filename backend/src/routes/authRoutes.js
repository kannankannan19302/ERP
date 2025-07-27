const express = require('express');
const router = express.Router();
const authModule = require('../modules/auth');
const AuditMiddleware = require('../middleware/audit');
const ErrorHandler = require('../middleware/errorHandler');

// Use the auth module routes with audit middleware
router.post('/login', 
  AuditMiddleware.auditAuth('LOGIN'),
  authModule.validator.validateLogin,
  ErrorHandler.asyncHandler(authModule.controller.login)
);

router.post('/register',
  AuditMiddleware.auditAuth('REGISTER'),
  authModule.validator.validateRegistration,
  ErrorHandler.asyncHandler(authModule.controller.register)
);

router.post('/logout',
  AuditMiddleware.auditAuth('LOGOUT'),
  authModule.validator.validateLogout,
  ErrorHandler.asyncHandler(authModule.controller.logout)
);

router.post('/refresh',
  authModule.validator.validateRefreshToken,
  ErrorHandler.asyncHandler(authModule.controller.refreshToken)
);

router.post('/forgot-password',
  authModule.validator.validateForgotPassword,
  ErrorHandler.asyncHandler(authModule.controller.forgotPassword)
);

router.post('/reset-password',
  authModule.validator.validateResetPassword,
  ErrorHandler.asyncHandler(authModule.controller.resetPassword)
);

router.get('/verify-email/:token',
  ErrorHandler.asyncHandler(authModule.controller.verifyEmail)
);

// Protected routes
router.get('/profile',
  require('../middleware/auth'),
  ErrorHandler.asyncHandler(authModule.controller.getProfile)
);

router.put('/profile',
  require('../middleware/auth'),
  authModule.validator.validateUpdateProfile,
  ErrorHandler.asyncHandler(authModule.controller.updateProfile)
);

router.post('/change-password',
  require('../middleware/auth'),
  authModule.validator.validateChangePassword,
  ErrorHandler.asyncHandler(authModule.controller.changePassword)
);

module.exports = router;