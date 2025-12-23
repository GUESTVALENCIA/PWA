#!/usr/bin/env node
/**
 * Forzar Start Command explícitamente en Render
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
  console.log(' Forzando Start Command explícitamente...\n');
  
  // Método 1: Actualizar solo startCommand
  console.log(' Método 1: Actualizando Start Command...');
  const response1 = await makeRequest(`/v1/services/${SERVICE_ID}`, 'PATCH', {
    startCommand: 'node index.js'
  });
  
  console.log(`   Status: ${response1.status}`);
  if (response1.status === 200) {
    console.log('    Start Command actualizado');
  } else {
    console.log('   Respuesta:', JSON.stringify(response1.data, null, 2));
  }

  // Método 2: Actualizar con todas las configuraciones
  console.log('\n Método 2: Actualizando configuración completa...');
  const response2 = await makeRequest(`/v1/services/${SERVICE_ID}`, 'PATCH', {
    rootDir: 'mcp-server',
    startCommand: 'node index.js',
    buildCommand: 'npm install'
  });
  
  console.log(`   Status: ${response2.status}`);
  if (response2.status === 200) {
    console.log('    Configuración completa actualizada');
    const service = response2.data.service || response2.data;
    console.log('   Start Command confirmado:', service.startCommand || '(auto)');
  } else {
    console.log('   Respuesta:', JSON.stringify(response2.data, null, 2));
  }

  // Verificar estado final
  console.log('\n Verificando estado final...');
  const verify = await makeRequest(`/v1/services/${SERVICE_ID}`);
  if (verify.status === 200) {
    const service = verify.data.service || verify.data;
    console.log('\n Configuración final:');
    console.log('   Root Directory:', service.rootDir);
    console.log('   Start Command:', service.startCommand || '(auto - usa package.json)');
    
    if (service.startCommand === 'node index.js') {
      console.log('\n ¡PERFECTO! Start Command configurado correctamente');
      console.log('\n Próximo paso: Haz un Manual Deploy desde Render Dashboard');
      console.log('   URL: https://dashboard.render.com/web/' + SERVICE_ID);
    } else if (!service.startCommand && service.rootDir === 'mcp-server') {
      console.log('\n  Start Command en auto (usa package.json)');
      console.log('   Esto debería funcionar si package.json tiene "start": "node index.js"');
      console.log('   Pero Render puede estar usando server.js por defecto si existe');
      console.log('\n Solución: Elimina o renombra mcp-server/server.js');
    } else {
      console.log('\n Start Command no se actualizó correctamente');
      console.log('   Actualiza manualmente en Render Dashboard');
    }
  }
}

main().catch(error => {
  console.error('\n Error:', error);
  process.exit(1);
});

