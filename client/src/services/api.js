import axios from 'axios';

// Get the current server port from the environment or use the default
// const API_BASE_URL = 'https://libmsys-vm3h-icvyyqzp0-vyborgs-projects.vercel.app/api';
const API_BASE_URL = 'https://libmsys-vm3h-icvyyqzp0-vyborgs-projects.vercel.app/api';


// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lmsToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Dashboard services
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Book services
export const getBooks = async () => {
  try {
    const response = await api.get('/books');
    return response.data;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};

export const getBookById = async (id) => {
  try {
    const response = await api.get(`/books/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching book with id ${id}:`, error);
    throw error;
  }
};

// Admin book management services
export const addBook = async (bookData) => {
  try {
    const response = await api.post('/books', bookData);
    return response.data;
  } catch (error) {
    console.error('Error adding book:', error);
    throw error.response?.data || error;
  }
};

export const updateBook = async (id, bookData) => {
  try {
    const response = await api.put(`/books/${id}`, bookData);
    return response.data;
  } catch (error) {
    console.error('Error updating book:', error);
    throw error.response?.data || error;
  }
};

export const deleteBook = async (id) => {
  try {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error.response?.data || error;
  }
};

// User management services
export const getUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error.response?.data || error;
  }
};

export const getUserById = async (id) => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user by id:', error);
    throw error.response?.data || error;
  }
};

export const addUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error adding user:', error);
    throw error.response?.data || error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error.response?.data || error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error.response?.data || error;
  }
};

// Circulation services
export const getCirculationRecords = async (userId = null) => {
  try {
    const url = userId ? `/circulation?userId=${userId}` : '/circulation';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching circulation records:', error);
    throw error;
  }
};

export const getBorrowedBooks = async () => {
  try {
    const response = await api.get('/circulation/borrowed');
    return response.data;
  } catch (error) {
    console.error('Error fetching borrowed books:', error);
    throw error;
  }
};

export const reserveBook = async (book_id, due_date) => {
  try {
    console.log('Calling reserveBook API with:', { book_id, due_date });
    // Make sure book_id is properly formatted
    const bookId = parseInt(book_id) || book_id;
    console.log('API URL:', `${API_BASE_URL}/circulation/reserve`);
    
    const response = await api.post('/circulation/reserve', { book_id: bookId, due_date });
    console.log('Reservation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error reserving book:', error);
    console.error('Error details:', error.response?.data || 'No response data');
    throw error;
  }
};

export const approveReservation = async (circulation_id) => {
  try {
    const response = await api.post('/circulation/approve', { circulation_id });
    return response.data;
  } catch (error) {
    console.error('Error approving reservation:', error);
    throw error;
  }
};

export const cancelReservation = async (circulation_id) => {
  try {
    console.log('Canceling reservation with ID:', circulation_id);
    
    // Ensure circulation_id is a valid number
    const circulationId = Number(circulation_id);
    if (isNaN(circulationId)) {
      throw new Error(`Invalid circulation ID format: ${circulation_id}`);
    }
    
    console.log('API URL:', `${API_BASE_URL}/circulation/cancel`);
    console.log('Sending payload:', { circulation_id: circulationId });
    
    const response = await api.post('/circulation/cancel', { circulation_id: circulationId });
    console.log('Cancel reservation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error canceling reservation:', error);
    console.error('Error details:', error.response?.data || 'No response data');
    throw error;
  }
};

// Legacy function for backward compatibility
export const borrowBook = async (book_id, due_date) => {
  return reserveBook(book_id, due_date);
};

export const returnBook = async (book_id) => {
  try {
    console.log('Calling returnBook API with book_id:', book_id);
    
    // Ensure book_id is properly formatted (convert to number if possible)
    let formattedBookId = book_id;
    if (typeof book_id === 'string' && !isNaN(parseInt(book_id))) {
      formattedBookId = parseInt(book_id);
    }
    
    console.log('Formatted book_id for API call:', formattedBookId);
    
    // Make the API call with the formatted book_id
    const response = await api.post('/circulation/return', { book_id: formattedBookId });
    console.log('Return book API response:', response.data);
    
    // If the response doesn't have a success flag, add one based on presence of data
    if (response.data && response.data.success === undefined) {
      response.data.success = true; // Assume success if no explicit failure
    }
    
    return response.data;
  } catch (error) {
    console.error('Error returning book:', error);
    console.error('Error details:', error.response?.data || 'No response data');
    throw error;
  }
};

// Notifications services
export const getNotifications = async (userId) => {
  try {
    const response = await api.get(`/notifications/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Reports services
export const getCirculationReport = async (startDate, endDate) => {
  try {
    const response = await api.get('/reports/circulation', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching circulation report:', error);
    throw error.response?.data || error;
  }
};

export const getPopularBooksReport = async () => {
  try {
    const response = await api.get('/reports/popular-books');
    return response.data;
  } catch (error) {
    console.error('Error fetching popular books report:', error);
    throw error.response?.data || error;
  }
};

export const getOverdueReport = async () => {
  try {
    const response = await api.get('/reports/overdue');
    return response.data;
  } catch (error) {
    console.error('Error fetching overdue report:', error);
    throw error.response?.data || error;
  }
};

export default api;
