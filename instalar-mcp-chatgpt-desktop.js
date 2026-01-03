#!/usr/bin/env node
/**
 * 🔧 INSTALADOR AUTOMÁTICO - Servidor MCP para ChatGPT Desktop
 * 
 * Este script instala automáticamente la configuración del servidor MCP
 * en la ubicación correcta de ChatGPT Desktop en Windows.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Obtener ruta absoluta del servidor MCP
const MCP_SERVER_PATH = path.resolve(__dirname, 'mcp-server-chatgpt.js');

// Ubicaciones posibles de configuración de ChatGPT Desktop en Windows
const POSSIBLE_CONFIG_PATHS = [
  path.join(os.homedir(), 'AppData', 'Roaming', 'ChatGPT', 'mcp.json'),
  path.join(os.homedir(), '.chatgpt', 'mcp.json'),
  path.join(os.homedir(), 'AppData', 'Local', 'ChatGPT', 'mcp.json'),
  path.join(os.homedir(), 'AppData', 'Roaming', 'OpenAI', 'ChatGPT', 'mcp.json'),
];

// Configuración MCP
const MCP_CONFIG = {
  mcpServers: {
    "guests-valencia-pwa": {
      command: "node",
      args: [MCP_SERVER_PATH],
      env: {
        NODE_ENV: "production"
      },
      description: "Servidor MCP unificado - Level Enterprise by Power HGPT - Level Galaxy - Ejecución de código y trabajo en equipo con O3 Pro High"
    }
  }
};

console.log('🚀 Instalador de Servidor MCP para ChatGPT Desktop\n');
console.log('📋 Buscando ubicación de configuración de ChatGPT Desktop...\n');

// Intentar encontrar o crear el archivo de configuración
let configPath = null;
let configDir = null;

for (const possiblePath of POSSIBLE_CONFIG_PATHS) {
  const dir = path.dirname(possiblePath);
  
  try {
    // Verificar si el directorio existe o puede crearse
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Directorio creado: ${dir}`);
    }
    
    configPath = possiblePath;
    configDir = dir;
    break;
  } catch (error) {
    // Continuar con la siguiente ubicación
    continue;
  }
}

if (!configPath) {
  // Si no encontramos ninguna ubicación, usar la primera como predeterminada
  configPath = POSSIBLE_CONFIG_PATHS[0];
  configDir = path.dirname(configPath);
  
  try {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(`✅ Directorio creado: ${configDir}`);
  } catch (error) {
    console.error('❌ Error al crear directorio:', error.message);
    process.exit(1);
  }
}

console.log(`📁 Ubicación de configuración: ${configPath}\n`);

// Verificar si ya existe un archivo de configuración
let existingConfig = {};
if (fs.existsSync(configPath)) {
  try {
    const existingContent = fs.readFileSync(configPath, 'utf-8');
    existingConfig = JSON.parse(existingContent);
    console.log('📄 Archivo de configuración existente encontrado');
    console.log('🔄 Actualizando configuración...\n');
  } catch (error) {
    console.log('⚠️  Archivo de configuración existente con formato inválido');
    console.log('📝 Creando nueva configuración...\n');
  }
} else {
  console.log('📝 Creando nuevo archivo de configuración...\n');
}

// Fusionar configuraciones (mantener otros servidores si existen)
const mergedConfig = {
  ...existingConfig,
  mcpServers: {
    ...(existingConfig.mcpServers || {}),
    ...MCP_CONFIG.mcpServers,
  }
};

// Escribir configuración
try {
  fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2), 'utf-8');
  console.log('✅ Configuración instalada exitosamente!\n');
  console.log('📋 Detalles de la instalación:');
  console.log(`   • Archivo: ${configPath}`);
  console.log(`   • Servidor: guests-valencia-pwa`);
  console.log(`   • Comando: node ${MCP_SERVER_PATH}`);
  console.log(`   • Versión: 2.0.0`);
  console.log(`   • Herramientas: 14 (7 lectura + 7 ejecución)\n`);
  
  console.log('🎯 Próximos pasos:');
  console.log('   1. Reinicia ChatGPT Desktop');
  console.log('   2. El servidor MCP se conectará automáticamente');
  console.log('   3. Verás el mensaje de bienvenida de O3 Pro High\n');
  
  console.log('💡 Si ChatGPT Desktop no detecta el servidor:');
  console.log(`   • Verifica que Node.js esté en el PATH`);
  console.log(`   • Verifica que el archivo existe: ${MCP_SERVER_PATH}`);
  console.log(`   • Revisa los logs de ChatGPT Desktop para errores\n`);
  
} catch (error) {
  console.error('❌ Error al escribir configuración:', error.message);
  process.exit(1);
}

// Crear también un archivo de respaldo en el proyecto
const backupPath = path.join(__dirname, 'chatgpt-desktop-mcp-config-installed.json');
try {
  fs.writeFileSync(backupPath, JSON.stringify(mergedConfig, null, 2), 'utf-8');
  console.log(`💾 Respaldo guardado en: ${backupPath}\n`);
} catch (error) {
  console.warn('⚠️  No se pudo crear respaldo:', error.message);
}

console.log('🎉 ¡Instalación completada!\n');
