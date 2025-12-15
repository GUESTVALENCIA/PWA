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
    contentSecurityPolicy: false, // Disabling CSP for simplicity in this migration, should be configured properly for prod
}));

// CORS
app.use(cors({
  origin: '*', // Configure this properly for production
  allowedHeaders: ['Content-Type', 'Authorization', 'mcp-secret'],
  methods: ['GET', 'POST', 'OPTIONS']
}));

// Logging
app.use(morgan('dev'));

// Body Parser
app.use(express.json({ limit: '50mb' })); // Increased limit for audio/file uploads

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
// Legacy MCP routes were at /mcp/..., mapping them to match new structure or keeping them?
// The original server had /mcp/ at root. Let's support both or redirect.
// Supporting root /mcp/ for compatibility with existing clients
const mcpController = require('./controllers/mcp.controller');
const authMiddleware = require('./middleware/auth.middleware');
const mcpRouter = express.Router();
mcpRouter.post('/execute_command', authMiddleware, mcpController.executeCommand);
mcpRouter.post('/read_file', authMiddleware, mcpController.readFile);
mcpRouter.post('/write_file', authMiddleware, mcpController.writeFile);
mcpRouter.post('/list_files', authMiddleware, mcpController.listFiles);
mcpRouter.post('/copy_path', authMiddleware, mcpController.copyPath);
mcpRouter.get('/status', mcpController.status);
app.use('/mcp', mcpRouter);


// Static Files
app.use(express.static(path.join(__dirname, '..')));

// Error Handler
app.use(errorHandler);

module.exports = app;
