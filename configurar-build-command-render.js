#!/usr/bin/env node

/**
 * Configurar Build Command en Render para clonar submodules de IA-SANDRA
 * Usa la API de Render directamente
 */

const https = require('https');

const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const RENDER_API_BASE = 'api.render.com';

// SERVICE_ID del servicio PWA (conocido del archivo actualizar-render-via-api.js)
let SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';

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

/**
 * Listar todos los servicios para encontrar el PWA
 */
async function findPWAService() {
  console.log('\n🔍 Buscando servicio PWA...\n');
  
  const response = await makeRequest('/v1/services');
  
  if (response.status !== 200) {
    console.error('❌ Error listando servicios:', response.status);
    console.error('Respuesta:', JSON.stringify(response.data, null, 2));
    return null;
  }

  const services = response.data || [];
  
  // Buscar servicio que contenga "pwa" o "GUESTVALENCIA" en el nombre
  const pwaService = services.find(service => {
    const name = (service.name || '').toLowerCase();
    const repo = (service.serviceDetails?.repo || '').toLowerCase();
    return name.includes('pwa') || 
           name.includes('guestvalencia') || 
           repo.includes('guestvalencia') ||
           repo.includes('pwa');
  });

  if (pwaService) {
    console.log('✅ Servicio PWA encontrado:');
    console.log(`   - ID: ${pwaService.id}`);
    console.log(`   - Nombre: ${pwaService.name}`);
    console.log(`   - URL: ${pwaService.serviceDetails?.url || 'N/A'}`);
    return pwaService.id;
  }

  // Si no se encuentra, mostrar todos los servicios
  console.log('⚠️  Servicio PWA no encontrado automáticamente. Servicios disponibles:');
  services.forEach(service => {
    console.log(`   - ${service.name} (${service.id})`);
  });
  
  return null;
}

/**
 * Obtener configuración actual del servicio
 */
async function getServiceConfig(serviceId) {
  console.log(`\n📋 Obteniendo configuración actual del servicio ${serviceId}...\n`);
  
  const response = await makeRequest(`/v1/services/${serviceId}`);
  
  if (response.status !== 200) {
    console.error('❌ Error obteniendo configuración:', response.status);
    return null;
  }

  const service = response.data.service || response.data;
  
  console.log('📊 Configuración actual:');
  console.log(`   - Build Command: ${service.buildCommand || '(vacío - usa npm install por defecto)'}`);
  console.log(`   - Start Command: ${service.startCommand || '(auto)'}`);
  console.log(`   - Root Directory: ${service.rootDir || '(raíz)'}`);
  
  return service;
}

/**
 * Actualizar Build Command para incluir clonación de submodules
 */
async function updateBuildCommand(serviceId) {
  console.log('\n🔧 Actualizando Build Command...\n');
  
  // Obtener configuración actual primero
  const currentConfig = await getServiceConfig(serviceId);
  if (!currentConfig) {
    return false;
  }

  const newBuildCommand = 'git submodule update --init --recursive && npm install';
  
  console.log('📝 Cambios a aplicar:');
  console.log(`   ANTES: ${currentConfig.buildCommand || 'npm install (por defecto)'}`);
  console.log(`   DESPUÉS: ${newBuildCommand}`);
  
  const updateData = {
    buildCommand: newBuildCommand
  };

  console.log('\n⏳ Enviando actualización a Render...');
  const response = await makeRequest(`/v1/services/${serviceId}`, 'PATCH', updateData);

  if (response.status === 200) {
    console.log('\n✅ Build Command actualizado correctamente');
    
    const updatedService = response.data.service || response.data;
    console.log('\n📊 Nueva configuración:');
    console.log(`   - Build Command: ${updatedService.buildCommand}`);
    console.log(`   - Start Command: ${updatedService.startCommand || '(auto)'}`);
    console.log(`   - Root Directory: ${updatedService.rootDir || '(raíz)'}`);
    
    return true;
  } else {
    console.error('\n❌ Error actualizando Build Command:', response.status);
    console.error('Respuesta:', JSON.stringify(response.data, null, 2));
    return false;
  }
}

/**
 * Iniciar deploy manual para aplicar cambios
 */
async function triggerDeploy(serviceId) {
  console.log('\n🚀 Iniciando deploy manual para aplicar cambios...\n');
  
  const response = await makeRequest(`/v1/services/${serviceId}/deploys`, 'POST', {
    clearCache: false
  });

  if (response.status === 200 || response.status === 201) {
    const deploy = response.data.deploy || response.data;
    console.log('✅ Deploy iniciado correctamente');
    console.log(`   - Deploy ID: ${deploy.id}`);
    console.log(`   - Estado: ${deploy.status || 'iniciando'}`);
    console.log(`\n📊 Puedes ver el progreso en:`);
    console.log(`   https://dashboard.render.com/web/${serviceId}`);
    return true;
  } else {
    console.error('❌ Error iniciando deploy:', response.status);
    console.error('Respuesta:', JSON.stringify(response.data, null, 2));
    console.log('\n⚠️  Puedes iniciar el deploy manualmente desde Render Dashboard');
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('='.repeat(70));
  console.log('🔧 CONFIGURAR BUILD COMMAND EN RENDER PARA SUBMODULES');
  console.log('='.repeat(70));

  // 1. Encontrar servicio PWA
  SERVICE_ID = await findPWAService();
  
  if (!SERVICE_ID) {
    console.error('\n❌ No se pudo encontrar el servicio PWA automáticamente.');
    console.log('\n💡 Opciones:');
    console.log('   1. Ejecuta este script con el SERVICE_ID como argumento:');
    console.log('      node configurar-build-command-render.js srv-XXXXXXXXX');
    console.log('   2. O busca el SERVICE_ID en Render Dashboard y actualiza el script');
    process.exit(1);
  }

  // 2. Actualizar Build Command
  const updated = await updateBuildCommand(SERVICE_ID);
  
  if (!updated) {
    console.error('\n❌ No se pudo actualizar el Build Command');
    process.exit(1);
  }

  // 3. Iniciar deploy
  console.log('\n' + '='.repeat(70));
  const deployStarted = await triggerDeploy(SERVICE_ID);

  if (deployStarted) {
    console.log('\n' + '='.repeat(70));
    console.log('✅ ¡CONFIGURACIÓN COMPLETADA!');
    console.log('='.repeat(70));
    console.log('\n📋 Resumen:');
    console.log('   ✅ Build Command actualizado para clonar submodules');
    console.log('   ✅ Deploy iniciado automáticamente');
    console.log('\n⏳ El deploy tomará ~3-5 minutos. Verifica los logs en Render Dashboard.');
    console.log(`\n🔗 Dashboard: https://dashboard.render.com/web/${SERVICE_ID}`);
  } else {
    console.log('\n⚠️  Build Command actualizado, pero el deploy debe iniciarse manualmente');
    console.log(`   Ve a: https://dashboard.render.com/web/${SERVICE_ID}`);
    console.log('   Click en "Manual Deploy" → "Deploy latest commit"');
  }

  console.log('\n');
}

// Permitir SERVICE_ID como argumento
if (process.argv[2]) {
  SERVICE_ID = process.argv[2];
  console.log(`\n📌 Usando SERVICE_ID proporcionado: ${SERVICE_ID}\n`);
  findPWAService = async () => SERVICE_ID;
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
