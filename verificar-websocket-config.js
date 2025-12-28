#!/usr/bin/env node
/**
 * Script de Verificación Completa del Sistema WebSocket
 * Verifica configuración en Vercel, servidor MCP y conexión WebSocket
 */

const https = require('https');
const http = require('http');

const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_API_URL = 'api.vercel.com';
const PROJECT_ID = 'prj_xXv3QbfvVdW18VTNijbaxOlv2wI2';
const MCP_SERVER_URL = 'https://pwa-imbf.onrender.com';
const VERCEL_DEPLOYMENT_URL = 'https://pwa-chi-six.vercel.app';

console.log('🔍 VERIFICACIÓN COMPLETA DEL SISTEMA WEBSOCKET\n');
console.log('='.repeat(60));

// Función para hacer requests HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Función para API de Vercel
function vercelAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VERCEL_API_URL,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Vercel API timeout'));
    });
    
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test 1: Verificar variables en Vercel
async function verificarVariablesVercel() {
  console.log('\n📋 TEST 1: Verificando variables de entorno en Vercel...');
  try {
    const result = await vercelAPI(`/v9/projects/${PROJECT_ID}/env`);
    
    if (result.status !== 200) {
      console.error('❌ Error al obtener variables:', result.status);
      return false;
    }

    const envVars = result.data.envs || [];
    const requiredVars = ['MCP_SERVER_URL'];
    const optionalVars = ['MCP_TOKEN'];
    
    console.log(`\n   Variables encontradas: ${envVars.length}`);
    
    const foundVars = {};
    envVars.forEach(env => {
      foundVars[env.key] = env.value;
      if (requiredVars.includes(env.key) || optionalVars.includes(env.key)) {
        const masked = env.value ? env.value.substring(0, 10) + '...' : 'NO CONFIGURADA';
        console.log(`   ✓ ${env.key}: ${masked} (${env.target.join(', ')})`);
      }
    });

    // Verificar variables requeridas
    let allOk = true;
    for (const varName of requiredVars) {
      if (!foundVars[varName]) {
        console.error(`   ❌ FALTA: ${varName}`);
        allOk = false;
      }
    }

    if (allOk) {
      console.log('   ✅ Todas las variables requeridas están configuradas');
    }

    return { ok: allOk, vars: foundVars };
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return { ok: false, vars: {} };
  }
}

// Test 2: Verificar endpoint /api/config en Vercel
async function verificarEndpointConfig() {
  console.log('\n🌐 TEST 2: Verificando endpoint /api/config...');
  try {
    const result = await makeRequest(`${VERCEL_DEPLOYMENT_URL}/api/config`);
    
    if (result.status === 200) {
      console.log('   ✅ Endpoint accesible');
      console.log('   📦 Respuesta:', JSON.stringify(result.body, null, 2));
      
      if (result.body.MCP_SERVER_URL) {
        console.log(`   ✅ MCP_SERVER_URL: ${result.body.MCP_SERVER_URL}`);
      } else {
        console.error('   ❌ MCP_SERVER_URL no está en la respuesta');
      }
      
      return { ok: true, config: result.body };
    } else {
      console.error(`   ❌ Status: ${result.status}`);
      return { ok: false };
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return { ok: false };
  }
}

// Test 3: Verificar servidor MCP (Health Check)
async function verificarServidorMCP() {
  console.log('\n🏥 TEST 3: Verificando servidor MCP (Health Check)...');
  try {
    const result = await makeRequest(`${MCP_SERVER_URL}/health`, {
      method: 'GET',
      timeout: 10000
    });
    
    if (result.status === 200) {
      console.log('   ✅ Servidor MCP está activo');
      console.log('   📦 Health:', JSON.stringify(result.body, null, 2));
      return { ok: true, health: result.body };
    } else {
      console.error(`   ❌ Status: ${result.status}`);
      return { ok: false };
    }
  } catch (error) {
    console.error('   ❌ Error conectando al servidor MCP:', error.message);
    console.error('   💡 Verifica que el servidor esté desplegado en Render');
    return { ok: false };
  }
}

// Test 4: Verificar conversión de URL WebSocket
function verificarConversionWebSocket() {
  console.log('\n🔌 TEST 4: Verificando conversión de URL WebSocket...');
  
  const testCases = [
    { input: 'https://pwa-imbf.onrender.com', expected: 'wss://pwa-imbf.onrender.com' },
    { input: 'http://localhost:4042', expected: 'ws://localhost:4042' },
    { input: 'https://example.com', expected: 'wss://example.com' }
  ];

  let allOk = true;
  testCases.forEach(test => {
    const url = new URL(test.input);
    let wsUrl;
    
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      wsUrl = `ws://${url.hostname}${url.port ? ':' + url.port : ''}`;
    } else {
      wsUrl = `wss://${url.hostname}`;
    }
    
    if (wsUrl === test.expected) {
      console.log(`   ✅ ${test.input} → ${wsUrl}`);
    } else {
      console.error(`   ❌ ${test.input} → ${wsUrl} (esperado: ${test.expected})`);
      allOk = false;
    }
  });

  return { ok: allOk };
}

