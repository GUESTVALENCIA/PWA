#!/usr/bin/env node
/**
 * Configurar Render completamente usando API
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
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
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

async function getService() {
  console.log('\n🔍 Obteniendo información del servicio...');
  const response = await makeRequest(`/v1/services/${SERVICE_ID}`);
  
  if (response.status === 200) {
    console.log('✅ Servicio encontrado');
    return response.data;
  } else {
    console.log(`❌ Error ${response.status}:`, JSON.stringify(response.data, null, 2));
    return null;
  }
}

async function updateServiceConfig() {
  console.log('\n📝 Actualizando configuración completa...\n');
  
  // Primero obtenemos el servicio actual
  const currentService = await getService();
  if (!currentService) {
    console.log('⚠️  No se pudo obtener el servicio actual');
    return false;
  }

  console.log('📋 Configuración actual:');
  const service = currentService.service || currentService;
  console.log('  - Root Directory:', service.rootDir || '(vacío)');
  console.log('  - Start Command:', service.startCommand || '(auto)');
  console.log('  - Build Command:', service.buildCommand || '(auto)');

  // Preparar actualización
  const updateData = {
    rootDir: 'mcp-server',
    startCommand: 'node index.js',
    buildCommand: 'npm install'
  };

  console.log('\n📋 Nueva configuración:');
  console.log('  - Root Directory: mcp-server');
  console.log('  - Start Command: node index.js');
  console.log('  - Build Command: npm install');

  console.log('\n⏳ Enviando actualización...');
  const response = await makeRequest(`/v1/services/${SERVICE_ID}`, 'PATCH', updateData);

  if (response.status === 200) {
    console.log('\n✅ Servicio actualizado correctamente');
    const updated = response.data.service || response.data;
    console.log('\n📋 Configuración aplicada:');
    console.log('  - Root Directory:', updated.rootDir);
    console.log('  - Start Command:', updated.startCommand || '(por verificar)');
    console.log('  - Build Command:', updated.buildCommand || '(por verificar)');
    return true;
  } else {
    console.log(`\n❌ Error ${response.status} al actualizar`);
    console.log('Respuesta:', JSON.stringify(response.data, null, 2));
    
    // Intentar método alternativo: actualizar solo startCommand
    console.log('\n🔄 Intentando método alternativo...');
    const altResponse = await makeRequest(`/v1/services/${SERVICE_ID}`, 'PATCH', {
      startCommand: 'node index.js'
    });
    
    if (altResponse.status === 200) {
      console.log('✅ Start Command actualizado');
      return true;
    } else {
      console.log(`❌ Método alternativo falló: ${altResponse.status}`);
      return false;
    }
  }
}

async function triggerManualDeploy() {
  console.log('\n🚀 Intentando iniciar deploy manual...');
  
  // Método 1: POST a /deploys
  const response1 = await makeRequest(`/v1/services/${SERVICE_ID}/deploys`, 'POST', {
    clearCache: false
  });

  if (response1.status === 200 || response1.status === 201) {
    console.log('✅ Deploy iniciado correctamente');
    return true;
  }

  // Método 2: GET deploy y luego trigger
  const deploysResponse = await makeRequest(`/v1/services/${SERVICE_ID}/deploys`);
  if (deploysResponse.status === 200 && deploysResponse.data.deploys) {
    console.log('📋 Deploys encontrados');
    console.log('⚠️  Por favor, inicia el deploy manualmente desde Render Dashboard');
    return false;
  }

  console.log('⚠️  No se pudo iniciar deploy automático');
  return false;
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔧 CONFIGURACIÓN COMPLETA DE RENDER');
  console.log('='.repeat(70));
  console.log(`\n🔑 Service ID: ${SERVICE_ID}`);

  const updated = await updateServiceConfig();
  
  if (updated) {
    console.log('\n' + '='.repeat(70));
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('='.repeat(70));
    console.log('\n📋 Cambios aplicados:');
    console.log('  ✅ Root Directory: mcp-server');
    console.log('  ✅ Start Command: node index.js');
    console.log('  ✅ Build Command: npm install');
    
    console.log('\n🚀 Iniciando deploy...');
    const deployStarted = await triggerManualDeploy();
    
    if (!deployStarted) {
      console.log('\n📝 PRÓXIMOS PASOS:');
      console.log('   1. Ve a: https://dashboard.render.com/web/' + SERVICE_ID);
      console.log('   2. Click en "Deploys"');
      console.log('   3. Click en "Manual Deploy"');
      console.log('   4. Espera a que termine el deploy');
    }
    
    console.log('\n🔍 Verifica los logs para confirmar:');
    console.log('   Deberías ver: "Running \'node index.js\'"');
    console.log('   Y NO: "Running \'node server.js\'"');
  } else {
    console.log('\n❌ No se pudo completar la configuración automática');
    console.log('\n📝 CAMBIOS MANUALES REQUERIDOS:');
    console.log('   1. Ve a: https://dashboard.render.com/web/' + SERVICE_ID);
    console.log('   2. Settings > Build & Deploy');
    console.log('   3. Root Directory: mcp-server');
    console.log('   4. Start Command: node index.js');
    console.log('   5. Settings > Networking > Port: 4042');
  }

  console.log('\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  if (error.stack) {
    console.error('\nStack:', error.stack);
  }
  process.exit(1);
});

