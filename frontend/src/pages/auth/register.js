import React, { useState } from 'react';
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
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import { PersonAddOutlined } from '@mui/icons-material';

/**
 * Registration page component
 * @returns {JSX.Element} Registration page
 */
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    tenantId: '',
    companyId: ''
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const { register, error } = useAuth();
  const router = useRouter();
  
  /**
   * Handle input change
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');
    
    try {
      // Prepare registration data
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      };
      
      // Add optional fields if provided
      if (formData.tenantId) userData.tenantId = formData.tenantId;
      if (formData.companyId) userData.companyId = formData.companyId;
      
      const result = await register(userData);
      
      if (result.success) {
        setRegistrationSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setFormError(result.error?.message || 'Registration failed');
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Container component="main" maxWidth="sm">
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
            <PersonAddOutlined />
          </Box>
          
          <Typography component="h1" variant="h5" gutterBottom>
            Create an Account
          </Typography>
          
          {registrationSuccess ? (
            <Alert severity="success" sx={{ width: '100%', marginY: 2 }}>
              Registration successful! You will be redirected to the login page.
            </Alert>
          ) : (
            <>
              {(formError || error) && (
                <Alert severity="error" sx={{ width: '100%', marginBottom: 2 }}>
                  {formError || error}
                </Alert>
              )}
              
              <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      id="firstName"
                      label="First Name"
                      name="firstName"
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      id="lastName"
                      label="Last Name"
                      name="lastName"
                      autoComplete="family-name"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type="password"
                      id="password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      helperText="Password must be at least 8 characters long"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      name="confirmPassword"
                      label="Confirm Password"
                      type="password"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Optional Information
                  </Typography>
                </Divider>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="tenantId"
                      label="Tenant ID"
                      name="tenantId"
                      value={formData.tenantId}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      helperText="If you have a tenant ID"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="companyId"
                      label="Company ID"
                      name="companyId"
                      value={formData.companyId}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      helperText="If you have a company ID"
                    />
                  </Grid>
                </Grid>
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Sign Up'}
                </Button>
                
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link href="/auth/login" passHref>
                    <Typography variant="body2" component="a" sx={{ cursor: 'pointer' }}>
                      Already have an account? Sign In
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

export default RegisterPage;