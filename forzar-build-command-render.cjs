#!/usr/bin/env node

/**
 * Forzar actualización del Build Command en Render
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
  console.log('🔧 FORZAR ACTUALIZACIÓN DE BUILD COMMAND');
  console.log('='.repeat(70));
  console.log(`\n🔗 Servicio: ${SERVICE_ID}\n`);

  // Obtener configuración actual
  console.log('📋 Obteniendo configuración actual...');
  const getResponse = await makeRequest(`/v1/services/${SERVICE_ID}`);
  
  if (getResponse.status !== 200) {
    console.error(`❌ Error obteniendo servicio: ${getResponse.status}`);
    console.error(JSON.stringify(getResponse.data, null, 2));
    process.exit(1);
  }

  const service = getResponse.data.service || getResponse.data;
  console.log(`   Build Command actual: ${service.buildCommand || '(vacío)'}`);
  console.log(`   Start Command: ${service.startCommand || '(auto)'}`);
  console.log(`   Root Directory: ${service.rootDir || '(raíz)'}`);

  // Actualizar Build Command
  const newBuildCommand = 'git submodule update --init --recursive && npm install';
  
  console.log(`\n🔧 Actualizando Build Command a:`);
  console.log(`   ${newBuildCommand}\n`);

  // Intentar actualización con diferentes formatos
  const updateAttempts = [
    { buildCommand: newBuildCommand },
    { serviceDetails: { buildCommand: newBuildCommand } },
    { 
      buildCommand: newBuildCommand,
      autoDeploy: 'yes'
    }
  ];

  let success = false;

  for (let i = 0; i < updateAttempts.length; i++) {
    console.log(`⏳ Intento ${i + 1}/${updateAttempts.length}...`);
    const updateResponse = await makeRequest(`/v1/services/${SERVICE_ID}`, 'PATCH', updateAttempts[i]);
    
    if (updateResponse.status === 200) {
      const updated = updateResponse.data.service || updateResponse.data;
      console.log(`✅ Actualización exitosa (intento ${i + 1})`);
      console.log(`   Build Command guardado: ${updated.buildCommand || newBuildCommand}`);
      success = true;
      break;
    } else {
      console.log(`   ❌ Intento ${i + 1} falló: ${updateResponse.status}`);
      if (i === updateAttempts.length - 1) {
        console.log(`   Respuesta: ${JSON.stringify(updateResponse.data, null, 2).substring(0, 200)}`);
      }
    }
  }

  if (!success) {
    console.log('\n❌ No se pudo actualizar el Build Command automáticamente');
    console.log('\n💡 Actualiza manualmente en Render Dashboard:');
    console.log('   1. Ve a: https://dashboard.render.com/web/' + SERVICE_ID);
    console.log('   2. Settings → Build & Deploy');
    console.log('   3. Build Command: git submodule update --init --recursive && npm install');
    console.log('   4. Save Changes');
    process.exit(1);
  }

  // Verificar que se guardó
  console.log('\n🔍 Verificando que se guardó correctamente...');
  const verifyResponse = await makeRequest(`/v1/services/${SERVICE_ID}`);
  
  if (verifyResponse.status === 200) {
    const verified = verifyResponse.data.service || verifyResponse.data;
    if (verified.buildCommand && verified.buildCommand.includes('submodule')) {
      console.log('✅ Build Command verificado correctamente');
      console.log(`   ${verified.buildCommand}`);
    } else {
      console.log('⚠️  Build Command no se guardó como esperado');
      console.log(`   Valor actual: ${verified.buildCommand || '(vacío)'}`);
    }
  }

  // Iniciar nuevo deploy
  console.log('\n🚀 Iniciando nuevo deploy para aplicar cambios...');
  const deployResponse = await makeRequest(`/v1/services/${SERVICE_ID}/deploys`, 'POST', {});
  
  if (deployResponse.status === 200 || deployResponse.status === 201) {
    const deploy = deployResponse.data.deploy || deployResponse.data;
    console.log('✅ Deploy iniciado');
    console.log(`   Deploy ID: ${deploy.id}`);
    console.log(`   Estado: ${deploy.status || 'iniciando'}`);
    console.log(`\n🔗 Dashboard: https://dashboard.render.com/web/${SERVICE_ID}`);
  } else {
    console.log('⚠️  No se pudo iniciar deploy automáticamente');
    console.log(`   Inicia manualmente desde el Dashboard`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ PROCESO COMPLETADO');
  console.log('='.repeat(70));
  console.log('\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
