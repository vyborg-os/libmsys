const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const Pusher = require('pusher');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
// Configure CORS to allow requests from any origin
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    console.log('Authenticated user:', decoded.username, 'Role:', decoded.role);
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    
    // For development purposes only - allow a special test token
    if (process.env.NODE_ENV !== 'production' && token === 'test_token') {
      console.log('Using test token for development');
      req.user = {
        id: 1,
        username: 'admin',
        role: 'admin'
      };
      return next();
    }
    
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,  // Required for Neon and many cloud DBs
  },
});

// Pusher configuration
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// In-memory storage for development when database is not available
let inMemoryUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password_hash: '$2a$10$rrm7gFHPxZWi59B1RaEcR.fnNtlvmj6Oq0AkuYpFwOJvZVByJbiWi', // 'password'
    role: 'admin',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    username: 'user1',
    email: 'user1@example.com',
    password_hash: '$2a$10$rrm7gFHPxZWi59B1RaEcR.fnNtlvmj6Oq0AkuYpFwOJvZVByJbiWi', // 'password'
    role: 'patron',
    created_at: new Date().toISOString()
  }
];

// Initialize in-memory circulation records
global.inMemoryCirculation = [];

// Helper function to delete a circulation record
const deleteCirculationRecord = async (id, client = pool) => {
  const query = 'DELETE FROM circulation WHERE id = $1 RETURNING *';
  const result = await client.query(query, [id]);
  return result.rows[0];
};

let inMemoryBooks = [
  {
    id: 1,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '9780743273565',
    total_copies: 5,
    available_copies: 4,
    quantity: 5,
    shelf: 'A1',
    category: 'Fiction',
    description: 'A novel by F. Scott Fitzgerald that follows a cast of characters living in the fictional town of West Egg.',
    published_year: 1925,
    publisher: 'Charles Scribner\'s Sons',
    cover_image: 'https://example.com/great-gatsby.jpg',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '9780061120084',
    total_copies: 3,
    available_copies: 3,
    quantity: 3,
    shelf: 'B2',
    category: 'Classic',
    description: 'The story of racial injustice and the destruction of innocence in a small Southern town.',
    published_year: 1960,
    publisher: 'J. B. Lippincott & Co.',
    cover_image: 'https://example.com/mockingbird.jpg',
    created_at: new Date().toISOString()
  }
];

let dbConnected = false;

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
    console.log('Make sure PostgreSQL is running and the database credentials are correct.');
    console.log('Using in-memory storage for data as a fallback.');
    dbConnected = false;
  } else {
    console.log('Database connected at:', res.rows[0].now);
    dbConnected = true;
  }
});

// API routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Library Management System API' });
});

// Dashboard statistics endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    if (dbConnected) {
      // Get books statistics
      const booksStats = await pool.query(
        'SELECT COUNT(*) as total_books, SUM(available_copies) as available_books FROM books'
      );
      
      // Get circulation statistics
      const circulationStats = await pool.query(
        "SELECT COUNT(*) as borrowed_books FROM circulation WHERE action = 'borrow' AND returned = false"
      );
      
      // Get recent notifications
      const notifications = await pool.query(
        'SELECT id, title, message, created_at FROM notifications ORDER BY created_at DESC LIMIT 5'
      );
      
      res.json({
        totalBooks: parseInt(booksStats.rows[0].total_books) || 0,
        availableBooks: parseInt(booksStats.rows[0].available_books) || 0,
        borrowedBooks: parseInt(circulationStats.rows[0].borrowed_books) || 0,
        notifications: notifications.rows.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          date: n.created_at
        }))
      });
    } else {
      // Return mock data if database is not connected
      res.json({
        totalBooks: 125,
        availableBooks: 98,
        borrowedBooks: 27,
        notifications: [
          { id: 1, title: 'Welcome', message: 'Welcome to the Library Management System!', date: new Date() },
          { id: 2, title: 'New Books', message: 'New books added to the catalog.', date: new Date() },
          { id: 3, title: 'Account Setup', message: 'Your account has been set up successfully.', date: new Date() }
        ]
      });
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// Books endpoints
app.get('/api/books', async (req, res) => {
  try {
    if (dbConnected) {
      const result = await pool.query('SELECT * FROM books ORDER BY title');
      res.json(result.rows);
    } else {
      // Return in-memory books if database is not connected
      res.json(inMemoryBooks);
    }
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Error fetching books' });
  }
});

// Get a specific book by ID
app.get('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (dbConnected) {
      const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      res.json(result.rows[0]);
    } else {
      // Mock data for development
      const mockBooks = [
        { 
          id: 1, 
          title: 'To Kill a Mockingbird', 
          author: 'Harper Lee', 
          isbn: '9780061120084', 
          total_copies: 5, 
          available_copies: 3,
          quantity: 5,
          shelf: 'A1',
          category: 'Fiction',
          description: 'To Kill a Mockingbird is a novel by Harper Lee published in 1960. It was immediately successful, winning the Pulitzer Prize, and has become a classic of modern American literature.',
          published_year: 1960,
          publisher: 'J. B. Lippincott & Co.',
          cover_image: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/To_Kill_a_Mockingbird_%28first_edition_cover%29.jpg'
        },
        { 
          id: 2, 
          title: '1984', 
          author: 'George Orwell', 
          isbn: '9780451524935', 
          total_copies: 7, 
          available_copies: 5,
          quantity: 7,
          shelf: 'B2',
          category: 'Science Fiction',
          description: '1984 is a dystopian novel by George Orwell published in 1949. The novel is set in Airstrip One, a province of the superstate Oceania in a world of perpetual war, omnipresent government surveillance, and public manipulation.',
          published_year: 1949,
          publisher: 'Secker & Warburg',
          cover_image: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/1984first.jpg'
        },
        { 
          id: 3, 
          title: 'The Great Gatsby', 
          author: 'F. Scott Fitzgerald', 
          isbn: '9780743273565', 
          total_copies: 4, 
          available_copies: 2,
          quantity: 4,
          shelf: 'C3',
          category: 'Classic',
          description: 'The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald. Set in the Jazz Age on Long Island, the novel depicts narrator Nick Carraway\'s interactions with mysterious millionaire Jay Gatsby and Gatsby\'s obsession to reunite with his former lover, Daisy Buchanan.',
          published_year: 1925,
          publisher: 'Charles Scribner\'s Sons',
          cover_image: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/The_Great_Gatsby_Cover_1925_Retouched.jpg'
        }
      ];
      
      const book = mockBooks.find(b => b.id === parseInt(id));
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      res.json(book);
    }
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ message: 'Error fetching book' });
  }
});

