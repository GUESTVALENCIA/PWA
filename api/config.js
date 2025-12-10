// API endpoint para exponer configuración del cliente
// Este endpoint expone las variables de entorno necesarias para el widget en el cliente

export default function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obtener variables de entorno
  const config = {
    MCP_SERVER_URL: process.env.MCP_SERVER_URL || 'https://mcp.sandra-ia.com',
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

