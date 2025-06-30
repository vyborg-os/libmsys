import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, CircularProgress, Chip, Dialog, 
  DialogActions, DialogContent, DialogContentText, DialogTitle, Alert
} from '@mui/material';
import { 
  CheckCircle, Cancel, Person, MenuBook, CalendarToday
} from '@mui/icons-material';
import { getCirculationRecords, approveReservation, cancelReservation } from '../../services/api';
import { useNotification } from '../Notification';

function ManageReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
  
  // Use the notification context
  const { showNotification } = useNotification();
  
  useEffect(() => {
    fetchReservations();
  }, []);
  
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await getCirculationRecords();
      // Filter only reservation records
      const reservationRecords = data.filter(record => record.action === 'reserve' && !record.returned);
      setReservations(reservationRecords);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleApproveClick = (reservation) => {
    setSelectedReservation(reservation);
    setApproveDialogOpen(true);
    setActionMessage({ text: '', type: '' });
  };
  
  const handleCancelClick = (reservation) => {
    setSelectedReservation(reservation);
    setCancelDialogOpen(true);
    setActionMessage({ text: '', type: '' });
  };
  
  const handleApproveReservation = async () => {
    if (!selectedReservation) return;
    
    try {
      setProcessing(true);
      await approveReservation(selectedReservation.id);
      
      // Remove the approved reservation from the list
      setReservations(prev => prev.filter(r => r.id !== selectedReservation.id));
      
      // Show success notification
      showNotification({
        title: 'Reservation Approved',
        message: `Successfully approved reservation for "${selectedReservation.title}" for ${selectedReservation.username}`,
        severity: 'success',
        autoHideDuration: 5000
      });
      
      // Set local action message for dialog
      setActionMessage({ 
        text: `Successfully approved reservation for "${selectedReservation.title}" for ${selectedReservation.username}`, 
        type: 'success' 
      });
      
      // Close dialog after a short delay
      setTimeout(() => {
        setApproveDialogOpen(false);
        setSelectedReservation(null);
      }, 1000);
    } catch (err) {
      console.error('Error approving reservation:', err);
      
      // Show error notification
      showNotification({
        title: 'Approval Failed',
        message: `Failed to approve reservation: ${err.response?.data?.message || 'Unknown error'}`,
        severity: 'error',
        autoHideDuration: 8000
      });
      
      // Set local action message for dialog
      setActionMessage({ 
        text: `Failed to approve reservation: ${err.response?.data?.message || 'Unknown error'}`, 
        type: 'error' 
      });
    } finally {
      setProcessing(false);
    }
  };
  
  const handleCancelReservation = async () => {
    if (!selectedReservation) return;
    
    try {
      setProcessing(true);
      
      // Make sure we're passing the correct ID
      const circulationId = parseInt(selectedReservation.id);
      
      // Check if the ID is valid
      if (isNaN(circulationId) || circulationId <= 0) {
        throw new Error(`Invalid circulation ID: ${selectedReservation.id}`);
      }
      
      const response = await cancelReservation(circulationId);
      
      // Remove the canceled reservation from the list
      setReservations(prev => prev.filter(r => r.id !== selectedReservation.id));
      
      // Show success notification
      showNotification({
        title: 'Reservation Canceled',
        message: `Successfully canceled reservation for "${selectedReservation.title}" for ${selectedReservation.username}`,
        severity: 'success',
        autoHideDuration: 5000
      });
      
      // Set local action message for dialog
      setActionMessage({ 
        text: `Successfully canceled reservation for "${selectedReservation.title}" for ${selectedReservation.username}`, 
        type: 'success' 
      });
      
      // Close dialog after a short delay
      setTimeout(() => {
        setCancelDialogOpen(false);
        setSelectedReservation(null);
      }, 1000);
    } catch (err) {
      console.error('Error canceling reservation:', err);
      
      // Show error notification
      showNotification({
        title: 'Cancellation Failed',
        message: `Failed to cancel reservation: ${err.message || 'Unknown error'}`,
        severity: 'error',
        autoHideDuration: 8000
      });
      
      // Set local action message for dialog
      setActionMessage({ 
        text: `Failed to cancel reservation: ${err.message || 'Unknown error'}`, 
        type: 'error' 
      });
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Manage Reservations
      </Typography>
      
      {actionMessage.text && (
        <Alert 
          severity={actionMessage.type} 
          sx={{ mb: 3 }}
          onClose={() => setActionMessage({ text: '', type: '' })}
        >
          {actionMessage.text}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : reservations.length > 0 ? (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Book</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Patron</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Reservation Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow key={reservation.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MenuBook sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">
                        {reservation.title || 'Unknown Book'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Person sx={{ mr: 1, color: 'secondary.main' }} />
                      <Typography variant="body2">
                        {reservation.username || 'Unknown User'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarToday fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      {formatDate(reservation.action_date)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarToday fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      {formatDate(reservation.due_date)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label="Pending"
                      color="info"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={() => handleApproveClick(reservation)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<Cancel />}
                        onClick={() => handleCancelClick(reservation)}
                      >
                        Reject
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No pending reservations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            All book reservations have been processed.
          </Typography>
        </Paper>
      )}
      
      {/* Approve Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => !processing && setApproveDialogOpen(false)}
      >
        <DialogTitle>Approve Reservation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve the reservation for "{selectedReservation?.title}" 
            by {selectedReservation?.username}?
          </DialogContentText>
          {actionMessage.text && (
            <Alert 
              severity={actionMessage.type} 
              sx={{ mt: 2 }}
            >
              {actionMessage.text}
            </Alert>
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
          >
            {processing ? <CircularProgress size={24} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => !processing && setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Reservation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel the reservation for "{selectedReservation?.title}" 
            by {selectedReservation?.username}?
          </DialogContentText>
          {actionMessage.text && (
            <Alert 
              severity={actionMessage.type} 
              sx={{ mt: 2 }}
            >
              {actionMessage.text}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCancelDialogOpen(false)} 
            disabled={processing}
          >
            No
          </Button>
          <Button 
            onClick={handleCancelReservation} 
            color="error" 
            variant="contained"
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ManageReservations;
