const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const routes = require('./routes');
const { apiLogger } = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow local dev Vite proxying
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const defaultOrigins = [
  'https://miltrack-client.netlify.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const envOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : [];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.netlify.app')
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Dev flexibility
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Express JSON and Urlencoded body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple lightweight cookie parser
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const name = parts[0]?.trim();
      const value = parts.slice(1).join('=').trim();
      if (name) {
        req.cookies[name] = decodeURIComponent(value);
      }
    });
  }
  next();
});

// Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
  app.use(apiLogger);
}

// Health check endpoints for cloud deployment platforms (Render, Railway, etc.)
app.get(['/', '/health'], (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'online',
    service: 'MILTRACK Asset Operations Platform API Gateway',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'healthy',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Guard operational API routes if database is not connected
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'DATABASE_NOT_CONNECTED',
      message:
        'Database connection is not established. If this is a cloud deployment (e.g. Render), please configure the MONGO_URI environment variable in your dashboard with your MongoDB Atlas connection string.',
    });
  }
  next();
});

// API Routes
app.use('/api', routes);

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
