#!/usr/bin/env node

/**
 * Deploy urgente en Render - Corregir error ipGeolocationService
 */

const https = require('https');

const API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';
const API_BASE = 'api.render.com';

function renderAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: API_BASE,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    };

    if (postData) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function main() {
  console.log('='.repeat(70));
  console.log('🚨 DEPLOY URGENTE - CORREGIR ERROR ipGeolocationService');
  console.log('='.repeat(70));
  console.log(`\n📋 Servicio: ${SERVICE_ID}`);
  console.log(`🔗 URL: https://pwa-imbf.onrender.com\n`);

  try {
    // Crear deploy manual
    console.log('🚀 Iniciando deploy manual...\n');
    const deployResult = await renderAPI(
      `/v1/services/${SERVICE_ID}/deploys`,
      'POST',
      {}
    );

    if (deployResult.status === 201 || deployResult.status === 200) {
      const deploy = deployResult.data.deploy || deployResult.data;
      const deployId = deploy.id;
      
      console.log(`✅ Deploy iniciado exitosamente`);
      console.log(`   ID: ${deployId}`);
      console.log(`   Estado: ${deploy.status || 'iniciando'}`);
      console.log(`\n🔗 Dashboard: https://dashboard.render.com/web/${SERVICE_ID}/deploys/${deployId}`);
      console.log(`\n⏳ El deploy tomará aproximadamente 2-3 minutos...`);
      console.log(`   Monitorea el progreso en el dashboard de Render.\n`);
    } else {
      console.error(`❌ Error iniciando deploy: ${deployResult.status}`);
      console.error(`   Respuesta: ${JSON.stringify(deployResult.data, null, 2)}`);
      console.error(`\n💡 Intenta hacer el deploy manualmente desde:`);
      console.error(`   https://dashboard.render.com/web/${SERVICE_ID}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }

  console.log('='.repeat(70));
}

main();
