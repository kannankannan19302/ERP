import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../../../src/contexts/AuthContext';
import authService from '../../../src/services/authService';

// Mock dependencies
jest.mock('../../../src/services/authService');
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Test component that uses AuthContext
const TestComponent = () => {
  const { user, login, logout, isAuthenticated } = React.useContext(AuthContext);
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>
      {user && (
        <div data-testid="user-info">
          {user.firstName} {user.lastName}
        </div>
      )}
      <button 
        data-testid="login-button" 
        onClick={() => login('test@example.com', 'password123')}
      >
        Login
      </button>
      <button 
        data-testid="logout-button" 
        onClick={logout}
      >
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should provide authentication context to children', () => {
    // Arrange & Act
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Assert
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
  });
  
  it('should update context when user logs in', async () => {
    // Arrange
    authService.login.mockResolvedValue({
      success: true,
      data: {
        user: {
          id: 'user-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com'
        }
      }
    });
    
    // Act
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Assert
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123', null);
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe');
    });
  });
  
  it('should update context when user logs out', async () => {
    // Arrange
    authService.isAuthenticated.mockReturnValue(true);
    authService.getProfile.mockResolvedValue({
      success: true,
      data: {
        id: 'user-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com'
      }
    });
    authService.logout.mockResolvedValue({ success: true });
    
    // Act
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for user profile to load
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    fireEvent.click(screen.getByTestId('logout-button'));
    
    // Assert
    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
  });
  
  it('should handle login failure', async () => {
    // Arrange
    authService.login.mockResolvedValue({
      success: false,
      error: {
        message: 'Invalid credentials'
      }
    });
    
    // Act
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Assert
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123', null);
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
  });
});