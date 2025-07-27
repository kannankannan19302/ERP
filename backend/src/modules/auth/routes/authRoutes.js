const express = require('express');
const authController = require('../controllers/authController');
const authValidator = require('../validators/authValidator');
const authMiddleware = require('../../../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/v1/auth/login
 * @desc User login
 * @access Public
 */
router.post('/login', authValidator.validateLogin, authController.login);

/**
 * @route POST /api/v1/auth/register
 * @desc User registration
 * @access Public
 */
router.post('/register', authValidator.validateRegistration, authController.register);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', authValidator.validateRefreshToken, authController.refreshToken);

/**
 * @route POST /api/v1/auth/logout
 * @desc User logout
 * @access Public
 */
router.post('/logout', authValidator.validateLogout, authController.logout);

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', authValidator.validateForgotPassword, authController.forgotPassword);

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', authValidator.validateResetPassword, authController.resetPassword);

/**
 * @route GET /api/v1/auth/verify-email/:token
 * @desc Verify email with token
 * @access Public
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @route GET /api/v1/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authMiddleware, authController.getProfile);

/**
 * @route PUT /api/v1/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authMiddleware, authValidator.validateUpdateProfile, authController.updateProfile);

/**
 * @route POST /api/v1/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', authMiddleware, authValidator.validateChangePassword, authController.changePassword);

module.exports = router;