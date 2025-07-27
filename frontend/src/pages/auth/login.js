import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { TextField, Button, Paper, Typography, Box, Container, Alert, CircularProgress } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

/**
 * Login page component
 * @returns {JSX.Element} Login page
 */
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenant, setTenant] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, error } = useAuth();
  const router = useRouter();
  
  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!email || !password) {
      setFormError('Email and password are required');
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');
    
    try {
      const result = await login(email, password, tenant || null);
      
      if (result.success) {
        // Redirect to dashboard on successful login
        router.push('/dashboard');
      } else {
        setFormError(result.error?.message || 'Login failed');
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
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
            Sign in to AgriERP
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
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Link href="/auth/forgot-password" passHref>
                <Typography variant="body2" component="a" sx={{ cursor: 'pointer' }}>
                  Forgot password?
                </Typography>
              </Link>
              
              <Link href="/auth/register" passHref>
                <Typography variant="body2" component="a" sx={{ cursor: 'pointer' }}>
                  Don't have an account? Sign Up
                </Typography>
              </Link>
            </Box>
          </Box>
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

export default LoginPage;