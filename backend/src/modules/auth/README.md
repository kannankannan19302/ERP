# Authentication Module

This module handles user authentication and authorization for the AgriERP system.

## Features

- JWT-based authentication
- User registration and login
- Password reset functionality
- Email verification
- Role-based access control
- Token refresh mechanism
- User profile management

## API Endpoints

### Public Endpoints

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `GET /api/v1/auth/verify-email/:token` - Verify email with token

### Protected Endpoints

- `GET /api/v1/auth/profile` - Get current user profile
- `PUT /api/v1/auth/profile` - Update user profile
- `POST /api/v1/auth/change-password` - Change user password

## Implementation Details

### Backend

- JWT tokens for authentication
- Redis for token storage and blacklisting
- Bcrypt for password hashing
- Express-validator for request validation
- Audit logging for authentication events

### Frontend

- React context for authentication state management
- Protected routes with authentication checks
- Axios interceptors for token refresh
- Form validation with error handling
- Responsive UI with Material-UI components

## Testing

- Unit tests for controllers and validators
- Integration tests for API endpoints
- Frontend component tests

## Security Considerations

- Password hashing with bcrypt
- JWT token expiration and refresh mechanism
- CSRF protection
- Rate limiting for authentication endpoints
- Secure password reset flow
- Input validation and sanitization