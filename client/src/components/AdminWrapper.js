import React from 'react';
import { Navigate } from 'react-router-dom';

// Simple Admin wrapper component that redirects based on user role
const AdminWrapper = () => {
  const user = JSON.parse(localStorage.getItem('lmsUser') || '{}');
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/admin" replace />;
};

export default AdminWrapper;
