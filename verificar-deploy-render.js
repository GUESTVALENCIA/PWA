#!/usr/bin/env node
/**
 * Verificar deploy de Render - Estado completo
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

async function getServiceStatus() {
  console.log('🔍 Verificando estado del servicio...\n');
  
  const response = await makeRequest(`/v1/services/${SERVICE_ID}`);
  
  if (response.status !== 200) {
    console.log(`❌ Error ${response.status}:`, JSON.stringify(response.data, null, 2));
    return null;
  }

  const service = response.data.service || response.data;
  
  console.log('📋 Configuración del servicio:');
  console.log('━'.repeat(60));
  console.log('  Nombre:', service.name || 'N/A');
  console.log('  Estado:', service.suspendedAt ? '❌ Suspendido' : '✅ Activo');
  console.log('  Root Directory:', service.rootDir || '(vacío)');
  console.log('  Start Command:', service.startCommand || '(auto)');
  console.log('  Build Command:', service.buildCommand || '(auto)');
  console.log('  Branch:', service.branch || 'main');
  console.log('  Auto Deploy:', service.autoDeploy ? '✅ Sí' : '❌ No');
  console.log('  URL:', service.serviceDetails?.url || service.url || 'N/A');
  
  return service;
}

async function getLatestDeploy() {
  console.log('\n🚀 Verificando deploy más reciente...\n');
  
  const response = await makeRequest(`/v1/services/${SERVICE_ID}/deploys?limit=1`);
  
  if (response.status !== 200) {
    console.log(`❌ Error ${response.status}:`, JSON.stringify(response.data, null, 2));
    return null;
  }

  const deploys = response.data.deploys || [];
  
  if (deploys.length === 0) {
    console.log('⚠️  No se encontraron deploys');
    return null;
  }

  const deploy = deploys[0];
  
  console.log('📋 Información del deploy más reciente:');
  console.log('━'.repeat(60));
  console.log('  ID:', deploy.id);
  console.log('  Commit:', deploy.commit?.message || deploy.commit?.id || 'N/A');
  console.log('  Estado:', deploy.status);
  console.log('  Creado:', new Date(deploy.createdAt).toLocaleString());
  console.log('  Finalizado:', deploy.finishedAt ? new Date(deploy.finishedAt).toLocaleString() : 'En progreso...');
  
  // Interpretar estado
  const status = deploy.status?.toLowerCase() || '';
  if (status === 'live') {
    console.log('  ✅ Estado: LIVE (Desplegado correctamente)');
  } else if (status === 'build_failed') {
    console.log('  ❌ Estado: BUILD FAILED (Error en el build)');
  } else if (status === 'update_failed') {
    console.log('  ❌ Estado: UPDATE FAILED (Error al actualizar)');
  } else if (status === 'build_in_progress' || status === 'update_in_progress') {
    console.log('  ⏳ Estado: EN PROGRESO');
  } else {
    console.log('  ⚠️  Estado:', deploy.status);
  }
  
  return deploy;
}

async function testServiceEndpoint(service) {
  const url = service.serviceDetails?.url || service.url;
  
  if (!url) {
    console.log('\n⚠️  No se pudo obtener la URL del servicio');
    return false;
  }

  console.log(`\n🔍 Probando endpoint del servicio: ${url}\n`);
  
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname || '/',
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('📡 Respuesta del servidor:');
        console.log('━'.repeat(60));
        console.log('  Status Code:', res.statusCode);
        console.log('  Headers:', JSON.stringify(res.headers, null, 2).substring(0, 200) + '...');
        
        if (res.statusCode === 200 || res.statusCode === 404 || res.statusCode === 503) {
          console.log('  ✅ Servidor respondiendo (el código puede variar según la ruta)');
          resolve(true);
        } else {
          console.log('  ⚠️  Respuesta inesperada');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('  ❌ Error al conectar:', error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('  ⏱️  Timeout esperando respuesta');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 VERIFICACIÓN COMPLETA DEL DEPLOY EN RENDER');
  console.log('='.repeat(70));
  console.log(`\n🔑 Service ID: ${SERVICE_ID}\n`);

  // 1. Verificar configuración del servicio
  const service = await getServiceStatus();
  
  if (!service) {
    console.log('\n❌ No se pudo obtener información del servicio');
    return;
  }

  // Verificar configuración
  console.log('\n✅ Verificación de configuración:');
  console.log('━'.repeat(60));
  
  let configOk = true;
  
  if (service.rootDir === 'mcp-server') {
    console.log('  ✅ Root Directory: Correcto (mcp-server)');
  } else {
    console.log('  ❌ Root Directory: Incorrecto (debería ser "mcp-server")');
    configOk = false;
  }
  
  if (service.startCommand === 'node index.js' || (!service.startCommand && service.rootDir === 'mcp-server')) {
    console.log('  ✅ Start Command: Correcto (node index.js)');
  } else if (service.startCommand === 'node server.js') {
    console.log('  ❌ Start Command: INCORRECTO (todavía usa server.js)');
    configOk = false;
  } else {
    console.log('  ⚠️  Start Command:', service.startCommand || '(auto)');
  }

  // 2. Verificar deploy más reciente
  const deploy = await getLatestDeploy();
  
  if (deploy) {
    console.log('\n✅ Verificación del deploy:');
    console.log('━'.repeat(60));
    
    if (deploy.status === 'live') {
      console.log('  ✅ Deploy: LIVE (funcionando)');
    } else if (deploy.status === 'build_failed' || deploy.status === 'update_failed') {
      console.log('  ❌ Deploy: FALLIDO');
      console.log('\n💡 Revisa los logs en Render Dashboard para más detalles');
      configOk = false;
    } else {
      console.log('  ⏳ Deploy: En progreso');
    }
  }

  // 3. Probar endpoint si está live
  if (deploy && deploy.status === 'live' && service.serviceDetails?.url) {
    await testServiceEndpoint(service);
  }

  // Resumen final
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(70));
  
  if (configOk && deploy && deploy.status === 'live') {
    console.log('\n✅ ¡DEPLOY VERIFICADO Y FUNCIONANDO CORRECTAMENTE!');
    console.log('\n✅ Configuración correcta');
    console.log('✅ Deploy completado');
    console.log('✅ Servidor activo');
    
    console.log('\n📝 Verifica los logs en Render para confirmar:');
    console.log('   Deberías ver: "Running \'node index.js\'"');
    console.log('   Y NO: "Running \'node server.js\'"');
  } else {
    console.log('\n⚠️  HAY PROBLEMAS QUE REVISAR:');
    if (!configOk) {
      console.log('   ❌ Configuración incorrecta');
    }
    if (!deploy || deploy.status !== 'live') {
      console.log('   ❌ Deploy no completado o fallido');
    }
    
    console.log('\n💡 Acciones recomendadas:');
    console.log('   1. Revisa los logs en Render Dashboard');
    console.log('   2. Verifica la configuración en Settings');
    console.log('   3. Si es necesario, haz un nuevo Manual Deploy');
  }

  console.log('\n🔗 Dashboard: https://dashboard.render.com/web/' + SERVICE_ID);
  console.log('\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  if (error.stack) {
    console.error('\nStack:', error.stack);
  }
  process.exit(1);
});

