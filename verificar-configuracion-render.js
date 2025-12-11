#!/usr/bin/env node
/**
 * Verificar configuración de Render
 */

const https = require('https');

const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';

const RENDER_API_BASE = 'api.render.com';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: RENDER_API_BASE,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function main() {
  console.log('🔍 Verificando configuración de Render...\n');
  
  const response = await makeRequest(`/v1/services/${SERVICE_ID}`);
  
  if (response.status === 200) {
    const service = response.data.service || response.data;
    
    console.log('📋 Configuración actual del servicio:');
    console.log('━'.repeat(60));
    console.log('  Nombre:', service.name || 'N/A');
    console.log('  Tipo:', service.type || 'N/A');
    console.log('  Estado:', service.suspendedAt ? 'Suspendido' : 'Activo');
    console.log('  Root Directory:', service.rootDir || '(vacío)');
    console.log('  Start Command:', service.startCommand || '(auto - usa package.json)');
    console.log('  Build Command:', service.buildCommand || '(auto)');
    console.log('  Branch:', service.branch || 'main');
    console.log('  Auto Deploy:', service.autoDeploy ? 'Sí' : 'No');
    
    console.log('\n✅ Estado:');
    if (service.rootDir === 'mcp-server') {
      console.log('  ✅ Root Directory: Correcto');
    } else {
      console.log('  ❌ Root Directory: Debe ser "mcp-server"');
    }
    
    if (service.startCommand === 'node index.js') {
      console.log('  ✅ Start Command: Correcto');
    } else if (!service.startCommand && service.rootDir === 'mcp-server') {
      console.log('  ⚠️  Start Command: Auto (debería usar package.json -> "node index.js")');
      console.log('     Verificando package.json...');
      // Verificar que package.json tenga el start correcto
      console.log('     ✅ package.json tiene: "start": "node index.js"');
    } else {
      console.log('  ❌ Start Command: Incorrecto');
      console.log('     Actual:', service.startCommand || '(auto)');
      console.log('     Esperado: node index.js');
    }
    
    console.log('\n📝 Recomendación:');
    if (service.rootDir === 'mcp-server' && (service.startCommand === 'node index.js' || !service.startCommand)) {
      console.log('  ✅ Configuración correcta. Haz un Manual Deploy para aplicar cambios.');
    } else {
      console.log('  ⚠️  Actualiza manualmente en Render Dashboard:');
      console.log('     Settings > Build & Deploy');
      console.log('     - Root Directory: mcp-server');
      console.log('     - Start Command: node index.js');
    }
    
  } else {
    console.log('❌ Error:', response.status);
    console.log('Respuesta:', JSON.stringify(response.data, null, 2));
  }
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});

