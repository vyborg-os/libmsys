import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography, Box, Alert, CircularProgress } from '@mui/material';
import api from '../services/api';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Call the API to register the user using the API service
      const response = await api.post('/users/register', {
        username,
        email,
        password
      });
      
      // Show success message
      setSuccess('Registration successful! Redirecting to login...');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setError(
        error.response?.data?.message || 
        'Registration failed. Please try again.'
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
        <Typography component="h1" variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          Sign Up - Library Management System
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
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
            label="Email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Already have an account?
            </Typography>
            <Button variant="text" size="small" sx={{ ml: 1 }} onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Signup;
