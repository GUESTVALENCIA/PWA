#!/usr/bin/env node

/**
 * Monitorear deploy urgente en Render
 */

const https = require('https');

const API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';
const DEPLOY_ID = 'dep-d5ctc9shg0os73eqdr30';
const API_BASE = 'api.render.com';

function renderAPI(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function monitorear() {
  console.log('='.repeat(70));
  console.log('📊 MONITOREANDO DEPLOY URGENTE');
  console.log('='.repeat(70));
  console.log(`\n📋 Deploy ID: ${DEPLOY_ID}`);
  console.log(`🔗 Dashboard: https://dashboard.render.com/web/${SERVICE_ID}/deploys/${DEPLOY_ID}\n`);

  let attempts = 0;
  const maxAttempts = 30; // 5 minutos

  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const result = await renderAPI(`/v1/services/${SERVICE_ID}/deploys/${DEPLOY_ID}`);
      const deploy = result.data.deploy || result.data;
      const status = deploy.status;

      console.log(`[${new Date().toLocaleTimeString()}] Intento ${attempts}/${maxAttempts}: ${status}`);

      if (status === 'live') {
        console.log('\n' + '='.repeat(70));
        console.log('✅ DEPLOY COMPLETADO - SERVICIO LIVE');
        console.log('='.repeat(70));
        console.log(`\n🌐 URL: https://pwa-imbf.onrender.com`);
        console.log(`📡 WebSocket: wss://pwa-imbf.onrender.com`);
        console.log(`\n✅ El error de ipGeolocationService debería estar corregido ahora.\n`);
        return true;
      } else if (status === 'update_failed' || status === 'build_failed') {
        console.log('\n' + '='.repeat(70));
        console.log('❌ DEPLOY FALLIDO');
        console.log('='.repeat(70));
        console.log(`\nEstado: ${status}`);
        console.log(`\n💡 Revisa los logs en Render Dashboard para más detalles.`);
        return false;
      }

      // Esperar 10 segundos
      await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error) {
      console.error(`Error verificando deploy: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log('\n⏱️  Timeout esperando deploy');
  return false;
}

monitorear().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