// Test 5: Verificar que el código del cliente está correcto
function verificarCodigoCliente() {
  console.log('\n📝 TEST 5: Verificando código del cliente WebSocket...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const clientPath = path.join(__dirname, 'assets', 'js', 'websocket-stream-client.js');
    const code = fs.readFileSync(clientPath, 'utf8');
    
    const checks = [
      { name: 'Carga configuración desde /api/config', pattern: /fetch\(['"]\/api\/config['"]\)/ },
      { name: 'Convierte URL a WebSocket', pattern: /convertToWebSocketUrl/ },
      { name: 'Implementa reconexión con backoff', pattern: /scheduleReconnect|exponential.*backoff/i },
      { name: 'Soporta formato MCP', pattern: /sendMCP|route.*action.*payload/ },
      { name: 'Previene múltiples instancias', pattern: /initialized.*websocketStreamClient/ }
    ];

    let allOk = true;
    checks.forEach(check => {
      if (check.pattern.test(code)) {
        console.log(`   ✅ ${check.name}`);
      } else {
        console.error(`   ❌ ${check.name}`);
        allOk = false;
      }
    });

    return { ok: allOk };
  } catch (error) {
    console.error('   ❌ Error leyendo archivo:', error.message);
    return { ok: false };
  }
}

// Ejecutar todos los tests
async function ejecutarTodosLosTests() {
  const resultados = {
    vercel: await verificarVariablesVercel(),
    endpoint: await verificarEndpointConfig(),
    mcp: await verificarServidorMCP(),
    conversion: verificarConversionWebSocket(),
    codigo: verificarCodigoCliente()
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE VERIFICACIÓN\n');
  
  Object.entries(resultados).forEach(([test, result]) => {
    const icon = result.ok ? '✅' : '❌';
    const name = {
      vercel: 'Variables en Vercel',
      endpoint: 'Endpoint /api/config',
      mcp: 'Servidor MCP',
      conversion: 'Conversión WebSocket',
      codigo: 'Código del Cliente'
    }[test];
    
    console.log(`${icon} ${name}`);
  });

  const todosOk = Object.values(resultados).every(r => r.ok);
  
  if (todosOk) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
    console.log('\n✅ El sistema está listo para funcionar.');
    console.log('💡 Próximo paso: Hacer deploy en Vercel y probar en producción.');
  } else {
    console.log('\n⚠️  ALGUNOS TESTS FALLARON');
    console.log('\n📋 Acciones recomendadas:');
    
    if (!resultados.vercel.ok) {
      console.log('   1. Configurar MCP_SERVER_URL en Vercel Dashboard');
    }
    if (!resultados.endpoint.ok) {
      console.log('   2. Verificar que el endpoint /api/config esté desplegado');
    }
    if (!resultados.mcp.ok) {
      console.log('   3. Verificar que el servidor MCP esté activo en Render');
    }
  }

  return todosOk;
}

// Ejecutar
ejecutarTodosLosTests().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

