const http = require('http');
const app = require('./src/app');
const config = require('./src/config/config');
const { initializeWebSocketServer } = require('./api/websocket/setup');

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket Enterprise Stream Server
try {
  const wss = initializeWebSocketServer(server);
  console.log('[SERVER] ✅ WebSocket server initialized');
} catch (err) {
  console.warn('[SERVER] ⚠️  WebSocket initialization failed:', err.message);
  console.log('[SERVER] ℹ️  Server will run without WebSocket support');
}

// Start server
server.listen(config.port, () => {
  console.log(` Galaxy Server running on http://localhost:${config.port}`);
  console.log(` API available at http://localhost:${config.port}/api/sandra/chat`);
  console.log(` Voice API available at http://localhost:${config.port}/api/sandra/voice`);
  console.log(` Transcribe API available at http://localhost:${config.port}/api/sandra/transcribe`);
  console.log(` WebSocket available at ws://localhost:${config.port}/ws/stream`);
  console.log(` PWA available at http://localhost:${config.port}`);
  console.log(` Galaxy System adapted for Gemini (Enterprise Edition)`);
});
