import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Grid, Card, CardContent, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, IconButton, Tabs, Tab, Alert,
  Divider, Avatar, TextField, Snackbar
} from '@mui/material';
import { 
  MenuBook, Person, CalendarToday, CheckCircle, Warning,
  ArrowBack, ArrowForward, History, LibraryBooks, EventAvailable,
  ThumbUp, AccessTime
} from '@mui/icons-material';
import { format, addDays } from 'date-fns';
import { getCirculationRecords, returnBook, approveReservation, cancelReservation } from '../services/api';
import { useNotification } from '../components/Notification';

function Circulation() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [returnMessage, setReturnMessage] = useState({ text: '', type: '' });
  const [approveMessage, setApproveMessage] = useState({ text: '', type: '' });
  const [cancelMessage, setCancelMessage] = useState({ text: '', type: '' });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  
  // Get notification context if available
  const notificationContext = useNotification();
  
  // Function to show notifications - will use context if available, otherwise use local snackbar
  const showNotification = (notification) => {
    if (notificationContext && notificationContext.showNotification) {
      notificationContext.showNotification(notification);
    } else {
      // Fallback to local snackbar
      setSnackbarMessage(notification.message || notification.title || '');
      setSnackbarSeverity(notification.severity || 'info');
      setSnackbarOpen(true);
    }
  };
  
  const fetchCirculationRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get circulation records filtered by the current user's ID if not admin
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = storedUser?.id;
      const isAdmin = storedUser?.role === 'admin';
      
      console.log('Current user:', { userId, isAdmin });
      
      // If admin, get all records; otherwise, filter by user ID
      const data = await getCirculationRecords(isAdmin ? null : userId);
      console.log('Raw circulation records:', data);
      console.log('Raw circulation records count:', data.length);
      
      // Log the structure of a sample record to understand the data format
      if (data.length > 0) {
        console.log('Sample record structure:', JSON.stringify(data[0], null, 2));
      }
      
      // Process the records to link borrow and return records
      const processedData = processCirculationRecords(data);
      console.log('Processed circulation records:', processedData);
      
      setRecords(processedData);
    } catch (error) {
      console.error('Error fetching circulation records:', error);
      setError('Failed to load circulation records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Get user info from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    fetchCirculationRecords();
  }, []);
  
  
  // Process circulation records to link return records with borrow records
  const processCirculationRecords = (records) => {
    if (!Array.isArray(records) || records.length === 0) {
      console.log('No records to process');
      return [];
    }
    
    console.log('Processing circulation records:', records.length);
    
    // Log all record types to understand what we're working with
    const borrowCount = records.filter(r => r.action === 'borrow').length;
    const returnCount = records.filter(r => r.action === 'return').length;
    const reserveCount = records.filter(r => r.action === 'reserve').length;
    const returnedCount = records.filter(r => r.returned === true).length;
    
    console.log('Record counts by type:', {
      borrow: borrowCount,
      return: returnCount,
      reserve: reserveCount,
      'marked as returned': returnedCount
    });
    
    // Make a copy of the records to avoid modifying the original array
    const processedRecords = [...records];
    
    // Enhance borrow records with return information
    records.forEach(record => {
      if (record.action === 'borrow' && record.returned === true) {
        // Find matching return record
        const returnRecord = records.find(r => 
          r.action === 'return' && r.book_id === record.book_id
        );
        
        if (returnRecord) {
          // Find this record in our processed array and enhance it
          const index = processedRecords.findIndex(r => r.id === record.id);
          if (index !== -1) {
            processedRecords[index] = {
              ...processedRecords[index],
              return_date: returnRecord.action_date,
              status: 'returned'
            };
          }
        }
      }
    });
    
    console.log('Processed records count:', processedRecords.length);
    
    return processedRecords;
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleReturnClick = (record) => {
    setSelectedRecord(record);
    setReturnDialogOpen(true);
    setReturnMessage({ text: '', type: '' });
  };
  
  const handleReturnBook = async () => {
    if (!selectedRecord) return;
    
    try {
      setProcessing(true);
      setReturnMessage({ text: '', type: '' }); // Clear previous messages
      
      console.log('Selected record for return:', selectedRecord);
      
      // Debug the record structure to identify the correct book_id
      console.log('Record ID:', selectedRecord.id);
      console.log('Book ID from record:', selectedRecord.book_id);
      console.log('Book object:', selectedRecord.book);
      
      // Extract the correct book ID from the record
      // The API expects the book_id, not the circulation record ID
      let bookId = null;
      
      // IMPORTANT: Check for book_id in all possible locations
      // First priority: Check if the book object has an id
      if (selectedRecord.book && typeof selectedRecord.book === 'object' && selectedRecord.book.id) {
        bookId = selectedRecord.book.id;
        console.log('Using book.id:', bookId);
      }
      // Second priority: Check if there's a direct book_id property
      else if (selectedRecord.book_id !== undefined && selectedRecord.book_id !== null && selectedRecord.book_id !== 'undefined') {
        bookId = selectedRecord.book_id;
        console.log('Using book_id property:', bookId);
      }
      // Third priority: Check for bookId property (camelCase variation)
      else if (selectedRecord.bookId !== undefined && selectedRecord.bookId !== null) {
        bookId = selectedRecord.bookId;
        console.log('Using bookId property:', bookId);
      }
      // Fourth priority: Check for book_id in the circulation record's ID
      else if (selectedRecord.id && typeof selectedRecord.id === 'string') {
        // Try to extract from record ID if it's in format "book_123"
        const parts = selectedRecord.id.split('_');
        if (parts.length > 1 && !isNaN(parseInt(parts[1]))) {
          bookId = parseInt(parts[1]);
          console.log('Extracted book_id from record.id:', bookId);
        }
      }
      
      if (!bookId) {
        throw new Error('Could not determine book ID from record');
      }
      
      console.log('Calling returnBook API with book_id:', bookId);
      const response = await returnBook(bookId);
      console.log('Return book API response:', response);
      
      // Check for success in the response
      if (response && response.success) {
        // Close the dialog immediately for better UX
        setReturnDialogOpen(false);
        
        setReturnMessage({ 
          text: `Successfully returned "${selectedRecord.title || selectedRecord.book?.title || 'book'}"`, 
          type: 'success' 
        });
        
        // Only show notification to the current user if they're an admin
        // Regular users don't need to be notified about their own actions
        if (user?.role === 'admin') {
          showNotification({
            title: 'Book Returned',
            message: `${selectedRecord.username || 'A user'} has returned "${selectedRecord.title || selectedRecord.book?.title || 'book'}"`,
            severity: 'success',
            autoHideDuration: 3000
          });
        }
        
        // Refresh records to get the updated data from server
        // This will include the new 'return' record from the database
        setTimeout(() => {
          fetchCirculationRecords();
        }, 1000); // Give the server a moment to update
      } else {
        // Handle case where API returned but without success flag
        throw new Error(response?.message || 'Return operation did not complete successfully');
      }
    } catch (error) {
      console.error('Error returning book:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to return book. Please try again.';
      setReturnMessage({ text: errorMessage, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };
  
  const handleApproveClick = (record) => {
    setSelectedRecord(record);
    setApproveDialogOpen(true);
    setApproveMessage({ text: '', type: '' });
  };
  
  const handleCancelClick = (record) => {
    console.log('Cancel clicked for record:', JSON.stringify(record));
    setSelectedRecord(record);
    setCancelDialogOpen(true);
    setCancelMessage({ text: '', type: '' });
  };
  
  const handleCancelReservation = async () => {
    if (!selectedRecord) return;
    
    try {
      setProcessing(true);
      console.log('Full record object:', selectedRecord);
      
      // Make sure we're passing the correct ID
      // Use the numeric ID value
      const circulationId = parseInt(selectedRecord.id);
      console.log('Circulation ID being sent:', circulationId, 'type:', typeof circulationId);
      
      // Check if the ID is valid
      if (isNaN(circulationId) || circulationId <= 0) {
        throw new Error(`Invalid circulation ID: ${selectedRecord.id}`);
      }
      
      const response = await cancelReservation(circulationId);
      console.log('Cancel reservation response:', response);
      
      // Refresh the circulation records from the server
      await fetchCirculationRecords();
      
      setCancelMessage({ 
        text: `Successfully canceled reservation for "${selectedRecord.title}"`, 
        type: 'success' 
      });
      
      // Close dialog after a short delay
      setTimeout(() => {
        setCancelDialogOpen(false);
        setSelectedRecord(null);
      }, 2000);
      
    } catch (err) {
      console.error('Error canceling reservation:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to cancel reservation. Please try again.';
      setCancelMessage({ 
        text: errorMessage, 
        type: 'error' 
      });
    } finally {
      setProcessing(false);
    }
  };
  
  const handleApproveReservation = async () => {
    if (!selectedRecord) return;
    
    try {
      setProcessing(true);
      await approveReservation(selectedRecord.id);
      
      // Update local state
      const updatedRecords = records.map(record => {
        if (record.id === selectedRecord.id) {
          return { ...record, action: 'borrow' };
        }
        return record;
      });
      
      setRecords(updatedRecords);
      setApproveMessage({ 
        text: `Successfully approved reservation for "${selectedRecord.title}"`, 
        type: 'success' 
      });
      
      // Send notification - this should be sent to the user who made the reservation
      // Admin is approving, so they don't need a notification about their own action
      if (user?.role === 'admin') {
        // This notification would ideally be sent to the specific user who made the reservation
        // For now, we're just logging it as we don't have a way to send to specific users
        console.log(`Notification should be sent to ${selectedRecord.username || 'user'} about their approved reservation`);
        
        // In a real system with push notifications, you would send to the specific user:
        // sendNotificationToUser(selectedRecord.userId, {
        //   title: 'Reservation Approved',
        //   message: `Your reservation for "${selectedRecord.title}" has been approved`,
        //   severity: 'success'
        // });
      }
      
      // Close dialog after a short delay
      setTimeout(() => {
        setApproveDialogOpen(false);
        setSelectedRecord(null);
      }, 2000);
      
    } catch (err) {
      console.error('Error approving reservation:', err);
      setApproveMessage({ 
        text: 'Failed to approve reservation. Please try again.', 
        type: 'error' 
      });
    } finally {
      setProcessing(false);
    }
  };
  
  const formatDate = (dateString) => {
    // Handle null, undefined, N/A, or empty string
    if (!dateString || dateString === 'N/A' || dateString === 'null' || dateString === '') {
      return '-';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date value:', dateString);
        return '-';
      }
      
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return '-';
    }
  };
  
  // Filter records based on tab
  let currentRecords = [];
  if (tabValue === 0) {
    // Tab 0: Current loans (borrowed books that haven't been returned yet)
    currentRecords = records.filter(record => 
      record.action === 'borrow' && 
      !record.returned && 
      record.action !== 'return'
    );
    console.log('Current loans tab records:', currentRecords.length);
  } else if (tabValue === 1) {
    // Tab 1: Pending reservations (reserved books waiting for approval)
    currentRecords = records.filter(record => 
      record.action === 'reserve' && 
      !record.returned
    );
    console.log('Pending reservations tab records:', currentRecords.length);
  } else if (tabValue === 2) {
    // Tab 2: Loan history (books that have been borrowed and returned)
    // For debugging, let's log what we have in the records array
    console.log('All records before filtering for loan history:', records.map(r => ({
      id: r.id,
      action: r.action,
      book_id: r.book_id,
      returned: r.returned,
      title: r.title
    })));
    
    // Create a map to track which books we've already processed
    const processedBookIds = new Map();
    
    // First pass: Find all borrow records that have been returned
    const returnedBorrows = records.filter(record => 
      record.action === 'borrow' && record.returned === true
    );
    
    // Add these to our current records and track which book_ids we've processed
    currentRecords = returnedBorrows.map(record => {
      processedBookIds.set(record.book_id, true);
      return record;
    });
    
    console.log('Returned borrow records:', currentRecords.length);
    
    // Second pass: Add return records ONLY for books that don't already have a borrow record
    const additionalReturns = records.filter(record => 
      record.action === 'return' && !processedBookIds.has(record.book_id)
    );
    
    currentRecords = [...currentRecords, ...additionalReturns];
    
    console.log('Final loan history records after deduplication:', currentRecords.length);
  }
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6">{error}</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {/* Local Snackbar for notifications when context is not available */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
      <Typography variant="h4" component="h1" gutterBottom sx={{ 
        fontWeight: 'bold',
        color: 'primary.main',
        borderBottom: '2px solid',
        borderColor: 'primary.main',
        pb: 1,
        mb: 3
      }}>
        Circulation Management
      </Typography>
      
      <Paper elevation={2} sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            icon={<MenuBook />} 
            label="Current Loans" 
            iconPosition="start"
          />
          <Tab 
            icon={<AccessTime />} 
            label="Pending Reservations" 
            iconPosition="start"
          />
          <Tab 
            icon={<History />} 
            label="Loan History" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>
      
      {/* Debug information */}
      <Box sx={{ mb: 2, p: 1, bgcolor: 'background.paper', display: 'none' }}>
        <Typography variant="caption">
          Tab: {tabValue}, Records: {records.length}, Current Records: {currentRecords.length}
        </Typography>
      </Box>
      
      {currentRecords.length > 0 || (tabValue === 2 && records.some(r => r.returned || r.action === 'return')) ? (
        <TableContainer component={Paper} elevation={3}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Book</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Borrowed By</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Borrow Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Return Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                {/* <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {currentRecords.map((record) => (
                <TableRow key={record.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                        <MenuBook />
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {record.title || 'Unknown Book'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'secondary.light', mr: 1, width: 24, height: 24 }}>
                        <Person fontSize="small" />
                      </Avatar>
                      <Typography variant="body2">
                        {record.username || 'Unknown User'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(record.action_date || record.borrow_date)}</TableCell>
                  <TableCell>{formatDate(record.due_date)}</TableCell>
                  <TableCell>{record.returned ? formatDate(record.return_date) : '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={
                        record.action === 'return' || record.returned || record.return_date ? 'Returned' : 
                        record.action === 'reserve' ? 'Reserved' : 'Borrowed'
                      }
                      color={
                        record.action === 'return' || record.returned || record.return_date ? 'success' : 
                        record.action === 'reserve' ? 'info' : 'warning'
                      }
                      size="small"
                      icon={
                        record.action === 'return' || record.returned || record.return_date ? <CheckCircle fontSize="small" /> : 
                        record.action === 'reserve' ? <AccessTime fontSize="small" /> : 
                        <Warning fontSize="small" />
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {!record.returned && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {record.action === 'borrow' && (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleReturnClick(record)}
                            startIcon={<ArrowBack />}
                          >
                            Return
                          </Button>
                        )}
                        {record.action === 'reserve' && (
                          <>
                            {user?.role === 'admin' && (
                              <Button
                                variant="outlined"
                                color="success"
                                size="small"
                                onClick={() => handleApproveClick(record)}
                                startIcon={<ThumbUp />}
                              >
                                Approve
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleCancelClick(record)}
                              startIcon={<Warning />}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <LibraryBooks sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {tabValue === 0 ? 'No current loans' : 
             tabValue === 1 ? 'No pending reservations' : 
             'No loan history'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tabValue === 0 
              ? 'You don\'t have any books currently borrowed. Visit the catalog to borrow books.'
              : tabValue === 1
              ? 'You don\'t have any pending reservation requests.'
              : 'Books you have borrowed and returned will appear here.'}
          </Typography>
        </Paper>
      )}
      
      {/* Return Book Dialog */}
      <Dialog
        open={returnDialogOpen}
        onClose={() => !processing && setReturnDialogOpen(false)}
      >
        <DialogTitle>Return Book</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <>
              <DialogContentText>
                Are you sure you want to return "{selectedRecord.title}"?
              </DialogContentText>
              {returnMessage.text && (
                <Alert 
                  severity={returnMessage.type} 
                  sx={{ mt: 2 }}
                >
                  {returnMessage.text}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReturnDialogOpen(false)} 
            disabled={processing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReturnBook} 
            color="primary" 
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <ArrowBack />}
          >
            {processing ? 'Processing...' : 'Return Book'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Cancel Reservation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => !processing && setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Reservation</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <>
              <DialogContentText>
                Are you sure you want to cancel your reservation for "{selectedRecord.title}"?
              </DialogContentText>
              {cancelMessage.text && (
                <Alert 
                  severity={cancelMessage.type} 
                  sx={{ mt: 2 }}
                >
                  {cancelMessage.text}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCancelDialogOpen(false)} 
            disabled={processing}
          >
            No, Keep Reservation
          </Button>
          <Button 
            onClick={handleCancelReservation} 
            color="error" 
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <Warning />}
          >
            {processing ? 'Processing...' : 'Yes, Cancel Reservation'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Approve Reservation Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => !processing && setApproveDialogOpen(false)}
      >
        <DialogTitle>Approve Reservation</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <>
              <DialogContentText>
                Are you sure you want to approve the reservation for "{selectedRecord.title}"?
                This will convert the reservation to a loan.
              </DialogContentText>
              {approveMessage.text && (
                <Alert 
                  severity={approveMessage.type} 
                  sx={{ mt: 2 }}
                >
                  {approveMessage.text}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setApproveDialogOpen(false)} 
            disabled={processing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApproveReservation} 
            color="success" 
            variant="contained"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <ThumbUp />}
          >
            Approve Reservation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Circulation;
