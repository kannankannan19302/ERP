import React, { useState } from 'react';
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
import { LockResetOutlined } from '@mui/icons-material';

/**
 * Forgot password page component
 * @returns {JSX.Element} Forgot password page
 */
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [tenant, setTenant] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  
  const { forgotPassword, error } = useAuth();
  
  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!email) {
      setFormError('Email is required');
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');
    
    try {
      const result = await forgotPassword(email, tenant || null);
      
      if (result.success) {
        setRequestSuccess(true);
      } else {
        setFormError(result.error?.message || 'Failed to request password reset');
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
      console.error('Forgot password error:', err);
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
            <LockResetOutlined />
          </Box>
          
          <Typography component="h1" variant="h5" gutterBottom>
            Reset Your Password
          </Typography>
          
          {requestSuccess ? (
            <Alert severity="success" sx={{ width: '100%', marginY: 2 }}>
              If an account exists with this email, you will receive password reset instructions.
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Enter your email address and we'll send you instructions to reset your password.
              </Typography>
              
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
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
                
                <TextField
                  margin="normal"
                  fullWidth
                  name="tenant"
                  label="Company Subdomain (Optional)"
                  id="tenant"
                  value={tenant}
                  onChange={(e) => setTenant(e.target.value)}
                  disabled={isSubmitting}
                  helperText="Enter your company subdomain if provided"
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Send Reset Link'}
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

export default ForgotPasswordPage;