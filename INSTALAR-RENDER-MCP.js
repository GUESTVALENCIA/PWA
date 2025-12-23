/**
 * INSTALACIÓN AUTOMÁTICA DEL SERVIDOR MCP DE RENDER
 * Configura Cursor para gestionar Render desde aquí
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     INSTALANDO SERVIDOR MCP DE RENDER PARA CURSOR      ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');

// Detectar sistema operativo
const isWindows = os.platform() === 'win32';
const cursorMCPPath = isWindows 
  ? path.join(os.homedir(), '.cursor', 'mcp.json')
  : path.join(os.homedir(), '.cursor', 'mcp.json');

console.log(' PASO 1: Verificando configuración de Cursor...');
console.log(`   Ruta: ${cursorMCPPath}`);

// Crear directorio si no existe
const cursorDir = path.dirname(cursorMCPPath);
if (!fs.existsSync(cursorDir)) {
  fs.mkdirSync(cursorDir, { recursive: true });
  console.log(' Directorio creado');
}

// Leer configuración existente o crear nueva
let mcpConfig = {};
if (fs.existsSync(cursorMCPPath)) {
  try {
    const existing = fs.readFileSync(cursorMCPPath, 'utf-8');
    mcpConfig = JSON.parse(existing);
    console.log(' Configuración existente encontrada');
  } catch (e) {
    console.log(' Error leyendo configuración, creando nueva');
    mcpConfig = {};
  }
} else {
  console.log(' Creando nueva configuración');
}

// Asegurar que mcpServers existe
if (!mcpConfig.mcpServers) {
  mcpConfig.mcpServers = {};
}

console.log('');
console.log(' PASO 2: Configuración del servidor MCP de Render');
console.log('');
console.log(' IMPORTANTE: Necesitas crear una API Key de Render');
console.log('');
console.log('1. Ve a: https://dashboard.render.com/settings#api-keys');
console.log('2. Click en "Create API Key"');
console.log('3. Copia la API key generada');
console.log('');
console.log('Luego ejecuta este script de nuevo con:');
console.log('   node INSTALAR-RENDER-MCP.js TU_API_KEY_AQUI');
console.log('');

// Si se pasa API key como argumento
const apiKey = process.argv[2];

if (apiKey && apiKey.length > 20) {
  console.log(' API Key recibida, configurando...');
  
  // Configurar servidor MCP de Render
  mcpConfig.mcpServers.render = {
    url: 'https://mcp.render.com/mcp',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  };
  
  // Guardar configuración
  fs.writeFileSync(cursorMCPPath, JSON.stringify(mcpConfig, null, 2));
  
  console.log('');
  console.log(' ¡CONFIGURACIÓN COMPLETA!');
  console.log('');
  console.log(' Configuración guardada en:');
  console.log(`   ${cursorMCPPath}`);
  console.log('');
  console.log(' PRÓXIMOS PASOS:');
  console.log('');
  console.log('1. Reinicia Cursor completamente');
  console.log('2. En Cursor, escribe: "Set my Render workspace to My Workspace"');
  console.log('3. Luego puedes usar comandos como:');
  console.log('   - "List my Render services"');
  console.log('   - "Deploy latest commit to PWA service"');
  console.log('   - "Show logs for PWA service"');
  console.log('   - "Why is my PWA service failing?"');
  console.log('');
  console.log(' ¡Ahora puedes gestionar Render desde Cursor!');
  console.log('');
} else {
  console.log(' Configuración preparada pero sin API Key');
  console.log('');
  console.log('Para completar la instalación:');
  console.log('1. Obtén tu API Key de Render');
  console.log('2. Ejecuta: node INSTALAR-RENDER-MCP.js TU_API_KEY');
  console.log('');
  
  // Mostrar configuración que se usará
  console.log('Configuración que se añadirá:');
  console.log(JSON.stringify({
    render: {
      url: 'https://mcp.render.com/mcp',
      headers: {
        'Authorization': 'Bearer <YOUR_API_KEY>'
      }
    }
  }, null, 2));
}
