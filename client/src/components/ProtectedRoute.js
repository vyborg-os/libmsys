import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component that restricts access based on user authentication and role
 * @param {Object} props - Component props
 * @param {string} props.requiredRole - The role required to access this route ('admin' or 'patron')
 * @param {React.ReactNode} props.children - Child components to render if authorized
 */
function ProtectedRoute({ requiredRole, children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in and has the required role
    const token = localStorage.getItem('lmsToken');
    const userStr = localStorage.getItem('lmsUser');
    
    if (!token || !userStr) {
      setIsAuthorized(false);
      setIsLoading(false);
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      
      // For admin routes, user must be admin
      // For user routes, any authenticated user can access (both admin and patron)
      if (requiredRole === 'admin') {
        setIsAuthorized(user.role === 'admin');
      } else if (requiredRole === 'patron') {
        setIsAuthorized(user.role === 'patron' || user.role === 'admin');
      } else {
        setIsAuthorized(!!user); // Any authenticated user
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  }, [requiredRole]);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthorized) {
    // Redirect to login if not authorized
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default ProtectedRoute;
