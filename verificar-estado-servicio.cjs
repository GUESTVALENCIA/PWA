#!/usr/bin/env node

/**
 * Verificar estado del servicio y últimos deploys en Render
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
  console.log('📊 VERIFICACIÓN DE ESTADO DEL SERVICIO');
  console.log('='.repeat(70));
  console.log(`\n🔗 Servicio: ${SERVICE_ID}\n`);

  // 1. Obtener detalles del servicio
  console.log('📋 Obteniendo detalles del servicio...');
  const serviceResponse = await makeRequest(`/v1/services/${SERVICE_ID}`);
  
  if (serviceResponse.status === 200) {
    const service = serviceResponse.data.service || serviceResponse.data;
    console.log('\n✅ Servicio encontrado:');
    console.log(`   - Nombre: ${service.name || 'N/A'}`);
    console.log(`   - Estado: ${service.serviceDetails?.suspendedInactiveAt ? 'Suspended' : 'Active'}`);
    console.log(`   - Build Command: ${service.buildCommand || '(por defecto)'}`);
    console.log(`   - Start Command: ${service.startCommand || '(auto)'}`);
    console.log(`   - Root Directory: ${service.rootDir || '(raíz)'}`);
    console.log(`   - URL: ${service.serviceDetails?.url || 'N/A'}`);
  } else {
    console.log(`❌ Error obteniendo servicio: ${serviceResponse.status}`);
  }

  // 2. Obtener últimos deploys
  console.log('\n📦 Obteniendo últimos deploys...');
  const deploysResponse = await makeRequest(`/v1/services/${SERVICE_ID}/deploys?limit=5`);
  
  if (deploysResponse.status === 200) {
    const deploys = deploysResponse.data.deploys || deploysResponse.data || [];
    console.log(`\n✅ Encontrados ${deploys.length} deploy(s) reciente(s):\n`);
    
    deploys.slice(0, 3).forEach((deploy, index) => {
      const deployData = deploy.deploy || deploy;
      const status = deployData.status || 'unknown';
      const createdAt = deployData.createdAt ? new Date(deployData.createdAt).toLocaleString('es-ES') : 'N/A';
      const finishedAt = deployData.finishedAt ? new Date(deployData.finishedAt).toLocaleString('es-ES') : 'En progreso';
      
      const statusIcon = status === 'live' ? '✅' : status === 'build_failed' ? '❌' : '⏳';
      
      console.log(`${statusIcon} Deploy #${index + 1}:`);
      console.log(`   - ID: ${deployData.id}`);
      console.log(`   - Estado: ${status.toUpperCase()}`);
      console.log(`   - Creado: ${createdAt}`);
      console.log(`   - Finalizado: ${finishedAt}`);
      
      // Verificar Build Command en el deploy
      if (deployData.buildCommand) {
        console.log(`   - Build Command: ${deployData.buildCommand}`);
        if (deployData.buildCommand.includes('submodule')) {
          console.log(`   ✅ Build Command incluye clonación de submodules`);
        }
      }
      console.log('');
    });
  } else {
    console.log(`❌ Error obteniendo deploys: ${deploysResponse.status}`);
  }

  // 3. Verificar Build Command actual
  console.log('='.repeat(70));
  console.log('🔍 VERIFICACIÓN DE BUILD COMMAND');
  console.log('='.repeat(70));
  
  if (serviceResponse.status === 200) {
    const service = serviceResponse.data.service || serviceResponse.data;
    const buildCommand = service.buildCommand;
    
    if (buildCommand && buildCommand.includes('submodule')) {
      console.log('\n✅ Build Command configurado correctamente:');
      console.log(`   ${buildCommand}`);
      console.log('\n✅ El submodule IA-SANDRA se clonará automáticamente en cada deploy');
    } else {
      console.log('\n⚠️  Build Command no incluye clonación de submodules:');
      console.log(`   ${buildCommand || '(usa npm install por defecto)'}`);
      console.log('\n💡 Debería ser: git submodule update --init --recursive && npm install');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('🔗 Dashboard: https://dashboard.render.com/web/' + SERVICE_ID);
  console.log('='.repeat(70));
  console.log('\n💡 Para ver los logs completos, ve al Dashboard y abre la pestaña "Logs"');
  console.log('   Busca líneas que contengan:');
  console.log('   - "Submodule" o "IA-SANDRA"');
  console.log('   - "[SANDRA ORCHESTRATOR]"');
  console.log('   - "Pipeline de negociación cargado"');
  console.log('   - "Unificación completada exitosamente"');
  console.log('\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
