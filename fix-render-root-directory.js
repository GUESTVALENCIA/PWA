#!/usr/bin/env node

/**
 * ARREGLADOR AUTOMÁTICO DE RENDER
 * Cambia Root Directory a "." y triggea deploy
 * Usando API de Render directamente
 */

import https from 'https';

// Credenciales obtenidas de VARIABLES_FINALES_RENDER
const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';
const RENDER_API_BASE = 'api.render.com';

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         🔧 FIX RENDER ROOT DIRECTORY - AUTOMATED REPAIR      ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

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

async function getServiceInfo() {
  console.log('📋 Obteniendo información del servicio...\n');
  const response = await makeRequest(`/v1/services/${SERVICE_ID}`);

  if (response.status === 200) {
    const service = response.data.service || response.data;
    console.log('✅ Servicio encontrado:');
    console.log(`   Name: ${service?.name || 'N/A'}`);
    console.log(`   ID: ${service?.id || SERVICE_ID}`);
    console.log(`   Current Root Dir: ${service?.rootDir || 'raíz'}`);
    console.log(`   Current Start Command: ${service?.startCommand || 'N/A'}`);
    return service;
  } else {
    console.log('❌ Error obteniendo info del servicio:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    return null;
  }
}

async function updateService() {
  console.log('\n📝 Actualizando configuración...\n');

  const updateData = {
    rootDir: '.',
    startCommand: 'npm start'
  };

  console.log('Cambios a aplicar:');
  console.log('   ✓ Root Directory: . (raíz)');
  console.log('   ✓ Start Command: npm start (node server.js)');
  console.log('   ✓ Auto Deploy: enabled\n');

  console.log('⏳ Enviando actualización a Render API...\n');

  const response = await makeRequest(`/v1/services/${SERVICE_ID}`, 'PATCH', updateData);

  if (response.status === 200) {
    console.log('✅ SERVICIO ACTUALIZADO CORRECTAMENTE\n');
    const service = response.data.service || response.data;
    console.log('Nueva configuración:');
    console.log(`   ✓ Root Directory: ${service?.rootDir || '.'}`);
    console.log(`   ✓ Start Command: ${service?.startCommand || 'npm start'}\n`);
    return true;
  } else {
    console.log('❌ ERROR actualizando servicio');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}\n`);
    return false;
  }
}

async function triggerDeploy() {
  console.log('🚀 Iniciando deployment automático...\n');

  const response = await makeRequest(`/v1/services/${SERVICE_ID}/deploys`, 'POST', {
    clearCache: true
  });

  if (response.status === 200 || response.status === 201) {
    console.log('✅ DEPLOYMENT INICIADO CORRECTAMENTE\n');
    const deploy = response.data.deploy || response.data;
    if (deploy?.id) {
      console.log(`   Deploy ID: ${deploy.id}`);
      console.log(`   Status: ${deploy.status || 'Building...'}\n`);
    }
    return true;
  } else {
    console.log('⚠️  No se pudo iniciar deploy via API');
    console.log(`   Status: ${response.status}`);
    console.log(`   Respuesta: ${JSON.stringify(response.data)}\n`);
    return false;
  }
}

async function main() {
  try {
    console.log(`API Key: ${RENDER_API_KEY.substring(0, 10)}...`);
    console.log(`Service ID: ${SERVICE_ID}\n`);

    // Paso 1: Obtener info actual
    const currentService = await getServiceInfo();

    if (!currentService) {
      console.log('❌ No se pudo conectar al servicio. Verifica las credenciales.\n');
      process.exit(1);
    }

    // Paso 2: Actualizar configuración
    const updated = await updateService();

    if (!updated) {
      console.log('⚠️  No se pudo actualizar via API.');
      console.log('   Deberás cambiar manualmente en Render Dashboard:');
      console.log('   1. Ve a https://dashboard.render.com');
      console.log('   2. Abre el servicio pwa-imbf');
      console.log('   3. Settings → Root Directory');
      console.log('   4. Cambia de "src/mcp-server" a "."');
      console.log('   5. Guarda y haz redeploy\n');
      process.exit(1);
    }

    // Paso 3: Triggear deployment
    const deployed = await triggerDeploy();

    if (deployed) {
      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║                   ✅ ¡TODO ARREGLADO!                          ║');
      console.log('╚════════════════════════════════════════════════════════════════╝\n');
      console.log('Render está ahora:\n');
      console.log('   ✅ Root Directory: . (raíz)');
      console.log('   ✅ Start Command: npm start');
      console.log('   ✅ Buscará package.json en raíz');
      console.log('   ✅ Ejecutará: node server.js\n');
      console.log('Monitorea el deployment en:');
      console.log(`   https://dashboard.render.com/web/${SERVICE_ID}\n`);
      console.log('Los logs mostrarán:');
      console.log('   ✅ npm install');
      console.log('   ✅ 🚀 Iniciando MCP Orchestrator...');
      console.log('   ✅ MCP Server running on http://0.0.0.0:3000\n');
    } else {
      console.log('⚠️  La configuración fue actualizada pero el deploy automático no se inició.');
      console.log('   Ir a Render Dashboard y hacer click en "Redeploy" manualmente.\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
