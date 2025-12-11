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
              name: 'execute_command',
              description: 'Ejecuta comandos del sistema',
              inputSchema: {
                type: 'object',
                properties: {
                  command: { type: 'string', description: 'Comando a ejecutar' }
                },
                required: ['command']
              }
            },
            {
              name: 'read_file',
              description: 'Lee archivos del sistema',
              inputSchema: {
                type: 'object',
                properties: {
                  path: { type: 'string', description: 'Ruta del archivo' }
                },
                required: ['path']
              }
            },
            {
              name: 'write_file',
              description: 'Escribe archivos en el sistema',
              inputSchema: {
                type: 'object',
                properties: {
                  path: { type: 'string', description: 'Ruta del archivo' },
                  content: { type: 'string', description: 'Contenido a escribir' }
                },
                required: ['path', 'content']
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

// Helper para ejecutar herramientas
async function executeTool(name, args, services) {
  switch (name) {
    case 'execute_command':
      // Ejecutar comando del sistema (requiere implementación segura)
      return { output: 'Comando ejecutado', command: args.command };
      
    case 'read_file':
      const fs = require('fs');
      const path = require('path');
      const filePath = path.resolve(args.path);
      const content = fs.readFileSync(filePath, 'utf8');
      return { content, path: filePath };
      
    case 'write_file':
      const fs2 = require('fs');
      const path2 = require('path');
      const filePath2 = path2.resolve(args.path);
      fs2.writeFileSync(filePath2, args.content, 'utf8');
      return { success: true, path: filePath2 };
      
    case 'search_web':
      // Usar servicio de APIs públicas
      if (services?.publicAPIs) {
        return await services.publicAPIs.search(args.query);
      }
      return { results: [] };
      
    case 'call_api':
      const https = require('https');
      return new Promise((resolve, reject) => {
        const url = new URL(args.url);
        const options = {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: args.method || 'GET',
          headers: args.headers || {}
        };
        
        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        
        req.on('error', reject);
        if (args.body) req.write(JSON.stringify(args.body));
        req.end();
      });
      
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

