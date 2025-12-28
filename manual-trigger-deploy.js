#!/usr/bin/env node

/**
 * Manualmente triggear deploy - Versión simplificada
 */

import https from 'https';

const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';

console.log('\n🚀 Iniciando deploy manual (versión simplificada)...\n');

const postData = JSON.stringify({});

const options = {
  hostname: 'api.render.com',
  path: `/v1/services/${SERVICE_ID}/deploys`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RENDER_API_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);

  let body = '';

  res.on('data', (chunk) => body += chunk);

  res.on('end', () => {
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('✅ Deploy iniciado correctamente\n');
      try {
        const data = JSON.parse(body);
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        console.log(body);
      }
    } else {
      console.log('Status code:', res.statusCode);
      console.log('Response:', body || '(vacío)');
      console.log('\n⚠️  Si el deploy no se inicia via API, ve a:');
      console.log(`   https://dashboard.render.com/web/${SERVICE_ID}`);
      console.log('   Y haz click en el botón "Redeploy"\n');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.write(postData);
req.end();
