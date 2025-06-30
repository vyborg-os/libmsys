import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, Box, Grid, Card, CardContent, CardMedia, CardActions,
  TextField, InputAdornment, IconButton, Button, Chip, Divider,
  CircularProgress, Pagination, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Rating, Paper, Tooltip
} from '@mui/material';
import { 
  Search, MenuBook, Person, Category, CalendarToday,
  Bookmark, BookmarkBorder, Close, Info, CheckCircle, Visibility,
  AccessTime
} from '@mui/icons-material';
import { getBooks, reserveBook } from '../services/api';

function Catalog() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedBook, setSelectedBook] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const [borrowMessage, setBorrowMessage] = useState('');
  const [borrowSuccess, setBorrowSuccess] = useState(false);
  
  const booksPerPage = 6;
  
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const data = await getBooks();
        setBooks(data);
        setFilteredBooks(data);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Failed to load books. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooks();
  }, []);
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBooks(books);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = books.filter(book => 
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.isbn.toLowerCase().includes(term) ||
        book.genre.toLowerCase().includes(term)
      );
      setFilteredBooks(filtered);
    }
    setPage(1); // Reset to first page when search changes
  }, [searchTerm, books]);
  
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  const handleBookClick = (book) => {
    setSelectedBook(book);
    setDialogOpen(true);
    setBorrowMessage('');
    setBorrowSuccess(false);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  const handleReserveBook = async () => {
    if (!selectedBook) return;
    
    try {
      setBorrowing(true);
      // We'll redirect to the ViewBook component for reservation with due date selection
      navigate(`/books/${selectedBook.id}`);
      setDialogOpen(false);
      
    } catch (err) {
      console.error('Error navigating to book details:', err);
      setBorrowSuccess(false);
      setBorrowMessage('Failed to navigate to book details. Please try again.');
      setBorrowing(false);
    }
  };
  
  // Calculate pagination
  const indexOfLastBook = page * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  
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
    <Box sx={{ width: '100%', pb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ 
        fontWeight: 'bold',
        color: 'primary.main',
        borderBottom: '2px solid',
        borderColor: 'primary.main',
        pb: 1,
        mb: 3
      }}>
        Library Catalog
      </Typography>
      
      {/* Search Bar */}
      <Paper elevation={2} sx={{ p: 2, mb: 4, borderRadius: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by title, author, ISBN, or genre..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="primary" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchTerm('')}>
                  <Close fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ bgcolor: 'background.paper' }}
        />
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} found
          </Typography>
        </Box>
      </Paper>
      
      {/* Book Grid */}
      {currentBooks.length > 0 ? (
        <Grid container spacing={3}>
          {currentBooks.map((book) => (
            <Grid item xs={12} sm={6} md={4} key={book.id}>
              <Card 
                elevation={3} 
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                  }
                }}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: 200,
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MenuBook sx={{ fontSize: 80, color: 'white' }} />
                </CardMedia>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div" noWrap>
                    {book.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Person fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {book.author}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Category fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {book.category || 'Uncategorized'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {book.published_year || 'Unknown'}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={book.available_copies > 0 ? 'Available' : 'Reserved/Borrowed'}
                      color={book.available_copies > 0 ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                      icon={book.available_copies > 0 ? <CheckCircle fontSize="small" /> : <AccessTime fontSize="small" />}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {book.available_copies} of {book.total_copies} left
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => navigate(`/books/${book.id}`)}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained" 
                    color="primary"
                    disabled={book.available_copies <= 0}
                    onClick={() => handleBookClick(book)}
                  >
                    Reserve
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <MenuBook sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No books found matching your search
          </Typography>
          {searchTerm && (
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }}
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </Button>
          )}
        </Box>
      )}
      
      {/* Pagination */}
      {filteredBooks.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
            size="large"
            showFirstButton 
            showLastButton
          />
        </Box>
      )}
      
      {/* Reserve Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !borrowing && setDialogOpen(false)}
        aria-labelledby="reserve-dialog-title"
      >
        <DialogTitle id="reserve-dialog-title">
          Reserve Book
          <IconButton
            aria-label="close"
            onClick={() => setDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            disabled={borrowing}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedBook && (
            <>
              <DialogContentText>
                You're about to reserve "{selectedBook.title}". Would you like to proceed to select a due date?
              </DialogContentText>
              
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <MenuBook sx={{ mr: 1 }} />
                <Typography variant="body1">{selectedBook.title}</Typography>
              </Box>
              
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1 }} />
                <Typography variant="body2">{selectedBook.author}</Typography>
              </Box>
              
              <Box sx={{ mt: 2, bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> After reserving, an admin will need to approve your request before you can borrow the book.
                </Typography>
              </Box>
              
              {borrowMessage && (
                <Box sx={{ mt: 2 }}>
                  <Typography 
                    color={borrowSuccess ? 'success.main' : 'error.main'}
                    variant="body2"
                  >
                    {borrowMessage}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDialogOpen(false)} 
            disabled={borrowing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReserveBook} 
            color="primary" 
            variant="contained"
            disabled={borrowing}
            startIcon={borrowing ? <CircularProgress size={20} /> : null}
          >
            {borrowing ? 'Processing...' : 'Continue'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Catalog;
