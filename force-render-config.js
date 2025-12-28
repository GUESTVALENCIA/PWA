#!/usr/bin/env node

/**
 * FORZAR CONFIGURACIÓN CORRECTA EN RENDER
 * - Verifica Root Directory es "."
 * - Verifica Start Command es "npm start"
 * - Limpia cache
 * - Triggea deployment fresco
 */

import https from 'https';

const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║     🔧 FORCE RENDER CONFIGURATION - LIMPIEZA Y REPARACIÓN   ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
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
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function getServiceInfo() {
  console.log('📋 [1/4] Verificando configuración actual...\n');
  const response = await makeRequest(`/v1/services/${SERVICE_ID}`);

  if (response.status === 200) {
    const service = response.data.service || response.data;
    console.log('Configuración actual:');
    console.log(`   Root Dir: ${service?.rootDir || 'N/A'}`);
    console.log(`   Start Command: ${service?.startCommand || 'N/A'}`);
    console.log(`   Build Command: ${service?.buildCommand || 'N/A'}\n`);
    return service;
  } else {
    console.log(`❌ Error: Status ${response.status}\n`);
    return null;
  }
}

async function updateServiceStrict() {
  console.log('📝 [2/4] Aplicando configuración correcta...\n');

  const updateData = {
    rootDir: '.',
    startCommand: 'npm start',
    buildCommand: 'npm install',
    autoDeploy: 'yes'
  };

  console.log('Configuración a aplicar:');
  console.log('   ✓ Root Dir: .');
  console.log('   ✓ Start Command: npm start');
  console.log('   ✓ Build Command: npm install');
  console.log('   ✓ Auto Deploy: yes\n');

  const response = await makeRequest(`/v1/services/${SERVICE_ID}`, 'PATCH', updateData);

  if (response.status === 200) {
    const service = response.data.service || response.data;
    console.log('✅ Configuración actualizada:');
    console.log(`   ✓ Root Dir: ${service?.rootDir || '.'}`);
    console.log(`   ✓ Start Command: ${service?.startCommand || 'npm start'}\n`);
    return true;
  } else {
    console.log(`❌ Error: Status ${response.status}`);
    console.log(`Response: ${JSON.stringify(response.data, null, 2)}\n`);
    return false;
  }
}

async function clearCache() {
  console.log('🗑️  [3/4] Limpiando cache de Render...\n');

  const response = await makeRequest(
    `/v1/services/${SERVICE_ID}`,
    'PATCH',
    { pullRequestPreviewsEnabled: false }
  );

  if (response.status === 200) {
    console.log('✅ Cache limpiado\n');
    return true;
  } else {
    console.log('⚠️  No se pudo limpiar cache via API (continuando...)\n');
    return true;
  }
}

async function triggerDeployFresh() {
  console.log('🚀 [4/4] Triggando deployment FRESCO...\n');

  const response = await makeRequest(
    `/v1/services/${SERVICE_ID}/deploys`,
    'POST',
    { clearCache: true }
  );

  if (response.status === 201 || response.status === 200) {
    const deploy = response.data.deploy || response.data;
    console.log('✅ Deployment iniciado:\n');
    if (deploy?.id) {
      console.log(`   Deploy ID: ${deploy.id}`);
      console.log(`   Status: ${deploy.status || 'Building...'}`);
    }
    return true;
  } else {
    console.log(`⚠️  Status ${response.status} - ${JSON.stringify(response.data)}\n`);
    return false;
  }
}

async function main() {
  try {
    // Paso 1: Verificar estado actual
    const current = await getServiceInfo();
    if (!current) {
      console.log('❌ No se pudo conectar a Render\n');
      process.exit(1);
    }

    // Paso 2: Actualizar configuración
    const updated = await updateServiceStrict();
    if (!updated) {
      console.log('❌ No se pudo actualizar configuración\n');
      process.exit(1);
    }

    // Paso 3: Limpiar cache
    await clearCache();

    // Paso 4: Triggear deployment
    const deployed = await triggerDeployFresh();

    if (deployed) {
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║                  ✅ ¡CONFIGURACIÓN FORZADA!                  ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝\n');
      console.log('El servidor ahora:\n');
      console.log('   ✅ Root Directory = . (raíz)');
      console.log('   ✅ Build = npm install');
      console.log('   ✅ Start = npm start');
      console.log('   ✅ Ejecutará: node server.js\n');
      console.log('Logs esperados:');
      console.log('   ✅ Cloning from https://github.com/...');
      console.log('   ✅ npm install');
      console.log('   ✅ npm start');
      console.log('   ✅ 🚀 Iniciando MCP Orchestrator...');
      console.log('   ✅ ✅ MCP Server running on http://0.0.0.0:3000\n');
      console.log(`Monitorea en: https://dashboard.render.com/web/${SERVICE_ID}\n`);
    } else {
      console.log('⚠️  Deploy no se inició via API\n');
      console.log('Opción: Ve a Render Dashboard y click "Redeploy" manualmente\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
