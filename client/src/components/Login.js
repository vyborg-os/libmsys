import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TextField, Button, Container, Typography, Box, Alert, CircularProgress,
  Chip, Divider, Paper, Tooltip
} from '@mui/material';
import { AdminPanelSettings, Person } from '@mui/icons-material';
import api from '../services/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('user'); // 'user' or 'admin'
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Call the API to login using the API service
      const response = await api.post('/users/login', {
        username,
        password
      });
      
      // Save token to localStorage for future authenticated requests
      localStorage.setItem('lmsToken', response.data.token);
      localStorage.setItem('lmsUser', JSON.stringify(response.data.user));
      
      // Enforce role-based login restrictions
      const userRole = response.data.user.role;
      
      // Admin trying to access user area or user trying to access admin area
      if ((userRole === 'admin' && loginMode === 'user') || 
          (userRole === 'patron' && loginMode === 'admin')) {
        setError(`You cannot log in as a ${loginMode} with your ${userRole} account.`);
        localStorage.removeItem('lmsToken');
        localStorage.removeItem('lmsUser');
        return;
      }
      
      // Redirect based on role
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(
        error.response?.data?.message || 
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 0,
        backgroundImage: 'url(/assets/library-img.jpg)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1,
        },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container component="main" maxWidth="xs" sx={{
        position: 'relative',
        zIndex: 2,
        background: 'rgba(255, 255, 255, 0.8)',
        padding: 4,
        borderRadius: 2,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <Typography component="h1" variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
          Library Management System
        </Typography>
        
        {/* Login Mode Selector */}
        <Paper 
          elevation={0} 
          sx={{ 
            display: 'flex', 
            mb: 2, 
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: 2
          }}
        >
          <Button
            fullWidth
            variant={loginMode === 'user' ? 'contained' : 'text'}
            startIcon={<Person />}
            onClick={() => setLoginMode('user')}
            sx={{ 
              borderRadius: '4px 0 0 4px',
              py: 1
            }}
          >
            User
          </Button>
          <Button
            fullWidth
            variant={loginMode === 'admin' ? 'contained' : 'text'}
            startIcon={<AdminPanelSettings />}
            onClick={() => setLoginMode('admin')}
            sx={{ 
              borderRadius: '0 4px 4px 0',
              py: 1
            }}
          >
            Admin
          </Button>
        </Paper>
        
        {loginMode === 'admin' && (
          <Chip 
            icon={<AdminPanelSettings />} 
            label="Admin Access" 
            color="primary" 
            variant="outlined" 
            sx={{ mb: 2 }} 
          />
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : (
              <>
                {loginMode === 'admin' ? 'Admin Sign In' : 'Sign In'}
              </>
            )}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Don't have an account?
            </Typography>
            <Button variant="text" size="small" sx={{ ml: 1 }} onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Login;
