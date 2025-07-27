import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Box, 
  Container, 
  Alert, 
  CircularProgress 
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

/**
 * Reset password page component
 * @returns {JSX.Element} Reset password page
 */
const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const { resetPassword, error } = useAuth();
  const router = useRouter();
  
  // Extract token from URL query parameters
  useEffect(() => {
    if (router.isReady) {
      const { token } = router.query;
      if (token) {
        setToken(token);
      } else {
        setFormError('Invalid or missing reset token');
      }
    }
  }, [router.isReady, router.query]);
  
  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!password || !confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }
    
    if (!token) {
      setFormError('Invalid or missing reset token');
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');
    
    try {
      const result = await resetPassword(token, password);
      
      if (result.success) {
        setResetSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setFormError(result.error?.message || 'Failed to reset password');
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
      console.error('Reset password error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: '50%',
              padding: 1,
              marginBottom: 2,
            }}
          >
            <LockOutlined />
          </Box>
          
          <Typography component="h1" variant="h5" gutterBottom>
            Reset Your Password
          </Typography>
          
          {resetSuccess ? (
            <Alert severity="success" sx={{ width: '100%', marginY: 2 }}>
              Password reset successful! You will be redirected to the login page.
            </Alert>
          ) : (
            <>
              {(formError || error) && (
                <Alert severity="error" sx={{ width: '100%', marginBottom: 2 }}>
                  {formError || error}
                </Alert>
              )}
              
              <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="New Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  helperText="Password must be at least 8 characters long"
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isSubmitting || !token}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Reset Password'}
                </Button>
                
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link href="/auth/login" passHref>
                    <Typography variant="body2" component="a" sx={{ cursor: 'pointer' }}>
                      Back to Sign In
                    </Typography>
                  </Link>
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Box>
      
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} AgriERP. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
};

export default ResetPasswordPage;