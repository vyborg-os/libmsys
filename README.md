# Library Management System (LMS)

A modern LMS for managing library operations including catalog search, circulation, notifications, and reports.

## Features
- **User Roles**: Admin (librarian), Patron (student/staff)
- **Catalog**: Search books/e-books by title, author, or ISBN
- **Circulation**: Borrow, return, reserve books; track fines
- **Notifications**: Real-time alerts for due dates or reservations (in-app)
- **Reports**: Basic usage stats (e.g., most borrowed books)

## Tech Stack
- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Notifications**: Pusher for real-time alerts

## Setup
1. **Install Dependencies**:
   ```bash
   npm install
   cd client && npm install
   cd ..
   ```
2. **Environment Variables**:
   Update `.env` with your PostgreSQL and Pusher credentials.
3. **Database Setup**:
   Create a PostgreSQL database named `lms_db` and run the schema scripts found in `database/`.
4. **Run Application**:
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5000`, client on `http://localhost:3000`.

## Development
- **Backend**: `npm run server`
- **Frontend**: `npm run client`
