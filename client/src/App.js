import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Catalog from './components/Catalog';
import Circulation from './components/Circulation';
import Signup from './components/Signup';
import Layout from './components/Layout';
import AdminRedirect from './components/AdminRedirect';
import AdminDashboard from './components/admin/AdminDashboard';
import ManageBooks from './components/admin/ManageBooks';
import ManageUsers from './components/admin/ManageUsers';
import ManageReservations from './components/admin/ManageReservations';
import BorrowingHistory from './components/admin/BorrowingHistory';
import ViewBook from './components/common/ViewBook';
import { NotificationProvider } from './components/Notification';

// Import route protection components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PatronRoute from './components/PatronRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Oxygen, Ubuntu, sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin-redirect" element={<AdminRedirect />} />
          
          {/* Patron-only routes */}
          <Route path="/dashboard" element={
            <PatronRoute>
              <Layout><Dashboard /></Layout>
            </PatronRoute>
          } />
          <Route path="/catalog" element={
            <ProtectedRoute requiredRole="patron">
              <Layout><Catalog /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/circulation" element={
            <ProtectedRoute requiredRole="patron">
              <Layout><Circulation /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/books/:id" element={
            <ProtectedRoute>
              <Layout><ViewBook /></Layout>
            </ProtectedRoute>
          } />
          {/* Reports route removed */}
          
          {/* Admin-only routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <Layout><AdminDashboard /></Layout>
            </AdminRoute>
          } />
          <Route path="/admin/books" element={
            <AdminRoute>
              <Layout><ManageBooks /></Layout>
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <Layout><ManageUsers /></Layout>
            </AdminRoute>
          } />
          <Route path="/admin/history" element={
            <AdminRoute>
              <Layout><BorrowingHistory /></Layout>
            </AdminRoute>
          } />
          <Route path="/admin/reservations" element={
            <AdminRoute>
              <Layout><ManageReservations /></Layout>
            </AdminRoute>
          } />
          
          {/* Default route */}
          <Route path="*" element={<Login />} />
        </Routes>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
