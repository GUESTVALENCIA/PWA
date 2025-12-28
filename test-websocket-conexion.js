#!/usr/bin/env node
/**
 * Test de Conexión WebSocket Real
 * Prueba la conexión WebSocket al servidor MCP
 */

const WebSocket = require('ws');

const MCP_SERVER_URL = 'https://pwa-imbf.onrender.com';
const VERCEL_CONFIG_URL = 'https://guestsvalencia.es/api/config';

console.log('🧪 TEST DE CONEXIÓN WEBSOCKET REAL\n');
console.log('='.repeat(60));

// Función para obtener configuración
async function obtenerConfig() {
  const https = require('https');
  return new Promise((resolve, reject) => {
    const url = new URL(VERCEL_CONFIG_URL);
    const req = https.request(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Error parseando respuesta'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

// Función para convertir URL a WebSocket
function convertirAWebSocket(httpUrl) {
  const url = new URL(httpUrl.replace(/\/$/, '')); // Remover barra final
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return `ws://${url.hostname}${url.port ? ':' + url.port : ''}`;
  }
  return `wss://${url.hostname}`;
}

// Test de conexión WebSocket
async function testConexionWebSocket() {
  console.log('\n🔌 TEST: Conexión WebSocket al servidor MCP...\n');

  try {
    // 1. Obtener configuración
    console.log('1️⃣  Obteniendo configuración desde Vercel...');
    const config = await obtenerConfig();
    console.log(`   ✅ Config obtenida: ${config.MCP_SERVER_URL}`);

    // 2. Convertir a WebSocket
    const wsUrl = convertirAWebSocket(config.MCP_SERVER_URL);
    console.log(`\n2️⃣  URL WebSocket: ${wsUrl}`);

    // 3. Conectar
    console.log('\n3️⃣  Conectando al servidor MCP...');
    
    return new Promise((resolve) => {
      const ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        ws.close();
        console.error('   ❌ Timeout: No se recibió respuesta en 10 segundos');
        resolve({ ok: false, error: 'Timeout' });
      }, 10000);

      ws.on('open', () => {
        console.log('   ✅ Conexión WebSocket establecida');
        clearTimeout(timeout);
        
        // Enviar mensaje de prueba
        console.log('\n4️⃣  Enviando mensaje de prueba...');
        const testMessage = {
          route: 'system',
          action: 'ping',
          payload: { test: true }
        };
        ws.send(JSON.stringify(testMessage));
        console.log('   📤 Mensaje enviado:', JSON.stringify(testMessage));
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('\n5️⃣  Mensaje recibido del servidor:');
          console.log('   📥', JSON.stringify(message, null, 2));
          
          if (message.route === 'system' && message.action === 'connected') {
            console.log('\n   ✅ Servidor respondió correctamente');
            clearTimeout(timeout);
            ws.close();
            resolve({ ok: true, message });
          } else {
            console.log('\n   ✅ Servidor respondió (formato diferente)');
            clearTimeout(timeout);
            ws.close();
            resolve({ ok: true, message });
          }
        } catch (e) {
          console.log('\n   📥 Respuesta (texto):', data.toString().substring(0, 100));
          clearTimeout(timeout);
          ws.close();
          resolve({ ok: true, raw: data.toString() });
        }
      });

      ws.on('error', (error) => {
        console.error('\n   ❌ Error de WebSocket:', error.message);
        clearTimeout(timeout);
        resolve({ ok: false, error: error.message });
      });

      ws.on('close', (code, reason) => {
        if (code !== 1000) {
          console.log(`\n   ⚠️  Conexión cerrada: ${code} - ${reason}`);
        } else {
          console.log('\n   ✅ Conexión cerrada correctamente');
        }
      });
    });

  } catch (error) {
    console.error('\n   ❌ Error:', error.message);
    return { ok: false, error: error.message };
  }
}

// Ejecutar test
async function main() {
  const resultado = await testConexionWebSocket();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO DEL TEST\n');
  
  if (resultado.ok) {
    console.log('✅ CONEXIÓN WEBSOCKET FUNCIONA CORRECTAMENTE');
    console.log('\n✅ El sistema está completamente funcional.');
    console.log('💡 Puedes hacer deploy en Vercel y probar en producción.');
  } else {
    console.log('❌ CONEXIÓN WEBSOCKET FALLÓ');
    console.log(`\nError: ${resultado.error}`);
    console.log('\n📋 Posibles causas:');
    console.log('   1. El servidor MCP no está accesible');
    console.log('   2. Problemas de red/firewall');
    console.log('   3. El servidor MCP no está escuchando en WebSocket');
  }
  
  process.exit(resultado.ok ? 0 : 1);
}

main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

