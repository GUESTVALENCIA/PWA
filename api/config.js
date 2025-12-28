// API endpoint para exponer configuración del cliente
// Este endpoint expone las variables de entorno necesarias para el widget en el cliente

export default function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Detectar si estamos en localhost
  const isLocalhost = req.headers.host && (
    req.headers.host.includes('localhost') || 
    req.headers.host.includes('127.0.0.1') ||
    req.headers.host.includes(':3000') ||
    req.headers.host.includes(':4042')
  );

  // Obtener variables de entorno
  const config = {
    // URL del servidor MCP
    // En localhost usa localhost:4042, en producción usa Render
    MCP_SERVER_URL: isLocalhost 
      ? 'http://localhost:4042'
      : (process.env.MCP_SERVER_URL || 'https://pwa-imbf.onrender.com'),
    MCP_TOKEN: process.env.MCP_TOKEN || null, // No exponer si no está configurado
    // Añadir otras configuraciones necesarias aquí
  };

  // CORS headers para permitir acceso desde el cliente
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  // Retornar configuración
  return res.status(200).json(config);
}

