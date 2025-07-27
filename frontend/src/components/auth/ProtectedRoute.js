import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

/**
 * Protected route component that redirects to login if user is not authenticated
 * @param {Object} props - Component props
 * @returns {JSX.Element} Protected route component
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If authentication is done loading and user is not authenticated
    if (!loading && !isAuthenticated) {
      router.push({
        pathname: '/auth/login',
        query: { returnUrl: router.asPath }
      });
    }
  }, [isAuthenticated, loading, router]);

  // Show loading spinner while checking authentication
  if (loading || !isAuthenticated) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If authenticated, render children
  return children;
};

export default ProtectedRoute;