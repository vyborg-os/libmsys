import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, CircularProgress, Chip, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Tabs, Tab,
  InputAdornment
} from '@mui/material';
import { 
  History as HistoryIcon, 
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { getCirculationRecords } from '../../services/api';
import { useNotification } from '../Notification';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`borrowing-tabpanel-${index}`}
      aria-labelledby={`borrowing-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function BorrowingHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({
    username: '',
    bookTitle: '',
    status: 'all',
    startDate: null,
    endDate: null
  });
  
  // Use the notification context
  const { showNotification } = useNotification();
  
  useEffect(() => {
    fetchCirculationRecords();
  }, []);
  
  const fetchCirculationRecords = async () => {
    try {
      setLoading(true);
      const data = await getCirculationRecords();
      console.log('Raw circulation records:', data);
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from API');
      }
      
      // Log the structure of the first few records to understand the data format
      if (data.length > 0) {
        console.log('Sample record structure:', JSON.stringify(data[0], null, 2));
      }
      
      // Process and enhance the records with additional information
      // First, organize records by book_id to link borrow and return records
      const bookRecords = {};
      
      // Group records by book_id
      data.forEach(record => {
        if (!bookRecords[record.book_id]) {
          bookRecords[record.book_id] = [];
        }
        bookRecords[record.book_id].push(record);
      });
      
      // Process each book's records to create complete circulation history
      const processedRecords = [];
      
      Object.values(bookRecords).forEach(records => {
        // Find borrow records
        const borrowRecords = records.filter(r => r.action === 'borrow');
        // Find return records
        const returnRecords = records.filter(r => r.action === 'return');
        
        // Process each borrow record
        borrowRecords.forEach(borrowRecord => {
          // Find a matching return record (if any)
          const returnRecord = returnRecords.find(r => 
            r.book_id === borrowRecord.book_id && 
            new Date(r.action_date) > new Date(borrowRecord.action_date)
          );
          
          // Create a complete record with borrow and return information
          const completeRecord = {
            ...borrowRecord,
            borrow_date: borrowRecord.action_date || borrowRecord.created_at,
            returned: returnRecord ? true : false,
            return_date: returnRecord ? returnRecord.action_date : null,
            status: returnRecord ? 'returned' : 'borrowed'
          };
          
          processedRecords.push(completeRecord);
        });
      });
      
      console.log('Processed records:', processedRecords);
      
      // Map the processed records to include all necessary information
      const borrowRecords = processedRecords.map(record => {
        // Debug the record structure
        console.log('Processing record:', JSON.stringify(record));
        
        // Ensure created_at is a valid date string
        let created_at = record.action_date || record.created_at;
        
        // Handle N/A or missing created_at values
        if (!created_at || created_at === 'N/A' || created_at === 'null') {
          // Try all possible date fields in order of preference
          created_at = record.borrow_date || 
                     record.borrowDate || 
                     record.reservation_date || 
                     record.date || 
                     new Date().toISOString();
          
          console.log(`Fixed created_at for record ${record.id}: ${created_at}`);
        }
          
          // Ensure all records have consistent properties
          return {
            ...record,
            id: record.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
            username: record.username || record.user?.username || 'Unknown User',
            title: record.title || record.book?.title || 'Unknown Book',
            created_at: created_at,
            return_date: record.returned ? record.return_date : null,
            book_id: record.book_id || record.book?.id || record.bookId || null
          };
        });
      
      console.log('Processed borrowing records:', borrowRecords);
      setRecords(borrowRecords);
      
      showNotification({
        title: 'Records Loaded',
        message: `Successfully loaded ${borrowRecords.length} borrowing records`,
        severity: 'success',
        autoHideDuration: 3000
      });
    } catch (err) {
      console.error('Error fetching circulation records:', err);
      setError('Failed to load borrowing history. Please try again.');
      
      showNotification({
        title: 'Error',
        message: 'Failed to load borrowing history: ' + (err.message || 'Unknown error'),
        severity: 'error',
        autoHideDuration: 5000
      });
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return '-';
    }
  };
  
  const calculateDueDate = (borrowDate) => {
    if (!borrowDate || borrowDate === 'N/A') return null;
    
    try {
      const date = new Date(borrowDate);
      if (isNaN(date.getTime())) return null;
      
      // Add 14 days to the borrow date (standard borrowing period)
      const dueDate = new Date(date);
      dueDate.setDate(date.getDate() + 14);
      
      return dueDate;
    } catch (error) {
      console.error('Error calculating due date:', error, borrowDate);
      return null;
    }
  };
  
  const isOverdue = (borrowDate, returnDate) => {
    // If the book has been returned, it's not overdue
    if (returnDate) return false;
    
    try {
      const dueDate = calculateDueDate(borrowDate);
      if (!dueDate) return false;
      
      const today = new Date();
      return today > dueDate;
    } catch (error) {
      console.error('Error checking overdue status:', error);
      return false;
    }
  };
  
  const getDaysRemaining = (borrowDate, returnDate) => {
    // If the book has been returned, no days remaining
    if (returnDate) return 0;
    
    try {
      const dueDate = calculateDueDate(borrowDate);
      if (!dueDate) return 0;
      
      const today = new Date();
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Ensure we return a valid number
      if (isNaN(diffDays)) {
        console.warn('Invalid days calculation for borrow date:', borrowDate);
        return 0;
      }
      
      return diffDays;
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return 0;
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      username: '',
      bookTitle: '',
      status: 'all',
      startDate: null,
      endDate: null
    });
    
    showNotification({
      title: 'Filters Reset',
      message: 'All filters have been cleared',
      severity: 'info',
      autoHideDuration: 2000
    });
  };
  
  // Apply filters to records
  const filteredRecords = records.filter(record => {
    // Skip records with invalid data
    if (!record || !record.username || !record.title) {
      return false;
    }
    
    // Filter by username
    if (filters.username && !record.username.toLowerCase().includes(filters.username.toLowerCase())) {
      return false;
    }
    
    // Filter by book title
    if (filters.bookTitle && !record.title.toLowerCase().includes(filters.bookTitle.toLowerCase())) {
      return false;
    }
    
    // Filter by status
    if (filters.status === 'returned' && !record.returned) {
      return false;
    }
    if (filters.status === 'borrowed' && record.returned) {
      return false;
    }
    if (filters.status === 'overdue' && (!isOverdue(record.created_at, record.return_date))) {
      return false;
    }
    
    // Filter by date range - handle with careful validation
    try {
      const recordDate = new Date(record.created_at);
      
      // Check if record date is valid
      if (isNaN(recordDate.getTime())) {
        return false;
      }
      
      // Filter by start date if provided and valid
      if (filters.startDate && !isNaN(filters.startDate.getTime())) {
        if (recordDate < filters.startDate) {
          return false;
        }
      }
      
      // Filter by end date if provided and valid
      if (filters.endDate && !isNaN(filters.endDate.getTime())) {
        const endDateWithTime = new Date(filters.endDate);
        endDateWithTime.setHours(23, 59, 59);
        if (recordDate > endDateWithTime) {
          return false;
        }
      }
    } catch (err) {
      console.error('Error filtering by date:', err);
      // If there's an error with date comparison, include the record by default
    }
    
    return true;
  });
  
  // Get all records, borrowed (not returned) records, and overdue records
  const allRecords = filteredRecords;
  const borrowedRecords = filteredRecords.filter(record => !record.returned);
  const overdueRecords = filteredRecords.filter(record => isOverdue(record.created_at, record.return_date));
  
  // Render the filter section
  const renderFilters = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            size="small"
            value={filters.username}
            onChange={(e) => handleFilterChange('username', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Book Title"
            variant="outlined"
            fullWidth
            size="small"
            value={filters.bookTitle}
            onChange={(e) => handleFilterChange('bookTitle', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="borrowed">Borrowed</MenuItem>
              <MenuItem value="returned">Returned</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            label="From Date"
            type="date"
            fullWidth
            size="small"
            value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : null;
              handleFilterChange('startDate', date);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            label="To Date"
            type="date"
            fullWidth
            size="small"
            value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : null;
              handleFilterChange('endDate', date);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button 
            variant="outlined" 
            onClick={resetFilters}
            sx={{ mr: 1 }}
          >
            Reset Filters
          </Button>
          <Button 
            variant="contained" 
            onClick={fetchCirculationRecords}
          >
            Refresh Data
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
  
  // Render the records table
  const renderRecordsTable = (records) => (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="borrowing history table">
        <TableHead>
          <TableRow sx={{ bgcolor: 'primary.main' }}>
            <TableCell sx={{ color: 'white' }}>User</TableCell>
            <TableCell sx={{ color: 'white' }}>Book</TableCell>
            <TableCell sx={{ color: 'white' }}>Borrow Date</TableCell>
            <TableCell sx={{ color: 'white' }}>Due Date</TableCell>
            <TableCell sx={{ color: 'white' }}>Return Date</TableCell>
            <TableCell sx={{ color: 'white' }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.length > 0 ? (
            records.map((record) => {
              // Use the correct borrow date field for calculations
              const borrowDate = record.borrow_date || record.action_date || record.created_at;
              const dueDate = calculateDueDate(borrowDate);
              const daysRemaining = getDaysRemaining(borrowDate, record.return_date);
              const overdue = isOverdue(borrowDate, record.return_date);
              
              return (
                <TableRow key={record.id || Math.random()} hover>
                  <TableCell>{record.username || 'Unknown User'}</TableCell>
                  <TableCell>{record.title || 'Unknown Book'}</TableCell>
                  <TableCell>{formatDate(record.borrow_date || record.action_date || record.created_at)}</TableCell>
                  <TableCell>{dueDate ? formatDate(dueDate) : '-'}</TableCell>
                  <TableCell>{record.returned || record.return_date ? formatDate(record.return_date) : '-'}</TableCell>
                  <TableCell>
                    {record.returned ? (
                      <Chip 
                        icon={<CheckCircleIcon />} 
                        label="Returned" 
                        color="success" 
                        size="small" 
                      />
                    ) : overdue ? (
                      <Chip 
                        icon={<WarningIcon />} 
                        label={`Overdue by ${Math.abs(daysRemaining)} days`} 
                        color="error" 
                        size="small" 
                      />
                    ) : (
                      <Chip 
                        icon={<AccessTimeIcon />} 
                        label={`${daysRemaining} days remaining`} 
                        color="primary" 
                        size="small" 
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No records found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <HistoryIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Borrowing History
        </Typography>
      </Box>
      
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Track and manage all book borrowing activities
      </Typography>
      
      {renderFilters()}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="borrowing history tabs">
              <Tab 
                label={`All Records (${allRecords.length})`} 
                id="borrowing-tab-0" 
                aria-controls="borrowing-tabpanel-0" 
              />
              <Tab 
                label={`Currently Borrowed (${borrowedRecords.length})`} 
                id="borrowing-tab-1" 
                aria-controls="borrowing-tabpanel-1" 
              />
              <Tab 
                label={`Overdue (${overdueRecords.length})`} 
                id="borrowing-tab-2" 
                aria-controls="borrowing-tabpanel-2" 
              />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            {renderRecordsTable(allRecords)}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {renderRecordsTable(borrowedRecords)}
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            {renderRecordsTable(overdueRecords)}
          </TabPanel>
        </>
      )}
    </Box>
  );
}

export default BorrowingHistory;
