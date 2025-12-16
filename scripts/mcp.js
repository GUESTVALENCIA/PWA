/**
 * MCP Protocol Route Handler
 * Compatible con Model Context Protocol para VS Code
 * Endpoint: /mcp
 */

const express = require('express');
const router = express.Router();

// MCP Protocol Endpoint para VS Code
router.post('/mcp', async (req, res) => {
  try {
    const { method, params } = req.body;
    
    // Headers MCP estándar
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Verificar autenticación
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.query.token;
    
    if (process.env.REQUIRE_AUTH === 'true' && token !== process.env.SANDRA_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Manejar métodos MCP estándar
    switch (method) {
      case 'initialize':
        return res.json({
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
            prompts: {}
          },
          serverInfo: {
            name: 'sandra-mcp-server',
            version: '1.0.0'
          }
        });
        
      case 'tools/list':
        return res.json({
          tools: [
            {
              name: 'cloud.github.readFile',
              description: 'Lee un archivo de un repositorio de GitHub',
              inputSchema: {
                type: 'object',
                properties: {
                  owner: { type: 'string', description: 'Usuario/organización' },
                  repo: { type: 'string', description: 'Nombre del repositorio' },
                  ref: { type: 'string', description: 'Branch/tag/commit (default: main)' },
                  path: { type: 'string', description: 'Ruta del archivo en el repo' }
                },
                required: ['owner', 'repo', 'path']
              }
            },
            {
              name: 'cloud.web.fetch',
              description: 'Hace una petición HTTP a una URL',
              inputSchema: {
                type: 'object',
                properties: {
                  url: { type: 'string', description: 'URL a obtener' },
                  method: { type: 'string', description: 'Método HTTP (default: GET)' },
                  headers: { type: 'object', description: 'Headers HTTP' },
                  body: { type: 'object', description: 'Cuerpo de la petición' }
                },
                required: ['url']
              }
            },
            {
              name: 'cloud.pwa.query',
              description: 'Consulta un endpoint del PWA en Render',
              inputSchema: {
                type: 'object',
                properties: {
                  endpoint: { type: 'string', description: 'Ruta del endpoint' },
                  body: { type: 'object', description: 'Cuerpo de la petición' }
                },
                required: ['endpoint']
              }
            },
            {
              name: 'search_web',
              description: 'Busca información en la web',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Consulta de búsqueda' }
                },
                required: ['query']
              }
            },
            {
              name: 'call_api',
              description: 'Llama a APIs externas',
              inputSchema: {
                type: 'object',
                properties: {
                  url: { type: 'string', description: 'URL de la API' },
                  method: { type: 'string', description: 'Método HTTP' },
                  body: { type: 'object', description: 'Cuerpo de la petición' }
                },
                required: ['url', 'method']
              }
            }
          ]
        });
        
      case 'tools/call':
        // Ejecutar herramienta
        const { name, arguments: args } = params;
        // Pasar servicios desde el contexto de la app
        const services = req.app.locals.services || {};
        const result = await executeTool(name, args, services);
        return res.json({ content: [{ type: 'text', text: JSON.stringify(result) }] });
        
      case 'resources/list':
        return res.json({ resources: [] });
        
      default:
        return res.json({ error: `Unknown method: ${method}` });
    }
  } catch (error) {
    console.error('Error en MCP endpoint:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Helper para ejecutar herramientas - IMPLEMENTACIÓN REAL SIN STUBS
async function executeTool(name, args, services) {
  switch (name) {
    case 'cloud.github.readFile':
      // Leer archivo de GitHub usando GitHub API
      const axios = require('axios');
      const { owner, repo, ref = 'main', path: filePath } = args;
      
      if (!owner || !repo || !filePath) {
        throw new Error('owner, repo, and path required');
      }

      try {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`;
        const response = await axios.get(url, {
          headers: {
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'Sandra-IA-8.0-Pro',
            ...(process.env.GITHUB_TOKEN ? { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` } : {})
          },
          timeout: 10000
        });

        // Si es base64, decodificar
        if (response.data && response.data.content) {
          const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
          return { content, path: filePath, owner, repo, ref };
        }

        return { content: response.data, path: filePath };
      } catch (error) {
        if (error.response && error.response.status === 404) {
          throw new Error(`File not found: ${owner}/${repo}/${filePath} (ref: ${ref})`);
        }
        throw error;
      }
      
    case 'cloud.web.fetch':
      // Petición HTTP real
      const axios2 = require('axios');
      const { url, method = 'GET', headers = {}, body } = args;
      
      if (!url) {
        throw new Error('url required');
      }

      try {
        const response = await axios2({
          url,
          method,
          headers,
          data: body,
          timeout: 10000,
          validateStatus: () => true
        });

        return {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        };
      } catch (error) {
        throw new Error(`HTTP request failed: ${error.message}`);
      }
      
    case 'cloud.pwa.query':
      // Consultar endpoint del PWA
      const axios3 = require('axios');
      const { endpoint, body: queryBody } = args;
      
      if (!endpoint) {
        throw new Error('endpoint required');
      }

      const baseUrl = process.env.MCP_SERVER_URL || 'https://pwa-imbf.onrender.com';
      const fullUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

      try {
        const response = await axios3.post(fullUrl, queryBody || {}, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });

        return response.data;
      } catch (error) {
        throw new Error(`PWA query failed: ${error.message}`);
      }
      
    case 'search_web':
      // Usar servicio de APIs públicas (si está disponible)
      if (services?.publicAPIs) {
        try {
          return await services.publicAPIs.search(args.query);
        } catch (error) {
          console.error('Error en publicAPIs.search:', error);
        }
      }
      return { results: [], message: 'Public APIs service not available' };
      
    case 'call_api':
      // Llamada genérica a API
      const axios4 = require('axios');
      const { url: apiUrl, method: apiMethod = 'GET', headers: apiHeaders = {}, body: apiBody } = args;
      
      if (!apiUrl) {
        throw new Error('url required');
      }

      try {
        const response = await axios4({
          url: apiUrl,
          method: apiMethod,
          headers: apiHeaders,
          data: apiBody,
          timeout: 10000,
          validateStatus: () => true
        });

        return {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          body: response.data
        };
      } catch (error) {
        throw new Error(`API call failed: ${error.message}`);
      }
      
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// OPTIONS para CORS
router.options('/mcp', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = router;

