import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../Notification';
import { Typography, Box, Paper, Grid, Button, CircularProgress, Divider, Tooltip } from '@mui/material';
import { 
  MenuBook, Person, Assessment, Dashboard as DashboardIcon, LibraryBooks, 
  People, Book, LocalLibrary, Category, Bookmark, Notifications, SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';
import api from '../../services/api';

function AdminDashboard() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    borrowedBooks: 0,
    totalUsers: 0,
    adminUsers: 0,
    patronUsers: 0,
    notifications: []
  });
  const [loading, setLoading] = useState(true);

  // Check if user is admin on component mount and fetch dashboard stats
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('lmsUser'));
    if (!user || user.role !== 'admin') {
      // Redirect non-admin users
      navigate('/dashboard');
      return;
    }
    
    // Fetch dashboard statistics
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const dashboardStats = await api.get('/dashboard/stats');
        const usersResponse = await api.get('/users');
        
        // Calculate user stats
        const users = usersResponse.data || [];
        const adminUsers = users.filter(user => user.role === 'admin').length;
        const patronUsers = users.filter(user => user.role === 'patron').length;
        
        setStats({
          ...dashboardStats.data,
          totalUsers: users.length,
          adminUsers,
          patronUsers
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, [navigate]);

  // Navigation handlers
  const navigateToBooks = () => navigate('/admin/books');
  const navigateToUsers = () => navigate('/admin/users');
  const navigateToReports = () => navigate('/admin/reports');
  
  // Helper function to render a circular statistic with notification support
  const renderCircularStat = ({ title, count, total, color, tooltipText, icon, navigateTo }) => {
    // Calculate percentage
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    
    const handleStatClick = () => {
      if (navigateTo) {
        navigate(navigateTo);
        showNotification({
          title: `${title} Details`,
          message: `Viewing details for ${count} ${title.toLowerCase()} (${percentage}%)`,
          severity: 'info',
          autoHideDuration: 3000
        });
      }
    };
    
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          p: 1,
          cursor: navigateTo ? 'pointer' : 'default',
          '&:hover': navigateTo ? { 
            transform: 'scale(1.05)',
            transition: 'transform 0.3s'
          } : {}
        }}
        onClick={handleStatClick}
      >
        <Tooltip title={tooltipText || `${percentage}% ${title}`} arrow placement="top">
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress variant="determinate" value={percentage} size={80} thickness={4} sx={{ color: color }} />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" component="div" color="white">{count}</Typography>
            </Box>
          </Box>
        </Tooltip>
        <Typography variant="body2" sx={{ mt: 1, color: 'white' }}>
          {icon && React.cloneElement(icon, { sx: { mr: 0.5, fontSize: 16, verticalAlign: 'text-bottom' } })}
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'white' }}>{percentage}%</Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <DashboardIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Admin Dashboard
        </Typography>
      </Box>
      
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Welcome to the Library Management System Admin Area
      </Typography>
      
      {/* Stats Section */}
      <Typography variant="h5" gutterBottom sx={{ mt: 2, mb: 2 }}>
        System Statistics
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Book Stats */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LibraryBooks sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Book Statistics</Typography>
              </Box>
              <Divider sx={{ bgcolor: 'white', opacity: 0.3, my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexGrow: 1, mt: 2 }}>
                {/* Total Books */}
                {renderCircularStat({
                  icon: <Book />,
                  title: 'Total',
                  count: stats.totalBooks,
                  total: stats.totalBooks,
                  color: 'white',
                  tooltipText: 'Total Books in Library',
                  navigateTo: '/admin/books'
                })}
                
                {/* Available Books */}
                {renderCircularStat({
                  icon: <MenuBook />,
                  title: 'Available',
                  count: stats.availableBooks,
                  total: stats.totalBooks,
                  color: '#4caf50',
                  tooltipText: `${Math.round((stats.availableBooks / stats.totalBooks) * 100)}% Available Books`,
                  navigateTo: '/admin/books'
                })}
                
                {/* Borrowed Books */}
                {renderCircularStat({
                  icon: <LocalLibrary />,
                  title: 'Borrowed',
                  count: stats.borrowedBooks,
                  total: stats.totalBooks,
                  color: '#ff9800',
                  tooltipText: `${Math.round((stats.borrowedBooks / stats.totalBooks) * 100)}% Borrowed Books`,
                  navigateTo: '/admin/books'
                })}
              </Box>
            </Paper>
          </Grid>
          
          {/* User Stats */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, bgcolor: 'secondary.light', color: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">User Statistics</Typography>
              </Box>
              <Divider sx={{ bgcolor: 'white', opacity: 0.3, my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexGrow: 1, mt: 2 }}>
                {/* Total Users */}
                {renderCircularStat({
                  icon: <Person />,
                  title: 'Total',
                  count: stats.totalUsers,
                  total: stats.totalUsers,
                  color: 'white',
                  tooltipText: 'Total System Users',
                  navigateTo: '/admin/users'
                })}
                
                {/* Admin Users */}
                {renderCircularStat({
                  icon: <Person />,
                  title: 'Admins',
                  count: stats.adminUsers,
                  total: stats.totalUsers,
                  color: 'yellow',
                  tooltipText: `${Math.round((stats.adminUsers / stats.totalUsers) * 100)}% Admin Users`,
                  navigateTo: '/admin/users'
                })}
                
                {/* Patron Users */}
                {renderCircularStat({
                  icon: <Person />,
                  title: 'Patrons',
                  count: stats.patronUsers,
                  total: stats.totalUsers,
                  color: '#2196f3',
                  tooltipText: `${Math.round((stats.patronUsers / stats.totalUsers) * 100)}% Patron Users`,
                  navigateTo: '/admin/users'
                })}
              </Box>
            </Paper>
          </Grid>
          
          {/* Notifications */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, bgcolor: 'success.light', color: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Notifications sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">Recent Notifications</Typography>
                </Box>
                <Box>
                  {/* <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ color: 'white', borderColor: 'white', mr: 1 }}
                    onClick={() => {
                      navigate('/admin/history');
                      showNotification({
                        title: 'Borrowing History',
                        message: 'Navigating to borrowing history page',
                        severity: 'info',
                        autoHideDuration: 3000
                      });
                    }}
                  >
                    Borrowing History
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ color: 'white', borderColor: 'white' }}
                    onClick={() => {
                      navigate('/admin/reservations');
                      showNotification({
                        title: 'Reservation Management',
                        message: 'Navigating to reservation management page',
                        severity: 'info',
                        autoHideDuration: 3000
                      });
                    }}
                  >
                    Manage Reservations
                  </Button> */}
                </Box>
              </Box>
              <Divider sx={{ bgcolor: 'white', opacity: 0.3, my: 1 }} />
              <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: '300px' }}>
                {stats.notifications && stats.notifications.length > 0 ? (
                  stats.notifications.slice(0, 5).map((notification, index) => {
                    // Parse the message to replace generic "you" with actual usernames
                    const message = notification.message.replace(
                      /you have (reserved|borrowed|returned)/i, 
                      `${notification.username || 'A user'} has $1`
                    );
                    
                    return (
                      <Paper 
                        key={index} 
                        elevation={3} 
                        sx={{ 
                          mb: 2, 
                          p: 1.5, 
                          bgcolor: 'rgba(255,255,255,0.15)', 
                          position: 'relative',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                        }}
                        onClick={() => {
                          // Show notification details in a push notification
                          showNotification({
                            title: notification.title,
                            message: message,
                            severity: notification.type || 'info',
                            autoHideDuration: 5000
                          });
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {notification.title}
                          </Typography>
                          <Button 
                            size="small" 
                            sx={{ 
                              minWidth: 'auto', 
                              p: 0.5, 
                              color: 'white', 
                              opacity: 0.7,
                              '&:hover': { opacity: 1 }
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the parent onClick
                              // Mark notification as read/dismissed
                              const updatedNotifications = [...stats.notifications];
                              updatedNotifications.splice(index, 1);
                              setStats(prev => ({ ...prev, notifications: updatedNotifications }));
                              
                              // Show dismissal notification
                              showNotification({
                                title: 'Notification Dismissed',
                                message: `Dismissed: ${notification.title}`,
                                severity: 'success',
                                autoHideDuration: 2000
                              });
                            }}
                          >
                            ×
                          </Button>
                        </Box>
                        <Typography variant="body2">{message}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right', opacity: 0.8 }}>
                          {new Date(notification.created_at || Date.now()).toLocaleString()}
                        </Typography>
                      </Paper>
                    );
                  })
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography>No recent notifications</Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ color: 'white', borderColor: 'white' }}
                  onClick={() => {
                    // Clear all notifications
                    if (stats.notifications && stats.notifications.length > 0) {
                      setStats(prev => ({ ...prev, notifications: [] }));
                      showNotification({
                        title: 'Notifications Cleared',
                        message: 'All notifications have been cleared',
                        severity: 'success',
                        autoHideDuration: 3000
                      });
                    } else {
                      showNotification({
                        title: 'No Notifications',
                        message: 'There are no notifications to clear',
                        severity: 'info',
                        autoHideDuration: 3000
                      });
                    }
                  }}
                >
                  Clear All
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ color: 'white', borderColor: 'white' }}
                  onClick={() => {
                    // Refresh notifications (in a real app, this would fetch from API)
                    showNotification({
                      title: 'Refreshing Notifications',
                      message: 'Checking for new notifications',
                      severity: 'info',
                      autoHideDuration: 2000
                    });
                  }}
                >
                  Refresh
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Management Options
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <MenuBook sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">Book Management</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" paragraph>
                Add, edit, delete, and manage the library's book collection.
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={navigateToBooks}
                fullWidth
              >
                Manage Books
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Person sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">User Management</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" paragraph>
                Manage user accounts, roles, and permissions.
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={navigateToUsers}
                fullWidth
              >
                Manage Users
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">Reports</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" paragraph>
                View circulation statistics, popular books, and overdue items.
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={navigateToReports}
                fullWidth
              >
                View Reports
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdminDashboard;
