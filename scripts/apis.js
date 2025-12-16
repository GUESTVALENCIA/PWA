/**
 * APIs Routes
 * Gestión de Public APIs integradas
 * Búsqueda y acceso a APIs locales
 */

const express = require('express');
const router = express.Router();

module.exports = (services) => {
  // Buscar API
  router.get('/search', async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" requerido' });
      }
      
      const results = await services.publicAPIs.search(q);
      
      res.json({
        success: true,
        query: q,
        results,
        count: results.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error buscando APIs:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Obtener API específica
  router.get('/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const api = await services.publicAPIs.getAPI(name);
      
      if (!api) {
        return res.status(404).json({ error: 'API no encontrada' });
      }
      
      res.json({
        success: true,
        api,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error obteniendo API:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Listar categorías
  router.get('/categories/list', async (req, res) => {
    try {
      const categories = await services.publicAPIs.getCategories();
      
      res.json({
        success: true,
        categories,
        count: categories.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error listando categorías:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Obtener APIs por categoría
  router.get('/categories/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const apis = await services.publicAPIs.getByCategory(category);
      
      res.json({
        success: true,
        category,
        apis,
        count: apis.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error obteniendo APIs por categoría:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

