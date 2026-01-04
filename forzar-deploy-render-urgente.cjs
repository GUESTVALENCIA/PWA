#!/usr/bin/env node

/**
 * Forzar deploy urgente en Render para corregir error ipGeolocationService
 */

const https = require('https');

const API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';
const API_BASE = 'api.render.com';

function renderAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
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

async function forzarDeploy() {
  console.log('='.repeat(70));
  console.log('🚨 FORZANDO DEPLOY URGENTE EN RENDER');
  console.log('='.repeat(70));
  console.log(`\n📋 Servicio: ${SERVICE_ID}`);
  console.log(`🔗 URL: https://pwa-imbf.onrender.com\n`);

  try {
    // 1. Verificar estado del servicio
    console.log('1️⃣ Verificando estado del servicio...');
    const serviceStatus = await renderAPI(`/v1/services/${SERVICE_ID}`);
    console.log(`   Estado: ${serviceStatus.data.serviceDetails?.runtime || 'N/A'}`);
    console.log(`   Auto-deploy: ${serviceStatus.data.autoDeploy || 'N/A'}\n`);

    // 2. Listar últimos deploys
    console.log('2️⃣ Últimos deploys:');
    const deploys = await renderAPI(`/v1/services/${SERVICE_ID}/deploys?limit=3`);
    if (deploys.data && deploys.data.length > 0) {
      deploys.data.forEach((deploy, i) => {
        console.log(`   ${i + 1}. ${deploy.status} - ${deploy.commit?.message || 'N/A'} (${deploy.createdAt})`);
      });
    }
    console.log('');

    // 3. Crear nuevo deploy manual
    console.log('3️⃣ Creando nuevo deploy manual...');
    const deployResult = await renderAPI(
      `/v1/services/${SERVICE_ID}/deploys`,
      'POST',
      { clearCache: false }
    );

    if (deployResult.status === 201 || deployResult.status === 200) {
      const deployId = deployResult.data.deploy?.id || deployResult.data.id;
      console.log(`   ✅ Deploy iniciado: ${deployId}`);
      console.log(`   🔗 Dashboard: https://dashboard.render.com/web/${SERVICE_ID}/deploys/${deployId}\n`);

      // 4. Monitorear el deploy
      console.log('4️⃣ Monitoreando deploy...');
      let attempts = 0;
      const maxAttempts = 30; // 5 minutos máximo

      const checkDeploy = async () => {
        attempts++;
        const deployStatus = await renderAPI(`/v1/services/${SERVICE_ID}/deploys/${deployId}`);
        const status = deployStatus.data.deploy?.status || deployStatus.data.status;

        console.log(`   Intento ${attempts}/${maxAttempts}: ${status}`);

        if (status === 'live') {
          console.log('\n   ✅ DEPLOY COMPLETADO - Servicio LIVE');
          return true;
        } else if (status === 'update_failed' || status === 'build_failed') {
          console.log('\n   ❌ DEPLOY FALLIDO');
          console.log(`   Error: ${JSON.stringify(deployStatus.data, null, 2)}`);
          return false;
        } else if (attempts >= maxAttempts) {
          console.log('\n   ⏱️  Timeout esperando deploy');
          return false;
        }

        // Esperar 10 segundos antes del siguiente check
        await new Promise(resolve => setTimeout(resolve, 10000));
        return checkDeploy();
      };

      await checkDeploy();
    } else {
      console.error(`   ❌ Error creando deploy: ${deployResult.status}`);
      console.error(`   Respuesta: ${JSON.stringify(deployResult.data, null, 2)}`);
    }

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ PROCESO COMPLETADO');
  console.log('='.repeat(70));
}

forzarDeploy();
