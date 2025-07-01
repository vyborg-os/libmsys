/**
 * Test script for the reservation functionality
 * This script simulates a reservation request to verify the API works correctly
 */
const axios = require('axios');

// Configuration
const API_URL = 'https://libmsys-vm3h-icvyyqzp0-vyborgs-projects.vercel.app/api';
const BOOK_ID = 1;

// Create a test date (2 weeks from now)
const dueDate = new Date();
dueDate.setDate(dueDate.getDate() + 14);
const formattedDate = dueDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

// Use the special test token that our server will accept in development mode
const TEST_TOKEN = 'test_token';

// Test the reservation endpoint directly
async function testReservation() {
  try {
    console.log('Testing reservation with:', { book_id: BOOK_ID, due_date: formattedDate });
    console.log('Using test token:', TEST_TOKEN);
    
    // Make the reservation request
    const response = await axios.post(`${API_URL}/circulation/reserve`, 
      { book_id: BOOK_ID, due_date: formattedDate },
      { headers: { Authorization: `Bearer ${TEST_TOKEN}` } }
    );
    
    console.log('Reservation successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Reservation failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
  }
}

// Run the test
testReservation();
