import React, { useState, useEffect } from 'react';
import { 
  Snackbar, 
  Alert, 
  Typography, 
  Box,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// Notification context to manage notifications across components
import { createContext, useContext } from 'react';

// Create a context for notifications
export const NotificationContext = createContext();

// Custom hook to use the notification context
export const useNotification = () => useContext(NotificationContext);

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  const showNotification = (notification) => {
    const id = Date.now(); // Generate a unique ID for the notification
    const newNotification = {
      id,
      ...notification,
      open: true,
      autoHideDuration: notification.autoHideDuration || 6000,
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Return the notification ID so it can be used to close the notification
    return id;
  };
  
  const closeNotification = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, open: false } : notification
      )
    );
    
    // Remove the notification after animation completes
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 500);
  };
  
  return (
    <NotificationContext.Provider value={{ showNotification, closeNotification }}>
      {children}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          id={notification.id}
          open={notification.open}
          message={notification.message}
          title={notification.title}
          severity={notification.severity || 'info'}
          autoHideDuration={notification.autoHideDuration}
          onClose={() => closeNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
};

// Individual notification component
const Notification = ({ id, open, message, title, severity, autoHideDuration, onClose }) => {
  const [isOpen, setIsOpen] = useState(open);
  
  useEffect(() => {
    setIsOpen(open);
  }, [open]);
  
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setIsOpen(false);
    onClose();
  };
  
  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 8 }} // Add margin top to avoid overlap with AppBar
    >
      <Alert
        severity={severity}
        variant="filled"
        onClose={handleClose}
        sx={{ width: '100%', boxShadow: 3 }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {title && (
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        )}
        <Typography variant="body2">{message}</Typography>
      </Alert>
    </Snackbar>
  );
};

export default Notification;
