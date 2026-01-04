#!/usr/bin/env node

/**
 * Script para actualizar Build Command y verificar configuración en Render
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

async function main() {
  console.log('='.repeat(70));
  console.log('🔧 CORRECCIÓN COMPLETA: Build Command y Configuración');
  console.log('='.repeat(70));
  console.log(`\n🔗 Servicio: ${SERVICE_ID}\n`);

  // 1. Obtener configuración actual
  console.log('📋 Obteniendo configuración actual...');
  const getResponse = await makeRequest(`/v1/services/${SERVICE_ID}`);
  
  if (getResponse.status !== 200) {
    console.error(`❌ Error: ${getResponse.status}`);
    process.exit(1);
  }

  const service = getResponse.data.service || getResponse.data;
  console.log(`   Build Command: ${service.buildCommand || '(vacío)'}`);
  console.log(`   Start Command: ${service.startCommand || '(auto)'}`);
  console.log(`   Root Directory: ${service.rootDir || '(raíz)'}`);

  // 2. Actualizar Build Command
  const newBuildCommand = 'git submodule update --init --recursive && npm install';
  
  console.log(`\n🔧 Actualizando Build Command...`);
  console.log(`   Nuevo: ${newBuildCommand}\n`);

  const updateResponse = await makeRequest(`/v1/services/${SERVICE_ID}`, 'PATCH', {
    buildCommand: newBuildCommand
  });

  if (updateResponse.status === 200) {
    console.log('✅ Build Command actualizado');
  } else {
    console.error(`❌ Error actualizando: ${updateResponse.status}`);
    console.error(JSON.stringify(updateResponse.data, null, 2));
  }

  // 3. Iniciar deploy
  console.log('\n🚀 Iniciando deploy...');
  const deployResponse = await makeRequest(`/v1/services/${SERVICE_ID}/deploys`, 'POST', {});
  
  if (deployResponse.status === 200 || deployResponse.status === 201) {
    const deploy = deployResponse.data.deploy || deployResponse.data;
    console.log(`✅ Deploy iniciado: ${deploy.id}`);
    console.log(`\n🔗 Dashboard: https://dashboard.render.com/web/${SERVICE_ID}`);
  }

  console.log('\n');
}

main().catch(console.error);
