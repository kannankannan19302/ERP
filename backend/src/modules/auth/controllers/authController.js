const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../../../models/User');
const logger = require('../../../utils/logger');
const redis = require('../../../config/redis');

/**
 * User login controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, tenant } = req.body;

    // Find user by email
    const user = await User.query()
      .where('email', email)
      .withGraphFetched('roles.permissions')
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account is inactive. Please contact an administrator.'
        }
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in Redis with user ID as key
    await redis.set(
      `refresh_token:${refreshToken}`,
      user.id,
      'EX',
      parseInt(process.env.JWT_REFRESH_EXPIRES_IN_SECONDS || 604800) // 7 days default
    );

    // Update last login timestamp
    await User.query()
      .patch({ lastLoginAt: new Date() })
      .where('id', user.id);

    // Extract permissions from roles
    const permissions = extractPermissionsFromRoles(user.roles);

    // Return user data and tokens
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles.map(role => role.name)
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: parseInt(process.env.JWT_EXPIRES_IN_SECONDS || 3600) // 1 hour default
        },
        permissions
      },
      message: 'Login successful'
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

/**
 * User registration controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, tenantId, companyId } = req.body;

    // Check if user already exists
    const existingUser = await User.query().where('email', email).first();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'A user with this email already exists'
        }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.query().insert({
      email,
      passwordHash,
      firstName,
      lastName,
      tenantId,
      companyId,
      isActive: true,
      emailVerifiedAt: null
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Store verification token in Redis
    await redis.set(
      `email_verification:${verificationToken}`,
      newUser.id,
      'EX',
      86400 // 24 hours
    );

    // TODO: Send verification email

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      },
      message: 'User registered successfully. Please verify your email.'
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

/**
 * Token refresh controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token is required'
        }
      });
    }

    // Verify refresh token exists in Redis
    const userId = await redis.get(`refresh_token:${refreshToken}`);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    }

    // Verify JWT token
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      // Delete invalid token from Redis
      await redis.del(`refresh_token:${refreshToken}`);
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    }

    // Get user data
    const user = await User.query()
      .findById(userId)
      .withGraphFetched('roles.permissions');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive or not found'
        }
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      data: {
        accessToken,
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN_SECONDS || 3600) // 1 hour default
      },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    next(error);
  }
};

/**
 * User logout controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete refresh token from Redis
      await redis.del(`refresh_token:${refreshToken}`);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

/**
 * Forgot password controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.query().where('email', email).first();
    
    // Always return success even if user not found (security best practice)
    if (!user) {
      return res.json({
        success: true,
        message: 'Password reset email sent if the email exists in our system'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store reset token in Redis with expiration
    await redis.set(
      `password_reset:${resetToken}`,
      user.id,
      'EX',
      3600 // 1 hour
    );

    // TODO: Send password reset email

    res.json({
      success: true,
      message: 'Password reset email sent if the email exists in our system'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    next(error);
  }
};

/**
 * Reset password controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Verify token exists in Redis
    const userId = await redis.get(`password_reset:${token}`);
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token'
        }
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password
    await User.query()
      .patch({ passwordHash })
      .where('id', userId);

    // Delete used token
    await redis.del(`password_reset:${token}`);

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    next(error);
  }
};

/**
 * Verify email controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Verify token exists in Redis
    const userId = await redis.get(`email_verification:${token}`);
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token'
        }
      });
    }

    // Update user email verification status
    await User.query()
      .patch({ emailVerifiedAt: new Date() })
      .where('id', userId);

    // Delete used token
    await redis.del(`email_verification:${token}`);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    next(error);
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.query()
      .findById(userId)
      .withGraphFetched('[roles.permissions, company]');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Extract permissions from roles
    const permissions = extractPermissionsFromRoles(user.roles);

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        company: user.company ? {
          id: user.company.id,
          name: user.company.name
        } : null,
        roles: user.roles.map(role => ({
          id: role.id,
          name: role.name
        })),
        permissions,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    next(error);
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone } = req.body;

    const updatedUser = await User.query()
      .patchAndFetchById(userId, {
        firstName,
        lastName,
        phone
      });

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

/**
 * Change password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get user with password hash
    const user = await User.query().findById(userId);

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect'
        }
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.query()
      .patch({ passwordHash })
      .where('id', userId);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
};

/**
 * Generate JWT access token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      companyId: user.companyId,
      roles: user.roles.map(role => role.name)
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    }
  );
};

/**
 * Generate JWT refresh token
 * @param {Object} user - User object
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      tokenType: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    }
  );
};

/**
 * Extract permissions from user roles
 * @param {Array} roles - User roles with permissions
 * @returns {Array} Array of permission strings
 */
const extractPermissionsFromRoles = (roles) => {
  const permissionSet = new Set();
  
  roles.forEach(role => {
    if (role.permissions && Array.isArray(role.permissions)) {
      role.permissions.forEach(permission => {
        permissionSet.add(`${permission.resource}.${permission.action}`);
      });
    }
  });
  
  return Array.from(permissionSet);
};