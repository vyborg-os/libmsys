import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * AdminRedirect component that redirects to the appropriate dashboard
 * based on user role. This component prevents infinite redirect loops
 * by using React Router's Navigate component.
 */
function AdminRedirect() {
  // Check if user is admin
  const user = JSON.parse(localStorage.getItem('lmsUser') || '{}');
  
  // If not admin, redirect to dashboard, otherwise to admin dashboard
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/admin" replace />;
}

export default AdminRedirect;
