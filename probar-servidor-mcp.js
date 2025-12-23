#!/usr/bin/env node
/**
 * Probar el servidor MCP directamente
 */

const https = require('https');

const SERVICE_URL = 'https://pwa-imbf.onrender.com';

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const url = new URL(path, SERVICE_URL);
    
    console.log(`\n Probando: ${description}`);
    console.log(`   URL: ${url.href}`);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'MCP-Verifier/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('    Servidor respondiendo correctamente');
          try {
            const json = JSON.parse(body);
            console.log('   Respuesta:', JSON.stringify(json, null, 2).substring(0, 300));
          } catch (e) {
            console.log('   Respuesta:', body.substring(0, 200));
          }
          resolve({ success: true, status: res.statusCode, body });
        } else if (res.statusCode === 404) {
          console.log('     Ruta no encontrada (pero servidor está activo)');
          resolve({ success: true, status: res.statusCode });
        } else {
          console.log(`     Status ${res.statusCode}`);
          resolve({ success: false, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`    Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      console.log('   ⏱  Timeout');
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.end();
  });
}

async function main() {
  console.log('='.repeat(70));
  console.log(' PRUEBA DIRECTA DEL SERVIDOR MCP');
  console.log('='.repeat(70));
  console.log(`\n URL del servicio: ${SERVICE_URL}\n`);

  const results = {
    root: false,
    health: false,
    mcpRouter: false
  };

  // 1. Probar root
  const rootResult = await testEndpoint('/', 'Root (/)');
  results.root = rootResult.success;

  // 2. Probar endpoint de health si existe
  const healthResult = await testEndpoint('/health', 'Health Check (/health)');
  results.health = healthResult.success;

  // 3. Probar MCP Router
  const routerResult = await testEndpoint('/mcp-router', 'MCP Router (/mcp-router)');
  results.mcpRouter = routerResult.success;

  // Resumen
  console.log('\n' + '='.repeat(70));
  console.log(' RESULTADOS');
  console.log('='.repeat(70));
  
  if (results.root || results.health || results.mcpRouter) {
    console.log('\n SERVIDOR ACTIVO Y FUNCIONANDO');
    console.log('\n Endpoints probados:');
    console.log(`   ${results.root ? '' : ''} Root (/)`);
    console.log(`   ${results.health ? '' : ' '} Health Check (/health)`);
    console.log(`   ${results.mcpRouter ? '' : ' '} MCP Router (/mcp-router)`);
    
    console.log('\n El servidor está respondiendo correctamente');
    console.log(' Deploy verificado exitosamente');
  } else {
    console.log('\n SERVIDOR NO RESPONDE');
    console.log('\n  Posibles causas:');
    console.log('   - El servidor aún está desplegándose');
    console.log('   - El servidor no está corriendo');
    console.log('   - Problema de conectividad');
    console.log('\n Verifica los logs en Render Dashboard');
  }

  console.log('\n Dashboard: https://dashboard.render.com/web/srv-d4sqhoeuk2gs73f1ba8g');
  console.log('\n');
}

main().catch(error => {
  console.error('\n Error:', error);
  process.exit(1);
});

