#!/usr/bin/env node
/**
 * Test directo de WebSocket a Render
 */

const WebSocket = require('ws');

const RENDER_URL = 'wss://pwa-imbf.onrender.com';
const RENDER_URL_WITH_PORT = 'wss://pwa-imbf.onrender.com:4042';
const RENDER_HTTP = 'https://pwa-imbf.onrender.com';

console.log('🔍 Probando conexión WebSocket a Render...\n');

// Test 1: Sin puerto
console.log('Test 1: wss://pwa-imbf.onrender.com');
testConnection(RENDER_URL);

// Test 2: Con puerto
setTimeout(() => {
  console.log('\nTest 2: wss://pwa-imbf.onrender.com:4042');
  testConnection(RENDER_URL_WITH_PORT);
}, 2000);

// Test 3: HTTP primero para verificar que el servidor está activo
console.log('\nTest 3: Verificando HTTP primero...');
require('https').get(RENDER_HTTP + '/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ HTTP Health Check:', data);
  });
}).on('error', (err) => {
  console.error('❌ HTTP Error:', err.message);
});

function testConnection(url) {
  try {
    const ws = new WebSocket(url, {
      handshakeTimeout: 5000
    });

    ws.on('open', () => {
      console.log(`✅ CONEXIÓN EXITOSA: ${url}`);
      ws.close();
      process.exit(0);
    });

    ws.on('error', (error) => {
      console.error(`❌ ERROR: ${error.message}`);
      console.error(`   URL probada: ${url}`);
    });

    ws.on('close', (code, reason) => {
      console.log(`⚠️ Cerrado: ${code} - ${reason || 'Sin razón'}`);
    });

    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.log('⏱️ Timeout - No se pudo conectar');
        ws.terminate();
      }
    }, 5000);
  } catch (error) {
    console.error(`❌ Exception: ${error.message}`);
  }
}

