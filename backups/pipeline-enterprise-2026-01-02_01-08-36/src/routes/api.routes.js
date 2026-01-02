const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const qwenController = require('../controllers/qwen.controller');
const mcpController = require('../controllers/mcp.controller');
const renderController = require('../controllers/render.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Chat routes
router.post('/sandra/chat', chatController.chat);
router.post('/sandra/voice', chatController.voice);
router.post('/sandra/transcribe', chatController.transcribe);

// Qwen routes
router.post('/qwen/chat', qwenController.chat);
router.get('/qwen/models', qwenController.getModels);
router.post('/github/read', qwenController.readGithub);

// Render routes (Protected)
router.get('/render/services', authMiddleware, renderController.listServices);
router.get('/render/services/:serviceId/deployments', authMiddleware, renderController.listDeployments);
router.post('/render/services/:serviceId/deploy', authMiddleware, renderController.triggerDeploy);

// MCP routes
router.post('/mcp/execute_command', authMiddleware, mcpController.executeCommand);
router.post('/mcp/read_file', authMiddleware, mcpController.readFile);
router.post('/mcp/write_file', authMiddleware, mcpController.writeFile);
router.post('/mcp/list_files', authMiddleware, mcpController.listFiles);
router.post('/mcp/copy_path', authMiddleware, mcpController.copyPath);
router.get('/mcp/status', mcpController.status);

module.exports = router;
