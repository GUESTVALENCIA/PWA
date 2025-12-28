#!/usr/bin/env node

/**
 * Verificar estado del deployment en Render
 */

import https from 'https';

const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';

console.log('\n📊 Verificando estado del deployment en Render...\n');

const options = {
  hostname: 'api.render.com',
  path: `/v1/services/${SERVICE_ID}/deploys?limit=5`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${RENDER_API_KEY}`,
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => body += chunk);

  res.on('end', () => {
    try {
      const data = JSON.parse(body);

      if (res.statusCode === 200) {
        console.log('✅ Estado de los últimos 5 deployments:\n');

        if (data.deploys && data.deploys.length > 0) {
          data.deploys.forEach((deploy, index) => {
            console.log(`${index + 1}. Deploy ID: ${deploy.id}`);
            console.log(`   Status: ${deploy.status}`);
            console.log(`   Commit: ${deploy.commit?.substring(0, 8) || 'N/A'}`);
            console.log(`   Created: ${deploy.createdAt}`);
            console.log(`   Finished: ${deploy.finishedAt || 'En progreso...'}\n`);
          });
        } else {
          console.log('No hay deployments disponibles\n');
        }

        const latestDeploy = data.deploys?.[0];
        if (latestDeploy) {
          if (latestDeploy.status === 'live') {
            console.log('✅ ¡EL SERVIDOR ESTÁ ACTIVO!\n');
            console.log('   URL: https://pwa-imbf.onrender.com');
          } else if (latestDeploy.status === 'build_in_progress') {
            console.log('⏳ Construcción en progreso...\n');
          } else if (latestDeploy.status === 'deploy_in_progress') {
            console.log('⏳ Deployment en progreso...\n');
          } else if (latestDeploy.status === 'build_failed' || latestDeploy.status === 'deploy_failed') {
            console.log('❌ El deployment falló. Revisa los logs en Render Dashboard.\n');
          }
        }
      } else {
        console.log(`Error: Status ${res.statusCode}`);
      }
    } catch (e) {
      console.log(`Error parsing response: ${e.message}`);
      console.log(`Raw response: ${body}`);
    }
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

req.end();
