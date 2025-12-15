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

// Static Files
app.use(express.static(path.join(__dirname, '..')));

// Error Handler
app.use(errorHandler);

module.exports = app;
