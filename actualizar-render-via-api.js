#!/usr/bin/env node
/**
 * Actualizar configuración de Render usando su API
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
          const json = JSON.parse(body);
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

async function triggerDeploy() {
  console.log('\n🚀 Iniciando deploy manual...');
  const response = await makeRequest(`/v1/services/${SERVICE_ID}/deploys`, 'POST', {
    clearCache: false
  });
  
  if (response.status === 200 || response.status === 201) {
    console.log('✅ Deploy iniciado correctamente');
    return true;
  } else {
    console.log('⚠️  No se pudo iniciar deploy automático:', response.status);
    return false;
  }
}

async function updateService() {
  console.log('\n📝 Actualizando configuración del servicio...\n');
  
  const updateData = {
    rootDir: 'mcp-server',
    startCommand: 'node index.js',
    autoDeploy: 'yes'
  };

  console.log('📋 Cambios a aplicar:');
  console.log('  - Root Directory: mcp-server');
  console.log('  - Start Command: node index.js');

  console.log('\n⏳ Enviando actualización...');
  const response = await makeRequest(`/v1/services/${SERVICE_ID}`, 'PATCH', updateData);

  if (response.status === 200) {
    console.log('\n✅ Servicio actualizado correctamente');
    console.log('\n📋 Nueva configuración:');
    const service = response.data.service || response.data;
    console.log('  - Root Directory:', service?.rootDir);
    console.log('  - Start Command:', service?.startCommand);
    
    console.log('\n🚀 Ahora necesitas hacer un nuevo deploy manual desde Render Dashboard');
    return true;
  } else {
    console.log('\n❌ Error actualizando:', response.status);
    console.log('Respuesta:', JSON.stringify(response.data, null, 2));
    console.log('\n⚠️  Haz los cambios manualmente en Render Dashboard:');
    console.log('   - Settings > Build & Deploy');
    console.log('   - Root Directory: mcp-server');
    console.log('   - Start Command: node index.js');
    console.log('   - Port: 4042 (en Networking)');
    return false;
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔧 ACTUALIZAR CONFIGURACIÓN DE RENDER');
  console.log('='.repeat(70));
  console.log(`\n🔑 Service ID: ${SERVICE_ID}`);
  console.log('\n📝 Actualizando automáticamente...\n');
  
  const updated = await updateService();
  
  if (updated) {
    console.log('\n🚀 Iniciando deploy automático...');
    await triggerDeploy();
    console.log('\n✅ ¡LISTO! El servicio está actualizado y el deploy debería estar iniciándose.');
    console.log('   Puedes ver el progreso en: https://dashboard.render.com/web/' + SERVICE_ID);
  }

  console.log('\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
