import React, { useState, useEffect } from 'react';
import {
  Typography, Box, Paper, Grid, TextField, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Snackbar, Alert, CircularProgress, Chip, Tooltip,
  InputAdornment, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Book, MenuBook,
  Save, Cancel, Refresh, CheckCircle, Warning, Category, Bookmarks
} from '@mui/icons-material';
import { getBooks, addBook, updateBook, deleteBook } from '../../services/api';

function ManageBooks() {
  const [books, setBooks] = useState([]);
  const [bookDialog, setBookDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBook, setCurrentBook] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    quantity: 1,
    shelf: '',
    description: '',
    published_year: '',
    publisher: '',
    cover_image: '',
    total_copies: 1,
    available_copies: 1
  });
  
  // Predefined book categories for dropdown
  const bookCategories = [
    'Fiction',
    'Non-Fiction',
    'Science Fiction',
    'Fantasy',
    'Mystery',
    'Thriller',
    'Romance',
    'Biography',
    'History',
    'Science',
    'Technology',
    'Self-Help',
    'Children',
    'Young Adult',
    'Poetry',
    'Reference',
    'Textbook',
    'Other'
  ];
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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
      fetchBooks();
    }
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await getBooks();
      setBooks(data);
    } catch (error) {
      console.error('Error fetching books:', error);
      showNotification('Failed to load books', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setCurrentBook({
      title: '',
      author: '',
      isbn: '',
      category: '',
      quantity: 1,
      shelf: '',
      description: '',
      published_year: '',
      publisher: '',
      cover_image: '',
      total_copies: 1,
      available_copies: 1
    });
    setIsEditing(false);
    setBookDialog(true);
  };

  const handleOpenEditDialog = (book) => {
    setCurrentBook({ ...book });
    setIsEditing(true);
    setBookDialog(true);
  };

  const handleOpenDeleteDialog = (book) => {
    setCurrentBook(book);
    setDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setBookDialog(false);
    setDeleteDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentBook(prev => ({
      ...prev,
      [name]: ['quantity', 'total_copies', 'available_copies', 'published_year'].includes(name) 
        ? (parseInt(value, 10) || 0) 
        : value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSaveBook = async () => {
    try {
      // Basic validation
      if (!currentBook.title || !currentBook.author || !currentBook.isbn) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }

      // Ensure ISBN is valid format
      if (!/^\d{10,13}$/.test(currentBook.isbn.replace(/-/g, ''))) {
        showNotification('ISBN must be 10 or 13 digits', 'error');
        return;
      }

      // Prepare book data with synchronized quantity and copies
      const bookData = {
        ...currentBook,
        // Ensure quantity matches total_copies if not explicitly set differently
        quantity: currentBook.quantity || currentBook.total_copies || 1,
        // Ensure total_copies is at least equal to quantity
        total_copies: Math.max(currentBook.total_copies || 0, currentBook.quantity || 1),
        // Ensure available_copies doesn't exceed total_copies
        available_copies: Math.min(
          currentBook.available_copies || 0, 
          currentBook.total_copies || currentBook.quantity || 1
        )
      };

      if (isEditing) {
        await updateBook(currentBook.id, bookData);
        showNotification('Book updated successfully', 'success');
      } else {
        await addBook(bookData);
        showNotification('Book added successfully', 'success');
      }
      
      handleCloseDialog();
      fetchBooks();
    } catch (error) {
      console.error('Error saving book:', error);
      showNotification(error.response?.data?.message || error.message || 'Failed to save book', 'error');
    }
  };

  const handleDeleteBook = async () => {
    try {
      await deleteBook(currentBook.id);
      showNotification('Book deleted successfully', 'success');
      handleCloseDialog();
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      showNotification('Failed to delete book', 'error');
    }
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

  // Filter books based on search term
  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <MenuBook sx={{ mr: 1 }} /> Manage Books
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search books by title, author, ISBN or category..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleOpenAddDialog}
            >
              Add New Book
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>ISBN</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Available</TableCell>
                <TableCell>Shelf</TableCell>
                <TableCell>Publisher</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.isbn}</TableCell>
                    <TableCell>
                      <Chip 
                        label={book.category || 'Uncategorized'} 
                        size="small" 
                        color={book.category ? 'primary' : 'default'}
                        icon={<Category fontSize="small" />}
                      />
                    </TableCell>
                    <TableCell>{book.quantity}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${book.available_copies}/${book.total_copies}`} 
                        size="small" 
                        color={book.available_copies > 0 ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{book.shelf || '-'}</TableCell>
                    <TableCell>{book.publisher || '-'}</TableCell>
                    <TableCell>{book.published_year || '-'}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenEditDialog(book)}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          color="error" 
                          onClick={() => handleOpenDeleteDialog(book)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    {searchTerm ? 'No books match your search' : 'No books available'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Book Dialog */}
      <Dialog open={bookDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Bookmarks sx={{ mr: 1 }} />
            {isEditing ? 'Edit Book' : 'Add New Book'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={currentBook.title}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ISBN"
                name="isbn"
                value={currentBook.isbn}
                onChange={handleInputChange}
                required
                helperText="Unique identifier"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Author"
                name="author"
                value={currentBook.author}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={currentBook.category}
                  onChange={handleInputChange}
                  label="Category"
                  startAdornment={
                    <InputAdornment position="start">
                      <Category fontSize="small" />
                    </InputAdornment>
                  }
                >
                  {bookCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Publishing Information */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Publishing Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Publisher"
                name="publisher"
                value={currentBook.publisher}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Published Year"
                name="published_year"
                type="number"
                value={currentBook.published_year}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 1000, max: new Date().getFullYear() } }}
              />
            </Grid>

            {/* Inventory Information */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Inventory Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={currentBook.quantity}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 1 } }}
                required
                helperText="Number of copies"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Total Copies"
                name="total_copies"
                type="number"
                value={currentBook.total_copies}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 1 } }}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Available Copies"
                name="available_copies"
                type="number"
                value={currentBook.available_copies}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Shelf Location"
                name="shelf"
                value={currentBook.shelf}
                onChange={handleInputChange}
                helperText="e.g., A1, B2, etc."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cover Image URL"
                name="cover_image"
                value={currentBook.cover_image}
                onChange={handleInputChange}
                helperText="URL to book cover image"
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Additional Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={currentBook.description}
                onChange={handleInputChange}
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog} 
            startIcon={<Cancel />}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveBook} 
            variant="contained" 
            color="primary"
            startIcon={<Save />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the book "{currentBook.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog} 
            startIcon={<Cancel />}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteBook} 
            variant="contained" 
            color="error"
            startIcon={<Delete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

export default ManageBooks;
