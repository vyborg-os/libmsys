import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Grid, Card, CardContent, CardMedia,
  CardHeader, Divider, List, ListItem, ListItemText, CircularProgress,
  ListItemIcon, Avatar, Chip, Tooltip, IconButton
} from '@mui/material';
import { 
  LibraryBooks, SwapHoriz, Notifications, MenuBook, 
  CheckCircle, Warning, Info, AccessTime
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getDashboardStats } from '../services/api';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    borrowedBooks: 0,
    notifications: []
  });

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('lmsUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Fetch live data from API
    const fetchDashboardData = async () => {
      try {
        const data = await getDashboardStats();
        setStats({
          totalBooks: data.totalBooks || 0,
          availableBooks: data.availableBooks || 0,
          borrowedBooks: data.borrowedBooks || 0,
          notifications: data.notifications || []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set fallback data if API call fails
        setStats({
          totalBooks: 0,
          availableBooks: 0,
          borrowedBooks: 0,
          notifications: [
            { id: 1, title: 'Error', message: 'Could not load dashboard data.', date: new Date() }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        
        {user && (
          <Chip
            avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{user.username.charAt(0).toUpperCase()}</Avatar>}
            label={`Welcome, ${user.username}! (${user.role})`}
            variant="outlined"
            color="primary"
            sx={{ px: 1 }}
          />
        )}
      </Box>
      
      <Grid container spacing={4} direction="column">
        {/* Stats Cards */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }
          }}>
            <CardMedia
              sx={{ height: 60, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', px: 2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MenuBook sx={{ color: 'white', mr: 1 }} />
                <Typography variant="h6" color="white">
                  Library Catalog
                </Typography>
              </Box>
            </CardMedia>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h3" align="center" color="primary.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.totalBooks}
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
                Total Books in Collection
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 'auto' }}>
                <Tooltip title="Available for borrowing">
                  <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'success.light', mb: 1 }}>
                      <CheckCircle />
                    </Avatar>
                    <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {stats.availableBooks}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Available
                    </Typography>
                  </Box>
                </Tooltip>
                
                <Tooltip title="Currently borrowed by patrons">
                  <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'warning.light', mb: 1 }}>
                      <AccessTime />
                    </Avatar>
                    <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      {stats.borrowedBooks}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Borrowed
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Circulation */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }
          }}>
            <CardMedia
              sx={{ height: 60, bgcolor: 'secondary.main', display: 'flex', alignItems: 'center', px: 2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SwapHoriz sx={{ color: 'white', mr: 1 }} />
                <Typography variant="h6" color="white">
                  Circulation
                </Typography>
              </Box>
            </CardMedia>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.light', mr: 2 }}>
                  <LibraryBooks />
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    Book Management
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Track borrowing and returns
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {user?.role === 'admin' ? 
                  'As an admin, you can manage all circulation records and process book loans and returns.' : 
                  'View your borrowed books, due dates, and manage your returns.'}
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: 'info.light', 
                borderRadius: 1, 
                color: 'info.contrastText',
                mt: 'auto',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Info sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {user?.role === 'admin' ? 
                    'You have admin privileges to manage all circulation records.' : 
                    'Visit the Circulation page to see your borrowed books.'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Notifications */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }
          }}>
            <CardMedia
              sx={{ height: 60, bgcolor: 'info.main', display: 'flex', alignItems: 'center', px: 2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Notifications sx={{ color: 'white', mr: 1 }} />
                  <Typography variant="h6" color="white">
                    Notifications
                  </Typography>
                </Box>
                <Chip 
                  label={stats.notifications.length} 
                  size="small" 
                  color="error" 
                  sx={{ color: 'white' }}
                />
              </Box>
            </CardMedia>
            <CardContent sx={{ flexGrow: 1, p: 0 }}>
              <List sx={{ p: 0 }}>
                {stats.notifications.length > 0 ? (
                  stats.notifications.map((notification) => (
                    <React.Fragment key={notification.id}>
                      <ListItem alignItems="flex-start" sx={{ 
                        px: 2, 
                        py: 1.5,
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } 
                      }}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'info.light' }}>
                            <Info />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {notification.title || 'Notification'}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="textPrimary" sx={{ display: 'block', mt: 0.5 }}>
                                {notification.message}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                                {notification.date ? formatDate(notification.date) : 'No date'}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No notifications"
                      secondary="You're all caught up!"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
