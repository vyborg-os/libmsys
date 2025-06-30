import React from 'react';
import {
  Box, Card, CardContent, CardMedia, Typography, Chip, Grid, Divider,
  Paper, Table, TableBody, TableCell, TableContainer, TableRow
} from '@mui/material';
import {
  Category, MenuBook, CalendarToday, Person, Bookmark,
  LocalLibrary, Inventory2, LocationOn
} from '@mui/icons-material';

/**
 * BookDetails component for displaying detailed information about a book
 * @param {Object} props.book - The book object containing all book details
 * @param {boolean} props.showInventory - Whether to show inventory information (admin only)
 */
const BookDetails = ({ book, showInventory = false }) => {
  // Default cover image if none provided
  const coverImage = book.cover_image || 'https://via.placeholder.com/200x300?text=No+Cover+Available';
  
  return (
    <Card elevation={3}>
      <Grid container>
        {/* Book Cover */}
        <Grid item xs={12} sm={4} md={3}>
          <CardMedia
            component="img"
            image={coverImage}
            alt={book.title}
            sx={{
              height: 300,
              objectFit: 'contain',
              p: 2
            }}
          />
        </Grid>
        
        {/* Book Details */}
        <Grid item xs={12} sm={8} md={9}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              {book.title}
            </Typography>
            
            <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Person sx={{ mr: 1 }} /> {book.author}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {book.category && (
                <Chip 
                  icon={<Category />} 
                  label={book.category} 
                  color="primary" 
                  size="small" 
                  variant="outlined"
                />
              )}
              {book.published_year && (
                <Chip 
                  icon={<CalendarToday />} 
                  label={`Published: ${book.published_year}`} 
                  size="small" 
                  variant="outlined"
                />
              )}
              {book.publisher && (
                <Chip 
                  icon={<LocalLibrary />} 
                  label={book.publisher} 
                  size="small" 
                  variant="outlined"
                />
              )}
              {book.shelf && (
                <Chip 
                  icon={<LocationOn />} 
                  label={`Shelf: ${book.shelf}`} 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Description */}
            {book.description && (
              <>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" paragraph>
                  {book.description}
                </Typography>
                <Divider sx={{ my: 2 }} />
              </>
            )}
            
            {/* Book Details Table */}
            <Typography variant="h6" gutterBottom>
              Book Details
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ width: '30%', fontWeight: 'bold' }}>
                      ISBN
                    </TableCell>
                    <TableCell>{book.isbn}</TableCell>
                  </TableRow>
                  {book.publisher && (
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        Publisher
                      </TableCell>
                      <TableCell>{book.publisher}</TableCell>
                    </TableRow>
                  )}
                  {book.published_year && (
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        Published Year
                      </TableCell>
                      <TableCell>{book.published_year}</TableCell>
                    </TableRow>
                  )}
                  {book.category && (
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        Category
                      </TableCell>
                      <TableCell>{book.category}</TableCell>
                    </TableRow>
                  )}
                  {book.shelf && (
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        Shelf Location
                      </TableCell>
                      <TableCell>{book.shelf}</TableCell>
                    </TableRow>
                  )}
                  {showInventory && (
                    <>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                          Total Copies
                        </TableCell>
                        <TableCell>{book.total_copies}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                          Available Copies
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={book.available_copies} 
                            color={book.available_copies > 0 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                          Quantity
                        </TableCell>
                        <TableCell>{book.quantity}</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  );
};

export default BookDetails;
