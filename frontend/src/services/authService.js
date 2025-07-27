import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

/**
 * Authentication service for handling user authentication
 */
class AuthService {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} tenant - Optional tenant subdomain
   * @returns {Promise} Promise with user data and tokens
   */
  async login(email, password, tenant = null) {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
      tenant
    });
    
    if (response.data.success) {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
      
      // Set default Authorization header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.tokens.accessToken}`;
    }
    
    return response.data;
  }
  
  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Promise with registration result
   */
  async register(userData) {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  }
  
  /**
   * Logout user
   * @returns {Promise} Promise with logout result
   */
  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    try {
      // Call logout API
      await axios.post(`${API_URL}/auth/logout`, { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and headers regardless of API success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete axios.defaults.headers.common['Authorization'];
    }
    
    return { success: true, message: 'Logged out successfully' };
  }
  
  /**
   * Refresh access token using refresh token
   * @returns {Promise} Promise with new access token
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      
      if (response.data.success) {
        // Update access token in localStorage
        localStorage.setItem('accessToken', response.data.data.accessToken);
        
        // Update Authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.accessToken}`;
        
        return response.data;
      }
    } catch (error) {
      // If refresh token is invalid, logout user
      this.logout();
      throw error;
    }
  }
  
  /**
   * Request password reset
   * @param {string} email - User email
   * @param {string} tenant - Optional tenant subdomain
   * @returns {Promise} Promise with reset request result
   */
  async forgotPassword(email, tenant = null) {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, {
      email,
      tenant
    });
    return response.data;
  }
  
  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise} Promise with reset result
   */
  async resetPassword(token, password) {
    const response = await axios.post(`${API_URL}/auth/reset-password`, {
      token,
      password
    });
    return response.data;
  }
  
  /**
   * Get current user profile
   * @returns {Promise} Promise with user profile data
   */
  async getProfile() {
    const response = await axios.get(`${API_URL}/auth/profile`);
    return response.data;
  }
  
  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Promise with updated profile data
   */
  async updateProfile(profileData) {
    const response = await axios.put(`${API_URL}/auth/profile`, profileData);
    return response.data;
  }
  
  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} Promise with change password result
   */
  async changePassword(currentPassword, newPassword) {
    const response = await axios.post(`${API_URL}/auth/change-password`, {
      currentPassword,
      newPassword
    });
    return response.data;
  }
  
  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }
  
  /**
   * Get current access token
   * @returns {string|null} Access token or null
   */
  getAccessToken() {
    return localStorage.getItem('accessToken');
  }
  
  /**
   * Setup axios interceptors for token refresh
   */
  setupInterceptors() {
    // Response interceptor for handling token expiration
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 Unauthorized and not a retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            await this.refreshToken();
            
            // Update the authorization header
            originalRequest.headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
            
            // Retry the original request
            return axios(originalRequest);
          } catch (refreshError) {
            // If refresh fails, redirect to login
            this.logout();
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
}

// Create and export a singleton instance
const authService = new AuthService();
authService.setupInterceptors();

export default authService;