// Vercel Serverless Function - MCP Proxy
// Conecta PWA en Vercel con MCP Server

/**
 * Proxy que conecta las peticiones de la PWA con el servidor MCP
 * Permite que /api/sandra/* redirija a MCP cuando esté disponible
 */

const https = require('https');

// URL del servidor MCP (configurar según deployment)
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:4042';

function proxyToMCP(path, method, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${MCP_SERVER_URL}/mcp-router${path}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      // Si MCP no está disponible, hacer fallback a implementación local
      console.warn('MCP Server no disponible, usando fallback local:', error.message);
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const endpoint = req.url.replace('/api/sandra/mcp', '');
    
    // Intentar conectar con MCP
    try {
      const result = await proxyToMCP(endpoint, req.method, req.body);
      return res.status(200).json(result);
    } catch (error) {
      // Fallback: si MCP no está disponible, retornar error informativo
      return res.status(503).json({
        error: 'MCP Server no disponible',
        message: 'El servidor MCP no está disponible. Usando implementación local.',
        fallback: true
      });
    }
  } catch (error) {
    console.error('Error en MCP Proxy:', error);
    res.status(500).json({ error: error.message });
  }
};

