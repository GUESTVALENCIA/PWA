#!/usr/bin/env node
/**
 * Añadir BRIDGEDATA_API_KEY con la URL WebSocket proporcionada
 */

const https = require('https');

const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_API_URL = 'api.vercel.com';
const PROJECT_ID = 'prj_xXv3QbfvVdW18VTNijbaxOlv2wI2';

// URL WebSocket de BridgeData/BrightData
const BRIDGEDATA_URL = 'wss://brd-customer-hl_c4b3455e-zone-mcp_booking_airbnb:rsxgwjh411m4@brd.superproxy.io:9222';

function vercelAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VERCEL_API_URL,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function setEnvVar(key, value, targets = ['production', 'preview', 'development']) {
  console.log(`\n⚙️  Configurando ${key}...`);
  
  let success = false;
  for (const target of targets) {
    try {
      // Primero verificar si ya existe
      const existing = await vercelAPI(`/v9/projects/${PROJECT_ID}/env`);
      let envId = null;
      
      if (existing.envs) {
        const found = existing.envs.find(e => e.key === key && e.target && e.target.includes(target));
        if (found) {
          envId = found.id;
          // Eliminar la existente
          await vercelAPI(`/v9/projects/${PROJECT_ID}/env/${envId}`, 'DELETE');
          console.log(`  🗑️  Variable existente eliminada de ${target}`);
        }
      }
      
      // Crear/actualizar la variable
      await vercelAPI(
        `/v9/projects/${PROJECT_ID}/env`,
        'POST',
        {
          key: key,
          value: value,
          type: 'encrypted',
          target: [target]
        }
      );
      console.log(`  ✅ ${key} configurado en ${target}`);
      success = true;
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      const errorMsg = error.toString();
      if (errorMsg.includes('already exists') || errorMsg.includes('409')) {
        console.log(`  ⚠️  ${key} ya existe en ${target}, omitiendo...`);
        success = true;
      } else {
        console.error(`  ❌ Error en ${key} (${target}):`, error.message || errorMsg);
      }
    }
  }
  
  return success;
}

async function main() {
  console.log('🔑 AÑADIENDO BRIDGEDATA_API_KEY PARA POST-PRODUCCIÓN\n');
  console.log(`📦 Proyecto: pwa (${PROJECT_ID})\n`);
  
  // Configurar BRIDGEDATA_API_KEY
  const bridgedataConfigured = await setEnvVar('BRIDGEDATA_API_KEY', BRIDGEDATA_URL);
  
  // También configurar BRIGHTDATA_API_KEY como alternativa (algunos sistemas lo usan así)
  const brightdataConfigured = await setEnvVar('BRIGHTDATA_API_KEY', BRIDGEDATA_URL);
  
  // Y BRIGHTDATA_PROXY_URL también
  const proxyUrlConfigured = await setEnvVar('BRIGHTDATA_PROXY_URL', BRIDGEDATA_URL);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 CONFIGURACIÓN COMPLETADA');
  console.log('='.repeat(60));
  
  if (bridgedataConfigured || brightdataConfigured || proxyUrlConfigured) {
    console.log('\n✅ BridgeData/BrightData configurado exitosamente\n');
    console.log('📋 Variables configuradas:');
    if (bridgedataConfigured) console.log('  ✅ BRIDGEDATA_API_KEY');
    if (brightdataConfigured) console.log('  ✅ BRIGHTDATA_API_KEY');
    if (proxyUrlConfigured) console.log('  ✅ BRIGHTDATA_PROXY_URL');
  }
  
  console.log('\n📋 Próximos pasos:');
  console.log('  1. Reinicia el deployment en Vercel Dashboard si es necesario');
  console.log('  2. Prueba el flujo completo con datos en tiempo real');
  console.log('  3. Verifica que Sandra puede acceder a BridgeData\n');
  
  const prodUrl = 'https://pwa-2caws3ssh-guests-valencias-projects.vercel.app';
  console.log(`🌐 URL de Producción: ${prodUrl}\n`);
  console.log('✨ ¡Sistema listo para post-producción con datos en tiempo real!\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