// Add a new book (Admin only)
app.post('/api/books', async (req, res) => {
  try {
    // Verify admin role (middleware would be better in production)
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { 
      title, author, isbn, total_copies, available_copies, 
      quantity, shelf, category, description, 
      published_year, publisher, cover_image 
    } = req.body;
    
    // Validate required fields
    if (!title || !author || !isbn) {
      return res.status(400).json({ message: 'Title, author and ISBN are required' });
    }
    
    if (dbConnected) {
      // Check if ISBN already exists
      const existingBook = await pool.query('SELECT * FROM books WHERE isbn = $1', [isbn]);
      
      if (existingBook.rows.length > 0) {
        return res.status(400).json({ message: 'A book with this ISBN already exists' });
      }
      
      // Add the new book with all fields
      const result = await pool.query(
        `INSERT INTO books (
          title, author, isbn, total_copies, available_copies, 
          quantity, shelf, category, description, 
          published_year, publisher, cover_image
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          title, author, isbn, 
          total_copies || 1, 
          available_copies || total_copies || 1,
          quantity || 1,
          shelf || null,
          category || null,
          description || null,
          published_year || null,
          publisher || null,
          cover_image || null
        ]
      );
      
      res.status(201).json(result.rows[0]);
    } else {
      // Check if ISBN already exists in in-memory books
      const existingBook = inMemoryBooks.find(book => book.isbn === isbn);
      
      if (existingBook) {
        return res.status(400).json({ message: 'A book with this ISBN already exists' });
      }
      
      // Add the new book to in-memory storage
      const newBook = {
        id: inMemoryBooks.length > 0 ? Math.max(...inMemoryBooks.map(b => b.id)) + 1 : 1,
        title,
        author,
        isbn,
        total_copies: total_copies || 1,
        available_copies: available_copies || total_copies || 1,
        quantity: quantity || 1,
        shelf: shelf || null,
        category: category || null,
        description: description || null,
        published_year: published_year || null,
        publisher: publisher || null,
        cover_image: cover_image || null,
        created_at: new Date().toISOString()
      };
      
      inMemoryBooks.push(newBook);
      res.status(201).json(newBook);
    }
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ message: 'Error adding book' });
  }
});

// Circulation endpoints
// Reserve a book (new endpoint)
app.post('/api/circulation/reserve', authenticateToken, async (req, res) => {
  try {
    console.log('Reserve endpoint called with body:', req.body);
    console.log('User from token:', req.user);
    
    const { book_id, due_date } = req.body;
    const user_id = req.user.id;
    
    console.log('Extracted book_id:', book_id, 'due_date:', due_date, 'user_id:', user_id);
    
    if (!book_id) {
      return res.status(400).json({ message: 'Book ID is required' });
    }
    
    if (dbConnected) {
      // Check if book exists and has available copies
      const bookCheck = await pool.query('SELECT * FROM books WHERE id = $1', [book_id]);
      
      if (bookCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      const book = bookCheck.rows[0];
      
      if (book.available_copies <= 0) {
        return res.status(400).json({ message: 'No available copies of this book' });
      }
      
      // Check if user already has this book reserved or borrowed
      const existingRecord = await pool.query(
        "SELECT * FROM circulation WHERE user_id = $1 AND book_id = $2 AND (action = 'reserve' OR action = 'borrow') AND returned = false",
        [user_id, book_id]
      );
      
      if (existingRecord.rows.length > 0) {
        return res.status(400).json({ message: 'You already have this book reserved or borrowed' });
      }
      
      // Parse due date from request or create default (2 weeks from now)
      let userDueDate;
      if (due_date) {
        userDueDate = new Date(due_date);
      } else {
        userDueDate = new Date();
        userDueDate.setDate(userDueDate.getDate() + 14);
      }
      
      // Start a transaction
      await pool.query('BEGIN');
      
      try {
        // Add circulation record with 'reserve' action
        const circulationResult = await pool.query(
          "INSERT INTO circulation (user_id, book_id, action, due_date) VALUES ($1, $2, 'reserve', $3) RETURNING *",
          [user_id, book_id, userDueDate]
        );
        
        // Create notification for user
        await pool.query(
          'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
          [user_id, 'Book Reserved', `You have reserved "${book.title}". Please wait for admin approval.`]
        );
        
        // Create notification for admins
        const adminUsers = await pool.query("SELECT id FROM users WHERE role = 'admin'");
        for (const admin of adminUsers.rows) {
          await pool.query(
            'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
            [admin.id, 'New Reservation', `User has reserved "${book.title}" and is waiting for approval.`]
          );
        }
        
        // Commit transaction
        await pool.query('COMMIT');
        
        res.status(201).json({
          message: 'Book reserved successfully. Waiting for admin approval.',
          circulation: circulationResult.rows[0],
          due_date: userDueDate
        });
      } catch (error) {
        // Rollback transaction on error
        await pool.query('ROLLBACK');
        throw error;
      }
    } else {
      // In-memory fallback
      // Check if book exists and has available copies
      const book = inMemoryBooks.find(b => b.id === parseInt(book_id));
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      if (book.available_copies <= 0) {
        return res.status(400).json({ message: 'No available copies of this book' });
      }
      
      // Check if user already has this book reserved or borrowed
      const existingRecord = global.inMemoryCirculation.find(
        c => c.user_id === user_id && c.book_id === parseInt(book_id) && 
             (c.action === 'reserve' || c.action === 'borrow') && !c.returned
      );
      
      if (existingRecord) {
        return res.status(400).json({ message: 'You already have this book reserved or borrowed' });
      }
      
      // Parse due date from request or create default (2 weeks from now)
      let userDueDate;
      if (due_date) {
        userDueDate = new Date(due_date);
      } else {
        userDueDate = new Date();
        userDueDate.setDate(userDueDate.getDate() + 14);
      }
      
      // Create new circulation record
      const newCirculation = {
        id: global.inMemoryCirculation.length + 1,
        user_id: user_id,
        book_id: parseInt(book_id),
        action: 'reserve',
        action_date: new Date(),
        due_date: userDueDate,
        returned: false,
        return_date: null,
        book_title: book.title,
        book_author: book.author
      };
      
      global.inMemoryCirculation.push(newCirculation);
      
      res.status(201).json({
        message: 'Book reserved successfully. Waiting for admin approval.',
        circulation: newCirculation,
        due_date: userDueDate
      });
    }
  } catch (error) {
    console.error('Error reserving book:', error);
    res.status(500).json({ message: 'Error reserving book' });
  }
});

// Borrow a book (legacy endpoint - redirects to reserve)
app.post('/api/circulation/borrow', async (req, res) => {
  try {
    // Verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Extract book_id from request body
    const { book_id } = req.body;
    const user_id = decoded.id;
    
    if (!book_id) {
      return res.status(400).json({ message: 'Book ID is required' });
    }
    
    if (dbConnected) {
      // Check if book exists and has available copies
      const bookCheck = await pool.query('SELECT * FROM books WHERE id = $1', [book_id]);
      
      if (bookCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      const book = bookCheck.rows[0];
      
      if (book.available_copies <= 0) {
        return res.status(400).json({ message: 'No available copies of this book' });
      }
      
      // Check if user already has this book reserved or borrowed
      const existingRecord = await pool.query(
        "SELECT * FROM circulation WHERE user_id = $1 AND book_id = $2 AND (action = 'reserve' OR action = 'borrow') AND returned = false",
        [user_id, book_id]
      );
      
      if (existingRecord.rows.length > 0) {
        return res.status(400).json({ message: 'You already have this book reserved or borrowed' });
      }
      
      // Parse due date from request or create default (2 weeks from now)
      let userDueDate;
      if (due_date) {
        userDueDate = new Date(due_date);
      } else {
        userDueDate = new Date();
        userDueDate.setDate(userDueDate.getDate() + 14);
      }
      
      // Start a transaction
      await pool.query('BEGIN');
      
      try {
        // Add circulation record with 'reserve' action
        const circulationResult = await pool.query(
          "INSERT INTO circulation (user_id, book_id, action, due_date) VALUES ($1, $2, 'reserve', $3) RETURNING *",
          [user_id, book_id, userDueDate]
        );
        
        // Create notification for user
        await pool.query(
          'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
          [user_id, 'Book Reserved', `You have reserved "${book.title}". Please wait for admin approval.`]
        );
        
        // Create notification for admins
        const adminUsers = await pool.query("SELECT id FROM users WHERE role = 'admin'");
        for (const admin of adminUsers.rows) {
          await pool.query(
            'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
            [admin.id, 'New Reservation', `User has reserved "${book.title}" and is waiting for approval.`]
          );
        }
        
        // Commit transaction
        await pool.query('COMMIT');
        
        res.status(201).json({
          message: 'Book reserved successfully. Waiting for admin approval.',
          circulation: circulationResult.rows[0],
          due_date: userDueDate
        });
      } catch (error) {
        // Rollback transaction on error
        await pool.query('ROLLBACK');
        throw error;
      }
    } else {
      // In-memory mode implementation for reservation
      const book = inMemoryBooks.find(b => b.id === parseInt(book_id));
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      if (book.available_copies <= 0) {
        return res.status(400).json({ message: 'No available copies of this book' });
      }
      
      // Parse due date from request or create default
      let userDueDate;
      if (due_date) {
        userDueDate = new Date(due_date);
      } else {
        userDueDate = new Date();
        userDueDate.setDate(userDueDate.getDate() + 14);
      }
      
      // Create circulation record
      if (!global.inMemoryCirculation) {
        global.inMemoryCirculation = [];
      }
      
      const newCirculation = {
        id: global.inMemoryCirculation.length > 0 ? Math.max(...global.inMemoryCirculation.map(c => c.id)) + 1 : 1,
        user_id,
        book_id: parseInt(book_id),
        action: 'reserve',
        action_date: new Date().toISOString(),
        due_date: userDueDate.toISOString(),
        returned: false,
        book_title: book.title,
        book_author: book.author
      };
      
      global.inMemoryCirculation.push(newCirculation);
      
      res.status(201).json({
        message: 'Book reserved successfully. Waiting for admin approval.',
        circulation: newCirculation,
        due_date: userDueDate
      });
    }
  } catch (error) {
    console.error('Error reserving book:', error);
    res.status(500).json({ message: 'Error reserving book' });
  }
});

// Admin endpoint to approve a reservation and convert it to a borrow
app.post('/api/circulation/approve', authenticateToken, async (req, res) => {
  try {
    const { circulation_id } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can approve reservations' });
    }
    
    if (dbConnected) {
      // Get the reservation record
      const reservationCheck = await pool.query(
        "SELECT c.*, b.title, b.available_copies FROM circulation c JOIN books b ON c.book_id = b.id WHERE c.id = $1 AND c.action = 'reserve'",
        [circulation_id]
      );
      
      if (reservationCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Reservation not found' });
      }
      
      const reservation = reservationCheck.rows[0];
      const book_id = reservation.book_id;
      const user_id = reservation.user_id;
      
      // Check if book still has available copies
      if (reservation.available_copies <= 0) {
        return res.status(400).json({ message: 'No available copies of this book anymore' });
      }
      
      // Start a transaction
      await pool.query('BEGIN');
      
      try {
        // Update circulation record to 'borrow' action
        await pool.query(
          "UPDATE circulation SET action = 'borrow' WHERE id = $1",
          [circulation_id]
        );
        
        // Update book available copies
        await pool.query(
          'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
          [book_id]
        );
        
        // Create notification for user
        await pool.query(
          'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
          [user_id, 'Reservation Approved', `Your reservation for "${reservation.title}" has been approved. Due date: ${new Date(reservation.due_date).toDateString()}`]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        res.status(200).json({
          message: 'Reservation approved successfully',
          circulation_id
        });
      } catch (error) {
        // Rollback transaction on error
        await pool.query('ROLLBACK');
        throw error;
      }
    } else {
      // In-memory mode implementation for approval
      if (!global.inMemoryCirculation) {
        return res.status(404).json({ message: 'No circulation records found' });
      }
      
      const reservationIndex = global.inMemoryCirculation.findIndex(
        c => c.id === circulationId && c.action === 'reserve'
      );
      
      if (reservationIndex === -1) {
        return res.status(404).json({ message: 'Reservation not found' });
      }
      
      const reservation = global.inMemoryCirculation[reservationIndex];
      const book_id = reservation.book_id;
      
      // Find the book
      const bookIndex = inMemoryBooks.findIndex(b => b.id === book_id);
      if (bookIndex === -1 || inMemoryBooks[bookIndex].available_copies <= 0) {
        return res.status(400).json({ message: 'No available copies of this book anymore' });
      }
      
      // Update circulation record
      global.inMemoryCirculation[reservationIndex].action = 'borrow';
      
      // Update book available copies
      inMemoryBooks[bookIndex].available_copies -= 1;
      
      res.status(200).json({
        message: 'Reservation approved successfully',
        circulation_id
      });
    }
  } catch (error) {
    console.error('Error canceling reservation:', error);
    res.status(500).json({ message: 'Server error while canceling reservation' });
  }
});

// Cancel reservation endpoint
app.post('/api/circulation/cancel', authenticateToken, async (req, res) => {
  try {
    console.log('Cancel reservation request body:', req.body);
    const { circulation_id } = req.body;
    const user_id = req.user.id;
    
    if (!circulation_id) {
      console.error('Missing circulation_id in request body');
      return res.status(400).json({ message: 'Missing circulation_id in request' });
    }
    
    // Ensure circulation_id is properly parsed as a number
    const circulationId = Number(circulation_id);
    
    if (isNaN(circulationId)) {
      console.error(`Invalid circulation ID format: ${circulation_id}`);
      return res.status(400).json({ message: 'Invalid circulation ID format' });
    }
    
    console.log(`Attempting to cancel reservation ${circulationId} (type: ${typeof circulationId}) for user ${user_id}`);
    
    if (dbConnected) {
      // Get the reservation record
      console.log('Executing SQL query with circulationId:', circulationId, 'type:', typeof circulationId);
      const reservationCheck = await pool.query(
        "SELECT c.*, b.title FROM circulation c JOIN books b ON c.book_id = b.id WHERE c.id = $1 AND c.action = 'reserve'",
        [circulationId]
      );
      
      console.log('Reservation check result rows:', reservationCheck.rows.length);
      
      if (reservationCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Reservation not found' });
      }
      
      const reservation = reservationCheck.rows[0];
      
      // Check if user is authorized (either the reservation owner or an admin)
      if (reservation.user_id !== user_id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You are not authorized to cancel this reservation' });
      }
      
      // Start a transaction
      await pool.query('BEGIN');
      
      try {
        console.log('Attempting to delete circulation record with ID:', circulationId);
        
        // Instead of using the helper function, let's do the deletion directly here
        const deleteQuery = 'DELETE FROM circulation WHERE id = $1 RETURNING *';
        const deleteResult = await pool.query(deleteQuery, [circulationId]);
        
        if (deleteResult.rows.length === 0) {
          await pool.query('ROLLBACK');
          return res.status(404).json({ message: 'Failed to delete reservation record' });
        }
        
        const deletedReservation = deleteResult.rows[0];
        console.log('Successfully deleted reservation:', deletedReservation);
        
        // Create notification for user if admin is canceling
        if (req.user.role === 'admin' && reservation.user_id !== user_id) {
          await pool.query(
            'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
            [reservation.user_id, 'Reservation Canceled', `Your reservation for "${reservation.title}" has been canceled by an administrator.`]
          );
        }
        
        // Commit transaction
        await pool.query('COMMIT');
        console.log('Transaction committed successfully');
        
        res.status(200).json({
          message: 'Reservation canceled successfully',
          circulation_id: circulationId
        });
      } catch (error) {
        // Rollback transaction on error
        console.error('Error in cancel reservation transaction:', error);
        await pool.query('ROLLBACK');
        throw error;
      }
    } else {
      // In-memory mode implementation for cancellation
      if (!global.inMemoryCirculation) {
        return res.status(404).json({ message: 'No circulation records found' });
      }
      
      const reservationIndex = global.inMemoryCirculation.findIndex(
        c => c.id === circulationId && c.action === 'reserve'
      );
      
      if (reservationIndex === -1) {
        return res.status(404).json({ message: 'Reservation not found' });
      }
      
      const reservation = global.inMemoryCirculation[reservationIndex];
      
      // Check if user is authorized (either the reservation owner or an admin)
      if (reservation.user_id !== user_id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You are not authorized to cancel this reservation' });
      }
      
      // Remove the reservation from the array
      global.inMemoryCirculation.splice(reservationIndex, 1);
      
      res.status(200).json({
        message: 'Reservation canceled successfully',
        circulation_id: circulationId
      });
    }
  } catch (error) {
    console.error('Error canceling reservation:', error);
    res.status(500).json({ message: 'Server error while canceling reservation' });
  }
});

// Legacy borrow endpoint - redirect to reserve
app.post('/api/circulation/borrow', authenticateToken, async (req, res) => {
  // Redirect to reserve endpoint
  req.url = '/api/circulation/reserve';
  app._router.handle(req, res);
});

// Return a book
app.post('/api/circulation/return', async (req, res) => {
  try {
    // ... (rest of the code remains the same)
    // Verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    const { book_id } = req.body;
    const user_id = decoded.id;
    
    if (!book_id) {
      return res.status(400).json({ message: 'Book ID is required' });
    }
    
    if (dbConnected) {
      // Check if book exists
      const bookCheck = await pool.query('SELECT * FROM books WHERE id = $1', [book_id]);
      
      if (bookCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      const book = bookCheck.rows[0];
      
      // Check if user has borrowed this book
      const borrowRecord = await pool.query(
        "SELECT * FROM circulation WHERE user_id = $1 AND book_id = $2 AND action = 'borrow' AND returned = false",
        [user_id, book_id]
      );
      
      if (borrowRecord.rows.length === 0) {
        return res.status(400).json({ message: 'You have not borrowed this book' });
      }
      
      // Start a transaction
      await pool.query('BEGIN');
      
      try {
        // Update circulation record
        await pool.query(
          'UPDATE circulation SET returned = true WHERE id = $1',
          [borrowRecord.rows[0].id]
        );
        
        // Add return record
        const returnResult = await pool.query(
          "INSERT INTO circulation (user_id, book_id, action) VALUES ($1, $2, 'return') RETURNING *",
          [user_id, book_id]
        );
        
        // Update book available copies
        await pool.query(
          'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
          [book_id]
        );
        
        // Create notifications for admin users only
        const adminUsers = await pool.query(
          "SELECT id FROM users WHERE role = 'admin'"
        );
        
        // Notify all admins about the return
        if (adminUsers.rows.length > 0) {
          for (const admin of adminUsers.rows) {
            await pool.query(
              'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
              [admin.id, 'Book Returned', `A user has returned "${book.title}".`]
            );
          }
        }
        
        // Commit transaction
        await pool.query('COMMIT');
        
        res.json({
          message: 'Book returned successfully',
          circulation: returnResult.rows[0]
        });
      } catch (error) {
        // Rollback transaction on error
        await pool.query('ROLLBACK');
        throw error;
      }
    } else {
      // In-memory mode
      const book = inMemoryBooks.find(b => b.id === parseInt(book_id));
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Update book available copies
      book.available_copies += 1;
      
      // Create return record
      const returnRecord = {
        id: Math.floor(Math.random() * 1000) + 1000,
        user_id: decoded.id,
        book_id: parseInt(book_id),
        action: 'return',
        action_date: new Date().toISOString(),
        due_date: null,
        fine_amount: 0,
        returned: true
      };
      
      res.json({
        message: 'Book returned successfully',
        circulation: returnRecord
      });
    }
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).json({ message: 'Error returning book' });
  }
});

// Get user's borrowed books
app.get('/api/circulation/borrowed', async (req, res) => {
  try {
    // Verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    const user_id = decoded.id;
    
    if (dbConnected) {
      const borrowedBooks = await pool.query(
        `SELECT c.id, c.action_date, c.due_date, c.fine_amount, 
                b.id as book_id, b.title, b.author, b.isbn, b.cover_image 
         FROM circulation c 
         JOIN books b ON c.book_id = b.id 
         WHERE c.user_id = $1 AND c.action = 'borrow' AND c.returned = false 
         ORDER BY c.action_date DESC`,
        [user_id]
      );
      
      res.json(borrowedBooks.rows);
    } else {
      // Mock response for development
      res.json([
        {
          id: 1,
          action_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          fine_amount: 0,
          book_id: 1,
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          isbn: '9780743273565',
          cover_image: 'https://example.com/great-gatsby.jpg'
        }
      ]);
    }
  } catch (error) {
    console.error('Error fetching borrowed books:', error);
    res.status(500).json({ message: 'Error fetching borrowed books' });
  }
});

// Update a book (Admin only)
app.put('/api/books/:id', async (req, res) => {
  try {
    // Verify admin role
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { id } = req.params;
    const { 
      title, author, isbn, total_copies, available_copies,
      quantity, shelf, category, description,
      published_year, publisher, cover_image 
    } = req.body;
    
    if (dbConnected) {
      // Check if book exists
      const bookCheck = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
      
      if (bookCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Update the book with all fields
      const result = await pool.query(
        `UPDATE books SET 
          title = $1, author = $2, isbn = $3, 
          total_copies = $4, available_copies = $5,
          quantity = $6, shelf = $7, category = $8, 
          description = $9, published_year = $10, 
          publisher = $11, cover_image = $12 
        WHERE id = $13 RETURNING *`,
        [
          title, author, isbn, 
          total_copies, available_copies,
          quantity || 1,
          shelf || null,
          category || null,
          description || null,
          published_year || null,
          publisher || null,
          cover_image || null,
          id
        ]
      );
      
      res.json(result.rows[0]);
    } else {
      // Find and update book in in-memory storage
      const bookIndex = inMemoryBooks.findIndex(book => book.id === parseInt(id));
      
      if (bookIndex === -1) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Update the book with all fields
      inMemoryBooks[bookIndex] = {
        ...inMemoryBooks[bookIndex],
        title: title || inMemoryBooks[bookIndex].title,
        author: author || inMemoryBooks[bookIndex].author,
        isbn: isbn || inMemoryBooks[bookIndex].isbn,
        total_copies: total_copies || inMemoryBooks[bookIndex].total_copies,
        available_copies: available_copies || inMemoryBooks[bookIndex].available_copies,
        quantity: quantity || inMemoryBooks[bookIndex].quantity || 1,
        shelf: shelf || inMemoryBooks[bookIndex].shelf || null,
        category: category || inMemoryBooks[bookIndex].category || null,
        description: description || inMemoryBooks[bookIndex].description || null,
        published_year: published_year || inMemoryBooks[bookIndex].published_year || null,
        publisher: publisher || inMemoryBooks[bookIndex].publisher || null,
        cover_image: cover_image || inMemoryBooks[bookIndex].cover_image || null,
        updated_at: new Date().toISOString()
      };
      
      res.json(inMemoryBooks[bookIndex]);
    }
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: 'Error updating book' });
  }
});

// Delete a book (Admin only)
app.delete('/api/books/:id', async (req, res) => {
  try {
    // Verify admin role
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { id } = req.params;
    
    if (dbConnected) {
      // Check if book exists
      const bookCheck = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
      
      if (bookCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Check if book is currently borrowed
      const circulationCheck = await pool.query(
        "SELECT * FROM circulation WHERE book_id = $1 AND action = 'borrow' AND returned = false",
        [id]
      );
      
      if (circulationCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Cannot delete a book that is currently borrowed' });
      }
      
      // Delete the book
      await pool.query('DELETE FROM books WHERE id = $1', [id]);
      
      res.json({ message: 'Book deleted successfully' });
    } else {
      // Mock response for development
      res.json({ message: 'Book deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Error deleting book' });
  }
});

// Circulation endpoints
app.get('/api/circulation', async (req, res) => {
  try {
    if (dbConnected) {
      const result = await pool.query(
        'SELECT c.*, b.title, b.author, u.username FROM circulation c ' +
        'JOIN books b ON c.book_id = b.id ' +
        'JOIN users u ON c.user_id = u.id ' +
        'ORDER BY c.action_date DESC'
      );
      res.json(result.rows);
    } else {
      // Return mock data if database is not connected
      res.json([
        { id: 1, user_id: 1, book_id: 1, action: 'borrow', action_date: new Date(), due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), returned: false, title: 'To Kill a Mockingbird', author: 'Harper Lee', username: 'johndoe' },
        { id: 2, user_id: 2, book_id: 2, action: 'borrow', action_date: new Date(), due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), returned: false, title: '1984', author: 'George Orwell', username: 'janedoe' },
        { id: 3, user_id: 1, book_id: 3, action: 'return', action_date: new Date(), due_date: null, returned: true, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', username: 'johndoe' }
      ]);
    }
  } catch (error) {
    console.error('Error fetching circulation records:', error);
    res.status(500).json({ message: 'Error fetching circulation records' });
  }
});

app.get('/api/circulation/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (dbConnected) {
      const result = await pool.query(
        'SELECT c.*, b.title, b.author FROM circulation c ' +
        'JOIN books b ON c.book_id = b.id ' +
        'WHERE c.user_id = $1 ' +
        'ORDER BY c.action_date DESC',
        [userId]
      );
      res.json(result.rows);
    } else {
      // Return mock data if database is not connected
      res.json([
        { id: 1, user_id: userId, book_id: 1, action: 'borrow', action_date: new Date(), due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), returned: false, title: 'To Kill a Mockingbird', author: 'Harper Lee' },
        { id: 3, user_id: userId, book_id: 3, action: 'return', action_date: new Date(), due_date: null, returned: true, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' }
      ]);
    }
  } catch (error) {
    console.error('Error fetching user circulation records:', error);
    res.status(500).json({ message: 'Error fetching user circulation records' });
  }
});

// Notifications endpoints
app.get('/api/notifications/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (dbConnected) {
      const result = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC',
        [userId]
      );
      res.json(result.rows);
    } else {
      // Return mock data if database is not connected
      res.json([
        { id: 1, user_id: null, title: 'Welcome', message: 'Welcome to the Library Management System!', is_read: false, created_at: new Date() },
        { id: 2, user_id: userId, title: 'New Books', message: 'New books added to the catalog.', is_read: false, created_at: new Date() },
        { id: 3, user_id: userId, title: 'Account Setup', message: 'Your account has been set up successfully.', is_read: false, created_at: new Date() }
      ]);
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// User login endpoint
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }
    
    let user = null;
    
    if (dbConnected) {
      // Try database login first
      try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
          user = result.rows[0];
          // Check password
          const isMatch = await bcrypt.compare(password, user.password_hash);
          if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
          }
        }
      } catch (dbError) {
        console.error('Database login failed:', dbError);
        // Fall back to in-memory if database operation fails
        console.log('Falling back to in-memory login');
      }
    }
    
    // If no user found in database or database not connected, try in-memory
    if (!user) {
      user = inMemoryUsers.find(u => u.username === username);
      if (!user) {
        // For development, allow login with admin/password regardless of registration
        if (username === 'admin' && password === 'password') {
          user = {
            id: 999,
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin'
          };
        } else {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
      } else {
        // Check password for in-memory user
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
      }
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role || 'patron' },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' } // Increased from 1h to 7 days
    );
    
    console.log('Generated token for user:', user.username);
    
    // Return user info and token
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'patron'
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get all users (Admin only)
app.get('/api/users', async (req, res) => {
  try {
    // Verify admin role
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    if (dbConnected) {
      const result = await pool.query('SELECT id, username, email, role, created_at FROM users');
      res.json(result.rows);
    } else {
      // Return mock data for development
      res.json([
        { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin', created_at: new Date() },
        { id: 2, username: 'user1', email: 'user1@example.com', role: 'patron', created_at: new Date() },
        ...inMemoryUsers.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          created_at: u.created_at
        }))
      ]);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Add a new user (Admin only)
app.post('/api/users', async (req, res) => {
  try {
    // Verify admin role
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { username, email, password, role = 'patron' } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email and password' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    if (dbConnected) {
      // Check if user exists in DB
      const userCheck = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
      if (userCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }
      
      // Insert new user into database
      const newUser = await pool.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
        [username, email, hashedPassword, role]
      );
      
      return res.status(201).json({
        message: 'User added successfully',
        user: newUser.rows[0]
      });
    } else {
      // In-memory mode
      const existingUser = inMemoryUsers.find(u => u.username === username || u.email === email);
      if (existingUser) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }
      
      const newUser = {
        id: inMemoryUsers.length + 1,
        username,
        email,
        password_hash: hashedPassword,
        role,
        created_at: new Date().toISOString()
      };
      
      inMemoryUsers.push(newUser);
      
      res.status(201).json({
        message: 'User added successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      });
    }
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ message: 'Server error while adding user' });
  }
});

// Update a user (Admin only)
app.put('/api/users/:id', async (req, res) => {
  try {
    // Verify admin role
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { id } = req.params;
    const { username, email, role, password } = req.body;
    
    if (dbConnected) {
      // Check if user exists
      const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // If updating username or email, check they don't already exist
      if (username || email) {
        const duplicateCheck = await pool.query(
          'SELECT * FROM users WHERE (username = $1 OR email = $2) AND id != $3',
          [username || '', email || '', id]
        );
        if (duplicateCheck.rows.length > 0) {
          return res.status(400).json({ message: 'Username or email already exists' });
        }
      }
      
      // Build the update query dynamically
      let updateFields = [];
      let queryParams = [];
      let paramCounter = 1;
      
      if (username) {
        updateFields.push(`username = $${paramCounter}`);
        queryParams.push(username);
        paramCounter++;
      }
      
      if (email) {
        updateFields.push(`email = $${paramCounter}`);
        queryParams.push(email);
        paramCounter++;
      }
      
      if (role) {
        updateFields.push(`role = $${paramCounter}`);
        queryParams.push(role);
        paramCounter++;
      }
      
      if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        updateFields.push(`password_hash = $${paramCounter}`);
        queryParams.push(hashedPassword);
        paramCounter++;
      }
      
      // Add the id as the last parameter
      queryParams.push(id);
      
      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }
      
      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramCounter} 
        RETURNING id, username, email, role
      `;
      
      const result = await pool.query(query, queryParams);
      
      res.json({
        message: 'User updated successfully',
        user: result.rows[0]
      });
    } else {
      // In-memory mode
      const userIndex = inMemoryUsers.findIndex(u => u.id === parseInt(id));
      
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check for duplicate username/email
      if (username || email) {
        const duplicate = inMemoryUsers.find(u => 
          u.id !== parseInt(id) && (u.username === username || u.email === email)
        );
        
        if (duplicate) {
          return res.status(400).json({ message: 'Username or email already exists' });
        }
      }
      
      // Update user
      if (username) inMemoryUsers[userIndex].username = username;
      if (email) inMemoryUsers[userIndex].email = email;
      if (role) inMemoryUsers[userIndex].role = role;
      
      if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        inMemoryUsers[userIndex].password_hash = hashedPassword;
      }
      
      res.json({
        message: 'User updated successfully',
        user: {
          id: inMemoryUsers[userIndex].id,
          username: inMemoryUsers[userIndex].username,
          email: inMemoryUsers[userIndex].email,
          role: inMemoryUsers[userIndex].role
        }
      });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error while updating user' });
  }
});

// Delete a user (Admin only)
app.delete('/api/users/:id', async (req, res) => {
  try {
    // Verify admin role
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { id } = req.params;
    
    if (dbConnected) {
      // Check if user exists
      const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't allow deleting the last admin
      if (userCheck.rows[0].role === 'admin') {
        const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
        if (parseInt(adminCount.rows[0].count) <= 1) {
          return res.status(400).json({ message: 'Cannot delete the last admin user' });
        }
      }
      
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
      res.json({ message: 'User deleted successfully' });
    } else {
      // In-memory mode
      const userIndex = inMemoryUsers.findIndex(u => u.id === parseInt(id));
      
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't allow deleting the last admin
      if (inMemoryUsers[userIndex].role === 'admin') {
        const adminCount = inMemoryUsers.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) {
          return res.status(400).json({ message: 'Cannot delete the last admin user' });
        }
      }
      
      inMemoryUsers.splice(userIndex, 1);
      res.json({ message: 'User deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// User registration endpoint
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password, role = 'patron' } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email and password' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    if (dbConnected) {
      // Database mode - check if user exists in DB
      try {
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (userCheck.rows.length > 0) {
          return res.status(400).json({ message: 'Username or email already exists' });
        }
        
        // Insert new user into database
        const newUser = await pool.query(
          'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
          [username, email, hashedPassword, role]
        );
        
        // Create JWT token
        const token = jwt.sign(
          { id: newUser.rows[0].id, username, role },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        return res.status(201).json({
          message: 'User registered successfully',
          user: {
            id: newUser.rows[0].id,
            username: newUser.rows[0].username,
            email: newUser.rows[0].email,
            role: newUser.rows[0].role
          },
          token
        });
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        // Fall back to in-memory if database operation fails
        console.log('Falling back to in-memory storage');
      }
    }
    
    // In-memory data for fallback when database is not connected
    let dbConnected = false;
    const inMemoryBooks = [];
    const inMemoryUsers = [];
    global.inMemoryCirculation = [];

    // In-memory mode (fallback when database is not available)
    // Check if user exists in memory
    const existingUser = inMemoryUsers.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    // Create new in-memory user
    const newUser = {
      id: inMemoryUsers.length + 1,
      username,
      email,
      password_hash: hashedPassword,
      role,
      created_at: new Date().toISOString()
    };
    
    // Add to in-memory storage
    inMemoryUsers.push(newUser);
    console.log('User registered in memory:', newUser.username);
    
    // Create JWT token
    const token = jwt.sign(
      { id: newUser.id, username, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully (in-memory mode)',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Start server with port fallback mechanism
const startServer = (initialPort) => {
  const server = app.listen(initialPort, () => {
    console.log(`Server running on port ${initialPort}`);
    console.log(`API endpoints available at http://localhost:${initialPort}/api/`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = parseInt(initialPort) + 1;
      console.log(`Port ${initialPort} is busy, trying port ${nextPort}`);
      startServer(nextPort);
    } else {
      console.error('Server error:', err);
    }
  });
};

// Start the server with the initial port
startServer(port);
