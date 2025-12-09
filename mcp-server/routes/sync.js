/**
 * Sync Routes
 * Sincronización video/audio
 * VideoSync Service
 */

const express = require('express');
const router = express.Router();

module.exports = (services) => {
  // Sincronizar video con audio
  router.post('/video-audio', async (req, res) => {
    try {
      const { videoUrl, audioUrl, audioText, timing } = req.body;
      
      const syncData = await services.videoSync.syncVideoAudio({
        videoUrl,
        audioUrl,
        audioText,
        timing
      });
      
      res.json({
        success: true,
        sync: syncData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en sync video-audio:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Estado de sincronización
  router.get('/status', (req, res) => {
    try {
      const status = services.videoSync.getStatus();
      res.json({
        success: true,
        status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

