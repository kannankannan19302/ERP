const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('../../../src/modules/auth/controllers/authController');
const User = require('../../../src/models/User');
const redis = require('../../../src/config/redis');

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../src/models/User');
jest.mock('../../../src/config/redis');
jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn()
}));

describe('Auth Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request, response, and next function
    req = {
      body: {},
      user: { id: 'user-id' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Mock environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.JWT_EXPIRES_IN_SECONDS = '3600';
    process.env.JWT_REFRESH_EXPIRES_IN_SECONDS = '604800';
  });

  describe('login', () => {
    it('should return 401 if user not found', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      User.query.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        withGraphFetched: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      });
      
      // Act
      await authController.login(req, res, next);
      
      // Assert
      expect(User.query).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    });
    
    it('should return 401 if user is inactive', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        isActive: false,
        roles: []
      };
      
      User.query.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        withGraphFetched: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser)
      });
      
      // Act
      await authController.login(req, res, next);
      
      // Assert
      expect(User.query).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account is inactive. Please contact an administrator.'
        }
      });
    });
    
    it('should return 401 if password is invalid', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        roles: []
      };
      
      User.query.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        withGraphFetched: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser)
      });
      
      bcrypt.compare.mockResolvedValue(false);
      
      // Act
      await authController.login(req, res, next);
      
      // Assert
      expect(User.query).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    });
    
    it('should return tokens and user data on successful login', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed-password',
        isActive: true,
        roles: [
          {
            name: 'admin',
            permissions: [
              { resource: 'users', action: 'read' },
              { resource: 'users', action: 'write' }
            ]
          }
        ]
      };
      
      User.query.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        withGraphFetched: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser),
        patch: jest.fn().mockReturnThis()
      });
      
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      redis.set.mockResolvedValue('OK');
      
      // Act
      await authController.login(req, res, next);
      
      // Assert
      expect(User.query).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(redis.set).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: 'user-id',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            roles: ['admin']
          },
          tokens: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresIn: 3600
          },
          permissions: ['users.read', 'users.write']
        },
        message: 'Login successful'
      });
    });
    
    it('should call next with error on exception', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const error = new Error('Database error');
      User.query.mockImplementation(() => {
        throw error;
      });
      
      // Act
      await authController.login(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // Additional tests for other controller methods would follow the same pattern
});