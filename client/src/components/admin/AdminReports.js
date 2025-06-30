import React, { useState, useEffect } from 'react';
import {
  Typography, Box, Paper, Grid, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Snackbar, Alert, CircularProgress, Chip,
  InputAdornment
} from '@mui/material';
import {
  Assessment, TrendingUp, Timer, Refresh, CheckCircle, Warning
} from '@mui/icons-material';
import { getCirculationReport, getPopularBooksReport, getOverdueReport } from '../../services/api';

function AdminReports() {
  const [loading, setLoading] = useState({
    circulation: true,
    popular: true,
    overdue: true
  });
  const [error, setError] = useState(null);
  const [circulationData, setCirculationData] = useState([]);
  const [popularBooksData, setPopularBooksData] = useState([]);
  const [overdueData, setOverdueData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Check if user is admin on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('lmsUser'));
    if (!user || user.role !== 'admin') {
      // Redirect non-admin users
      window.location.href = '/dashboard';
    } else {
      fetchReports();
    }
  }, []);

  const fetchReports = async () => {
    try {
      // Fetch circulation report
      setLoading(prev => ({ ...prev, circulation: true }));
      const circulationReport = await getCirculationReport(dateRange.startDate, dateRange.endDate);
      setCirculationData(circulationReport);
      setLoading(prev => ({ ...prev, circulation: false }));

      // Fetch popular books report
      setLoading(prev => ({ ...prev, popular: true }));
      const popularBooks = await getPopularBooksReport();
      setPopularBooksData(popularBooks);
      setLoading(prev => ({ ...prev, popular: false }));

      // Fetch overdue report
      setLoading(prev => ({ ...prev, overdue: true }));
      const overdue = await getOverdueReport();
      setOverdueData(overdue);
      setLoading(prev => ({ ...prev, overdue: false }));
      
      showNotification('Reports updated successfully', 'success');
    } catch (err) {
      setError('Failed to load reports. Please try again later.');
      showNotification('Failed to load reports', 'error');
      console.error('Error fetching reports:', err);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRefresh = () => {
    fetchReports();
  };

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleRefresh}
          sx={{ mt: 2 }}
          startIcon={<Refresh />}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <Assessment sx={{ mr: 1 }} /> Library Reports and Statistics
      </Typography>

      {/* Date Range Selector */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Select Date Range for Reports
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="Start Date"
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="End Date"
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRefresh}
              startIcon={<Refresh />}
              fullWidth
            >
              Update Reports
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        {/* Circulation Report */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Assessment sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">Circulation Activity</Typography>
            </Box>
            {loading.circulation ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : circulationData.length > 0 ? (
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {circulationData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={item.action} 
                            size="small"
                            color={item.action === 'borrow' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No circulation data available for the selected date range.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Popular Books Report */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">Most Popular Books</Typography>
            </Box>
            {loading.popular ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : popularBooksData.length > 0 ? (
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>Borrows</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {popularBooksData.map((book, index) => (
                      <TableRow key={index}>
                        <TableCell>{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>
                          <Chip 
                            label={book.borrow_count} 
                            size="small"
                            color="primary"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No popular books data available.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Overdue Books Report */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Timer sx={{ color: 'error.main', mr: 1 }} />
              <Typography variant="h6">Overdue Books</Typography>
            </Box>
            {loading.overdue ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : overdueData.length > 0 ? (
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Book Title</TableCell>
                      <TableCell>Patron</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Days Overdue</TableCell>
                      <TableCell>Fine Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {overdueData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.book_title}</TableCell>
                        <TableCell>{item.username}</TableCell>
                        <TableCell>{new Date(item.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={item.days_overdue} 
                            size="small"
                            color={item.days_overdue > 7 ? 'error' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>${item.fine_amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No overdue books at this time.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          icon={notification.severity === 'success' ? <CheckCircle /> : <Warning />}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminReports;
