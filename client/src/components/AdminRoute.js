import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';

/**
 * AdminRoute component that restricts access to admin users only
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 */
function AdminRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in and has admin role
    const token = localStorage.getItem('lmsToken');
    const userStr = localStorage.getItem('lmsUser');
    
    if (!token || !userStr) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      setIsAdmin(user.role === 'admin');
    } catch (error) {
      console.error('Error parsing user data:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Verifying admin access...
        </Typography>
      </Box>
    );
  }
  
  if (!isAdmin) {
    // Redirect non-admin users to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

export default AdminRoute;
