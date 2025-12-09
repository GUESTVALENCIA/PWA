/**
 * Video Routes
 * Gestión de video: Ambientación dinámica, video sync
 */

const express = require('express');
const router = express.Router();

module.exports = (services) => {
  // Obtener ambientación actual (imagen/video según hora)
  router.get('/ambientation', async (req, res) => {
    try {
      const timezone = req.query.timezone || 'Europe/Madrid';
      const ambientation = await services.ambientation.getCurrentAmbientation(timezone);
      
      res.json({
        success: true,
        ambientation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error obteniendo ambientación:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Sincronizar video con audio
  router.post('/sync', async (req, res) => {
    try {
      const { videoUrl, audioUrl, audioText } = req.body;
      
      const syncData = await services.videoSync.syncVideoAudio({
        videoUrl,
        audioUrl,
        audioText
      });
      
      res.json({
        success: true,
        sync: syncData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sincronizando video:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Cambiar ambientación manualmente
  router.post('/ambientation/set', async (req, res) => {
    try {
      const { type, timezone } = req.body; // type: 'day', 'night', 'rain', etc.
      
      const ambientation = await services.ambientation.setAmbientation(type, timezone);
      
      res.json({
        success: true,
        ambientation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error configurando ambientación:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

