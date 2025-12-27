/**
 * WebSocket Server Setup Helper
 * =============================
 * Initializes the WebSocket Enterprise Stream server
 * and attaches it to the HTTP server instance
 */

module.exports = {
  /**
   * Initialize WebSocket server
   * @param {http.Server} server - Express HTTP server instance
   * @returns {ws.Server} WebSocket server instance
   */
  initializeWebSocketServer: (server) => {
    console.log('[WEBSOCKET-SETUP] 🔧 Inicializando WebSocket Enterprise Stream...');

    try {
      // Import the stream server module (v2 with Deepgram STREAMING + VAD)
      const streamServer = require('./stream-server-v2');

      // Initialize with the HTTP server
      const wss = streamServer(server);

      console.log('[WEBSOCKET-SETUP] ✅ WebSocket Enterprise Stream inicializado correctamente');
      console.log('[WEBSOCKET-SETUP] 📍 Conectar en: ws://localhost:3000/ws/stream');

      return wss;

    } catch (err) {
      console.error('[WEBSOCKET-SETUP] ❌ Error inicializando WebSocket:', err.message);
      throw err;
    }
  }
};
