#!/usr/bin/env node

/**
 * TRIGGEADOR DE DEPLOYMENT EN RENDER
 * Inicia un nuevo deployment con la configuración actualizada
 */

import https from 'https';

const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';

console.log('\n🚀 Iniciando Deployment en Render...\n');

const options = {
  hostname: 'api.render.com',
  path: `/v1/services/${SERVICE_ID}/deploys`,
  method: 'POST',
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
      const data = JSON.parse(body);

      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ ¡DEPLOYMENT INICIADO!\n');
        console.log('Información del Deploy:');
        if (data.deploy) {
          console.log(`   ID: ${data.deploy.id}`);
          console.log(`   Status: ${data.deploy.status}`);
          console.log(`   Created: ${data.deploy.createdAt}\n`);
        }
        console.log('📊 Monitorea el progreso en:');
        console.log(`   https://dashboard.render.com/web/${SERVICE_ID}\n`);
        console.log('El servidor debería:');
        console.log('   1. Clonar código de GitHub');
        console.log('   2. npm install (instalar dependencias)');
        console.log('   3. npm start (ejecutar node server.js)');
        console.log('   4. ✅ MCP Server running on http://0.0.0.0:3000\n');
      } else {
        console.log(`❌ Error: Status ${res.statusCode}`);
        console.log(`Response: ${JSON.stringify(data, null, 2)}\n`);
      }
    } catch (e) {
      console.log(`❌ Error parsing response: ${e.message}`);
      console.log(`Raw response: ${body}\n`);
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ Request error: ${error.message}\n`);
  process.exit(1);
});

// Enviar request sin body (deploy solo)
req.end();

console.log('⏳ Esperando respuesta de Render API...\n');
