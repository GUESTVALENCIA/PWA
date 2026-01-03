#!/usr/bin/env node
/**
 * 🧪 Script de Prueba para Servidor MCP
 * 
 * Prueba básica del servidor MCP sin necesidad de ChatGPT Desktop
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Probando servidor MCP...\n');

// Comando para probar el servidor
const serverPath = path.join(__dirname, 'mcp-server-chatgpt.js');

// Mensaje de prueba (JSON-RPC 2.0)
const testMessage = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0',
    },
  },
}) + '\n';

console.log('📤 Enviando mensaje de inicialización...');
console.log('Mensaje:', testMessage.trim());
console.log('\n');

// Ejecutar servidor
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: __dirname,
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('📥 Respuesta:', data.toString().trim());
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.error('⚠️  Error:', data.toString().trim());
});

server.on('close', (code) => {
  console.log('\n✅ Servidor cerrado con código:', code);
  if (output) {
    console.log('\n📋 Salida completa:');
    console.log(output);
  }
  if (errorOutput) {
    console.log('\n⚠️  Errores:');
    console.log(errorOutput);
  }
  
  if (code === 0) {
    console.log('\n🎉 ¡Servidor MCP funcionando correctamente!');
  } else {
    console.log('\n❌ El servidor tuvo problemas. Revisa los errores arriba.');
  }
});

// Enviar mensaje después de un breve delay
setTimeout(() => {
  server.stdin.write(testMessage);
  setTimeout(() => {
    server.kill();
  }, 2000);
}, 500);

// Timeout de seguridad
setTimeout(() => {
  if (!server.killed) {
    console.log('\n⏱️  Timeout alcanzado, cerrando servidor...');
    server.kill();
  }
}, 5000);
