const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
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
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
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
