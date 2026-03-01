const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || '0.0.0.0';

// Enable CORS for frontend domain
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow requests from frontend
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// API routes (example)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Backend server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
