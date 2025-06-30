import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Button, Container, Typography, CircularProgress,
  Paper, Divider, Alert, Snackbar, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, TextField
} from '@mui/material';
import {
  ArrowBack, BookmarkAdd, BookmarkRemove, CalendarToday
} from '@mui/icons-material';
import BookDetails from './BookDetails';
import { getBookById, reserveBook, returnBook } from '../../services/api';
import { addDays, format } from 'date-fns';

/**
 * ViewBook component for displaying detailed information about a book
 * and providing borrow/return functionality for patrons
 */
const ViewBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [borrowing, setBorrowing] = useState(false);
  const [returning, setReturning] = useState(false);
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState(addDays(new Date(), 14));
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Get user info from local storage
  const user = JSON.parse(localStorage.getItem('lmsUser') || '{}');
  const isAdmin = user.role === 'admin';
  
  // Fetch book details
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const data = await getBookById(id);
        setBook(data);
      } catch (error) {
        console.error('Error fetching book:', error);
        setError('Failed to load book details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBook();
  }, [id]);
  
  // Open reserve dialog
  const handleOpenReserveDialog = () => {
    setSelectedDueDate(addDays(new Date(), 14)); // Default due date is 2 weeks from now
    setReserveDialogOpen(true);
  };

  // Handle reserve book
  const handleReserve = async () => {
    try {
      setBorrowing(true);
      console.log('Reserving book with ID:', book.id, 'and due date:', selectedDueDate);
      
      // Format the date properly
      const formattedDate = format(selectedDueDate, 'yyyy-MM-dd');
      console.log('Formatted due date:', formattedDate);
      
      await reserveBook(book.id, formattedDate);
      
      // Close dialog
      setReserveDialogOpen(false);
      
      showNotification('Book reserved successfully! Please wait for admin approval.', 'success');
    } catch (error) {
      console.error('Error reserving book:', error);
      showNotification(error.response?.data?.message || 'Failed to reserve book. Please try again.', 'error');
    } finally {
      setBorrowing(false);
    }
  };
  
  // Handle return book
  const handleReturn = async () => {
    try {
      setReturning(true);
      await returnBook(book.id);
      
      // Update book available copies
      setBook(prev => ({
        ...prev,
        available_copies: prev.available_copies + 1
      }));
      
      showNotification('Book returned successfully! Please return it to the circulation desk.', 'success');
    } catch (error) {
      console.error('Error returning book:', error);
      showNotification(error.response?.data?.message || 'Failed to return book. Please try again.', 'error');
    } finally {
      setReturning(false);
    }
  };
  
  // Show notification
  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };
  
  // Handle close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Handle back button
  const handleBack = () => {
    navigate(-1);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />} 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Container>
    );
  }
  
  if (!book) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">Book not found</Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />} 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />} 
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
      </Paper>
      
      <BookDetails book={book} showInventory={isAdmin} />
      
      {!isAdmin && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Back to Catalog
        </Button>
        
        {!isAdmin && book?.available_copies > 0 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<BookmarkAdd />}
            onClick={handleOpenReserveDialog}
            disabled={borrowing}
          >
            {borrowing ? 'Processing...' : 'Reserve Book'}
          </Button>
        )}
        
        {!isAdmin && book?.available_copies === 0 && (
          <Button
            variant="contained"
            color="secondary"
            disabled
          >
            Currently Unavailable
          </Button>
        )}
        
        {!isAdmin && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<BookmarkRemove />}
            onClick={handleReturn}
            disabled={returning}
          >
            {returning ? 'Processing...' : 'Return Book'}
          </Button>
        )}
      </Box>
      )}
      
      {/* Notification */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      {/* Reserve Book Dialog */}
      <Dialog open={reserveDialogOpen} onClose={() => setReserveDialogOpen(false)}>
        <DialogTitle>Reserve Book</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please select when you would like to return the book. The admin will need to approve your reservation.
          </DialogContentText>
          <TextField
            label="Due Date"
            type="date"
            value={format(selectedDueDate, 'yyyy-MM-dd')}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              if (!isNaN(newDate.getTime())) {
                setSelectedDueDate(newDate);
              }
            }}
            InputProps={{
              inputProps: { min: format(addDays(new Date(), 1), 'yyyy-MM-dd') }
            }}
            fullWidth
            margin="normal"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            You are reserving: <strong>{book?.title}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReserveDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReserve} 
            variant="contained" 
            color="primary"
            disabled={borrowing}
          >
            {borrowing ? 'Processing...' : 'Confirm Reservation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ViewBook;
