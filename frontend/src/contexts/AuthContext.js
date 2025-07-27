import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { useRouter } from 'next/router';

// Create the auth context
export const AuthContext = createContext();

/**
 * Auth context provider component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Auth context provider
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Load user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        if (authService.isAuthenticated()) {
          setLoading(true);
          const response = await authService.getProfile();
          if (response.success) {
            setUser(response.data);
          }
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setError('Failed to load user profile');
        // If token is invalid, logout
        if (err.response?.status === 401) {
          await authService.logout();
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} tenant - Optional tenant subdomain
   * @returns {Promise} Login result
   */
  const login = useCallback(async (email, password, tenant = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(email, password, tenant);
      if (response.success) {
        setUser(response.data.user);
        return { success: true };
      } else {
        setError(response.error?.message || 'Login failed');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Registration result
   */
  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      return { success: response.success, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout user
   * @returns {Promise} Logout result
   */
  const logout = useCallback(async () => {
    setLoading(true);
    
    try {
      await authService.logout();
      setUser(null);
      router.push('/auth/login');
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [router]);

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Update result
   */
  const updateProfile = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        setUser(prevUser => ({
          ...prevUser,
          ...response.data
        }));
        return { success: true, data: response.data };
      } else {
        setError(response.error?.message || 'Failed to update profile');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to update profile';
      setError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} Change password result
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      return { success: response.success };
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to change password';
      setError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Request password reset
   * @param {string} email - User email
   * @param {string} tenant - Optional tenant subdomain
   * @returns {Promise} Password reset request result
   */
  const forgotPassword = useCallback(async (email, tenant = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.forgotPassword(email, tenant);
      return { success: response.success };
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to request password reset';
      setError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise} Password reset result
   */
  const resetPassword = useCallback(async (token, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.resetPassword(token, password);
      return { success: response.success };
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to reset password';
      setError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  }, []);

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use the auth context
 * @returns {Object} Auth context
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};