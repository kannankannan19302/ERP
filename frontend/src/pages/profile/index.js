import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  TextField, 
  Button, 
  Divider, 
  Alert, 
  CircularProgress,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';
import { Save, Lock } from '@mui/icons-material';

/**
 * Tab panel component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Tab panel
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * User profile page component
 * @returns {JSX.Element} User profile page
 */
const ProfilePage = () => {
  const { user, updateProfile, changePassword, loading } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  
  // Load user data into form
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      });
    }
  }, [user]);
  
  /**
   * Handle tab change
   * @param {Event} event - Tab change event
   * @param {number} newValue - New tab index
   */
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  /**
   * Handle profile form input change
   * @param {Event} e - Input change event
   */
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  /**
   * Handle password form input change
   * @param {Event} e - Input change event
   */
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  /**
   * Handle profile form submission
   * @param {Event} e - Form submit event
   */
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    setIsProfileSubmitting(true);
    setProfileSuccess(false);
    setProfileError('');
    
    try {
      const result = await updateProfile(profileData);
      
      if (result.success) {
        setProfileSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => {
          setProfileSuccess(false);
        }, 3000);
      } else {
        setProfileError(result.error?.message || 'Failed to update profile');
      }
    } catch (err) {
      setProfileError('An unexpected error occurred. Please try again.');
      console.error('Update profile error:', err);
    } finally {
      setIsProfileSubmitting(false);
    }
  };
  
  /**
   * Handle password form submission
   * @param {Event} e - Form submit event
   */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    
    setIsPasswordSubmitting(true);
    setPasswordSuccess(false);
    setPasswordError('');
    
    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (result.success) {
        setPasswordSuccess(true);
        // Clear form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        // Clear success message after 3 seconds
        setTimeout(() => {
          setPasswordSuccess(false);
        }, 3000);
      } else {
        setPasswordError(result.error?.message || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError('An unexpected error occurred. Please try again.');
      console.error('Change password error:', err);
    } finally {
      setIsPasswordSubmitting(false);
    }
  };
  
  // Generate avatar text from user name
  const getAvatarText = () => {
    if (!user) return '?';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  };
  
  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'primary.main',
                fontSize: '2rem',
                mr: 3
              }}
            >
              {getAvatarText()}
            </Avatar>
            
            <Box>
              <Typography variant="h4" gutterBottom>
                {user ? `${user.firstName} ${user.lastName}` : 'User Profile'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
              <Tab label="Profile Information" id="profile-tab-0" />
              <Tab label="Change Password" id="profile-tab-1" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            {profileSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Profile updated successfully!
              </Alert>
            )}
            
            {profileError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {profileError}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleProfileSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    disabled={isProfileSubmitting}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    disabled={isProfileSubmitting}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="phone"
                    label="Phone Number"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    disabled={isProfileSubmitting}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={isProfileSubmitting ? <CircularProgress size={20} /> : <Save />}
                    disabled={isProfileSubmitting}
                  >
                    Save Changes
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Password changed successfully!
              </Alert>
            )}
            
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handlePasswordSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    type="password"
                    id="currentPassword"
                    label="Current Password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    disabled={isPasswordSubmitting}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    type="password"
                    id="newPassword"
                    label="New Password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    disabled={isPasswordSubmitting}
                    helperText="Password must be at least 8 characters long"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    type="password"
                    id="confirmPassword"
                    label="Confirm New Password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    disabled={isPasswordSubmitting}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={isPasswordSubmitting ? <CircularProgress size={20} /> : <Lock />}
                    disabled={isPasswordSubmitting}
                  >
                    Change Password
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        </Paper>
      </Container>
    </ProtectedRoute>
  );
};

export default ProfilePage;