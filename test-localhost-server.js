#!/usr/bin/env node
/**
 * Test completo del servidor localhost
 * Verifica que todo esté funcionando antes de avisar al usuario
 */

const http = require('http');
const WebSocket = require('ws');

const SERVER_URL = 'http://localhost:4042';
const WS_URL = 'ws://localhost:4042';

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  return new Promise((resolve) => {
    fn()
      .then(() => {
        console.log(`✅ ${name}`);
        testsPassed++;
        resolve();
      })
      .catch((error) => {
        console.log(`❌ ${name}: ${error.message}`);
        testsFailed++;
        resolve();
      });
  });
}

async function testHealthCheck() {
  return new Promise((resolve, reject) => {
    http.get(`${SERVER_URL}/health`, (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`Status ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function testAPIStatus() {
  return new Promise((resolve, reject) => {
    http.get(`${SERVER_URL}/api/status`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.server === 'MCP-SANDRA') {
            resolve();
          } else {
            reject(new Error('Invalid response'));
          }
        } catch (e) {
          reject(new Error('Invalid JSON'));
        }
      });
    }).on('error', reject);
  });
}

async function testWebSocket() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Timeout'));
    }, 5000);

    ws.on('open', () => {
      clearTimeout(timeout);
      ws.close();
      resolve();
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function testWebSocketMessage() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Timeout'));
    }, 5000);

    ws.on('open', () => {
      ws.send(JSON.stringify({
        route: 'system',
        action: 'ping',
        payload: {}
      }));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.route || msg.error) {
          clearTimeout(timeout);
          ws.close();
          resolve();
        }
      } catch (e) {
        // Ignore
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function main() {
  console.log('🧪 TESTING SERVIDOR LOCALHOST\n');
  console.log('='.repeat(60));
  console.log(`Servidor: ${SERVER_URL}`);
  console.log(`WebSocket: ${WS_URL}`);
  console.log('='.repeat(60) + '\n');

  // Esperar un poco para que el servidor esté listo
  await new Promise(resolve => setTimeout(resolve, 2000));

  await test('Health Check', testHealthCheck);
  await test('API Status', testAPIStatus);
  await test('WebSocket Connection', testWebSocket);
  await test('WebSocket Message', testWebSocketMessage);

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Tests pasados: ${testsPassed}`);
  console.log(`❌ Tests fallidos: ${testsFailed}`);
  console.log('='.repeat(60) + '\n');

  if (testsFailed === 0) {
    console.log('🎉 ¡SERVIDOR FUNCIONANDO CORRECTAMENTE!');
    console.log('\n📡 Puedes conectarte a:');
    console.log(`   - HTTP: ${SERVER_URL}`);
    console.log(`   - WebSocket: ${WS_URL}`);
    console.log('\n✅ El servidor está listo para usar.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Algunos tests fallaron. Revisa el servidor.\n');
    process.exit(1);
  }
}

main().catch(console.error);

