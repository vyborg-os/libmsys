import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';

/**
 * PatronRoute component that restricts access to patron users only
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 */
function PatronRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPatron, setIsPatron] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in and has patron role
    const token = localStorage.getItem('lmsToken');
    const userStr = localStorage.getItem('lmsUser');
    
    if (!token || !userStr) {
      setIsPatron(false);
      setIsLoading(false);
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      setIsPatron(user.role === 'patron');
    } catch (error) {
      console.error('Error parsing user data:', error);
      setIsPatron(false);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Verifying user access...
        </Typography>
      </Box>
    );
  }
  
  if (!isPatron) {
    // Redirect non-patron users to admin dashboard if they're admin
    const userStr = localStorage.getItem('lmsUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          return <Navigate to="/admin" replace />;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // If not admin or error occurred, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default PatronRoute;
