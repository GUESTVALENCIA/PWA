const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const apiRoutes = require('./routes/api.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization', 'mcp-secret'],
  methods: ['GET', 'POST', 'OPTIONS']
}));

// Logging
app.use(morgan('dev'));

// Body Parser
app.use(express.json({ limit: '50mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      chat: true,
      voice: true,
      vision: false,
      commands: true,
      scheduler: true,
      mcp: true
    }
  });
});

// API Routes
app.use('/api', apiRoutes);

// --- STRICT ISOLATION STATIC SERVING ---
// Only serve specific directories/files. DO NOT serve root (..).
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Serve index.html for root path only
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Serve Sandra AI Studio (experimental) page
app.get(['/studio', '/studio/'], (req, res) => {
  res.sendFile(path.join(__dirname, '../studio/index.html'));
});

// Serve manifest.json if it exists (often needed for PWA)
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(__dirname, '../manifest.json'), (err) => {
        if (err) res.status(404).end();
    });
});

// Strict 404 Handler for undefined routes
// This prevents falling back to index.html or exposing other files
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
