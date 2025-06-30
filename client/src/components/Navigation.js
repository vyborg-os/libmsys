import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from './Notification';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Box,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Paper,
  Popover
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  LibraryBooks as CatalogIcon, 
  SwapHoriz as CirculationIcon, 
  Assessment as ReportsIcon,
  AccountCircle,
  AdminPanelSettings as AdminIcon,
  BookmarkBorder as ReservationsIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [newNotificationsCount, setNewNotificationsCount] = useState(0);
  const [viewedNotifications, setViewedNotifications] = useState([]);
  const open = Boolean(anchorEl);
  const notificationsOpen = Boolean(notificationsAnchorEl);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('lmsUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Load viewed notifications from localStorage
    const storedViewedNotifications = localStorage.getItem('lmsViewedNotifications');
    if (storedViewedNotifications) {
      setViewedNotifications(JSON.parse(storedViewedNotifications));
    }
  }, []);
  
  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    
    // Set up polling for notifications
    const fetchNotifications = async () => {
      try {
        // Fetch real notifications from API
        const { getNotifications } = await import('../services/api');
        const notificationsData = await getNotifications(user.id);
        console.log('Fetched notifications:', notificationsData);
        
        // Process notifications if they exist
        if (Array.isArray(notificationsData)) {
          // Format and enhance notifications
          const processedNotifications = notificationsData.map(notification => ({
            ...notification,
            id: notification.id || Math.random().toString(36).substring(2),
            title: notification.title || 'Notification',
            message: notification.message || 'You have a new notification',
            created_at: notification.created_at || new Date().toISOString()
          }));
          
          // Sort notifications by date (newest first)
          const sortedNotifications = processedNotifications.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });
          
          setNotifications(sortedNotifications);
          
          // Calculate new notifications (not viewed yet)
          const newCount = sortedNotifications.filter(
            notification => !viewedNotifications.includes(notification.id)
          ).length;
          setNewNotificationsCount(newCount);
          
          // If we have new notifications and the popover is not open, show a notification
          if (newCount > 0 && !notificationsOpen && !localStorage.getItem('notificationShown')) {
            showNotification({
              title: 'New Notifications',
              message: `You have ${newCount} new notification${newCount > 1 ? 's' : ''}`,
              severity: 'info',
              autoHideDuration: 4000
            });
            // Set a flag to prevent showing the notification multiple times
            localStorage.setItem('notificationShown', 'true');
            // Clear the flag after 5 minutes
            setTimeout(() => localStorage.removeItem('notificationShown'), 5 * 60 * 1000);
          }
        } else {
          console.warn('Notifications data is not an array:', notificationsData);
          // Fallback to empty array if API returns invalid data
          setNotifications([]);
          setNewNotificationsCount(0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    // Initial fetch
    fetchNotifications();
    
    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(fetchNotifications, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [user, viewedNotifications]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('lmsToken');
    localStorage.removeItem('lmsUser');
    showNotification({
      title: 'Logged Out',
      message: 'You have been successfully logged out',
      severity: 'success',
      autoHideDuration: 3000
    });
    navigate('/login');
  };
  
  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
    
    // Mark all notifications as viewed
    const notificationIds = notifications.map(notification => notification.id);
    const newNotifications = notifications.filter(notification => !viewedNotifications.includes(notification.id));
    
    setViewedNotifications(prev => {
      // Combine previous viewed notifications with new ones, removing duplicates
      const combined = [...new Set([...prev, ...notificationIds])];
      // Save to localStorage
      localStorage.setItem('lmsViewedNotifications', JSON.stringify(combined));
      return combined;
    });
    
    // If there are new notifications, show a notification
    if (newNotifications.length > 0) {
      showNotification({
        title: 'Notifications Viewed',
        message: `You have ${newNotifications.length} new notification${newNotifications.length > 1 ? 's' : ''}`,
        severity: 'info',
        autoHideDuration: 2000
      });
    }
    
    // Reset new notifications count
    setNewNotificationsCount(0);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleDismissNotification = (id) => {
    // Find the notification to be dismissed
    const notificationToDismiss = notifications.find(notification => notification.id === id);
    
    // Remove the notification from the list
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    // Show a dismissal notification
    if (notificationToDismiss) {
      showNotification({
        title: 'Notification Dismissed',
        message: `"${notificationToDismiss.title}" has been dismissed`,
        severity: 'success',
        autoHideDuration: 2000
      });
    }
  };

  // Define menu items based on user role
  const getMenuItems = () => {
    // Admin-specific navigation items
    if (user?.role === 'admin') {
      return [
        { text: 'Admin Dashboard', icon: <AdminIcon />, path: '/admin' },
        { text: 'Manage Books', icon: <CatalogIcon />, path: '/admin/books' },
        { text: 'Manage Users', icon: <AccountCircle />, path: '/admin/users' },
        { text: 'Reservations', icon: <ReservationsIcon />, path: '/admin/reservations' },
        { text: 'Borrowing History', icon: <ReportsIcon />, path: '/admin/history' }
      ];
    }
    
    // User/patron-specific navigation items
    return [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      { text: 'Catalog', icon: <CatalogIcon />, path: '/catalog' },
      { text: 'Circulation', icon: <CirculationIcon />, path: '/circulation' }
    ];
  };
  
  const menuItems = getMenuItems();

  const drawer = (
    <div>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Library MS
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.2)',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Library Management System
          </Typography>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                onClick={handleNotificationsOpen}
                size="large"
                color="inherit"
                aria-label="show notifications"
                sx={{ mr: 1 }}
              >
                <Badge badgeContent={newNotificationsCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <IconButton
                onClick={handleProfileMenuOpen}
                size="large"
                edge="end"
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                <MenuItem disabled>
                  <Typography variant="body2">
                    Signed in as <strong>{user.username}</strong>
                  </Typography>
                </MenuItem>
                <MenuItem disabled>
                  <Typography variant="body2" color="textSecondary">
                    Role: {user.role}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
              
              {/* Notifications Menu */}
              <Popover
                anchorEl={notificationsAnchorEl}
                open={notificationsOpen}
                onClose={handleNotificationsClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  sx: { width: 320, maxHeight: 400, overflow: 'auto' }
                }}
              >
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                  <Typography variant="h6">Notifications</Typography>
                </Box>
                <Box sx={{ p: 0 }}>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => {
                      // Parse the message to replace generic "you" with actual usernames
                      const message = notification.message.replace(
                        /you have (reserved|borrowed|returned)/i, 
                        `${notification.username || 'A user'} has $1`
                      );
                      
                      return (
                        <Paper 
                          key={notification.id} 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            borderBottom: '1px solid rgba(0,0,0,0.1)',
                            position: 'relative'
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
                                color: 'text.secondary',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                              }}
                              onClick={() => handleDismissNotification(notification.id)}
                            >
                              ×
                            </Button>
                          </Box>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>{message}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right', color: 'text.secondary' }}>
                            {new Date(notification.created_at).toLocaleString()}
                          </Typography>
                        </Paper>
                      );
                    })
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="textSecondary">No notifications</Typography>
                    </Box>
                  )}
                </Box>
                {user?.role === 'admin' && (
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={() => {
                        handleNotificationsClose();
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
                    </Button>
                  </Box>
                )}
              </Popover>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': { width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default Navigation;
