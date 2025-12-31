#!/usr/bin/env node

/**
 * Actualizar DEEPGRAM_API_KEY en Render usando la API
 */

import https from 'https';

const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';

// Nueva API key de Deepgram (unida - las dos partes que proporcionaste)
const NEW_DEEPGRAM_API_KEY = '53202ecf825c59e8ea498f7cf68c4822c2466005618e1cd99dad83387e673405cdf5bac3d668f90a';

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║     🔑 ACTUALIZAR DEEPGRAM_API_KEY EN RENDER                ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
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
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function getCurrentEnvVars() {
  console.log('📋 [1/3] Obteniendo variables de entorno actuales...\n');
  const response = await makeRequest(`/v1/services/${SERVICE_ID}/env-vars`);

  if (response.status === 200) {
    const envVars = response.data.envVars || response.data;
    console.log(`✅ Encontradas ${envVars.length} variables de entorno\n`);
    
    const deepgramVar = envVars.find(v => v.key === 'DEEPGRAM_API_KEY');
    if (deepgramVar) {
      console.log('🔍 DEEPGRAM_API_KEY actual:');
      console.log(`   Key: ${deepgramVar.key}`);
      console.log(`   Value: ${deepgramVar.value ? deepgramVar.value.substring(0, 20) + '...' : '(vacía)'}`);
      console.log(`   ID: ${deepgramVar.id || 'N/A'}\n`);
      return deepgramVar;
    } else {
      console.log('⚠️  DEEPGRAM_API_KEY no encontrada (se creará nueva)\n');
      return null;
    }
  } else {
    console.log(`❌ Error obteniendo variables: Status ${response.status}\n`);
    console.log('Respuesta:', JSON.stringify(response.data, null, 2));
    return null;
  }
}

async function updateDeepgramKey(existingVar) {
  console.log('📝 [2/3] Actualizando DEEPGRAM_API_KEY...\n');
  
  if (existingVar && existingVar.id) {
    // Actualizar variable existente
    console.log('   Actualizando variable existente...');
    const response = await makeRequest(
      `/v1/services/${SERVICE_ID}/env-vars/${existingVar.id}`,
      'PATCH',
      { value: NEW_DEEPGRAM_API_KEY }
    );

    if (response.status === 200) {
      console.log('✅ Variable actualizada correctamente\n');
      return true;
    } else {
      console.log(`❌ Error actualizando: Status ${response.status}\n`);
      console.log('Respuesta:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } else {
    // Crear nueva variable
    console.log('   Creando nueva variable...');
    const response = await makeRequest(
      `/v1/services/${SERVICE_ID}/env-vars`,
      'POST',
      {
        key: 'DEEPGRAM_API_KEY',
        value: NEW_DEEPGRAM_API_KEY
      }
    );

    if (response.status === 201 || response.status === 200) {
      console.log('✅ Variable creada correctamente\n');
      return true;
    } else {
      console.log(`❌ Error creando: Status ${response.status}\n`);
      console.log('Respuesta:', JSON.stringify(response.data, null, 2));
      return false;
    }
  }
}

async function triggerDeploy() {
  console.log('🚀 [3/3] Iniciando nuevo deploy...\n');
  
  const response = await makeRequest(
    `/v1/services/${SERVICE_ID}/deploys`,
    'POST',
    { clearCache: true }
  );

  if (response.status === 201 || response.status === 200) {
    const deploy = response.data.deploy || response.data;
    console.log('✅ Deploy iniciado correctamente');
    console.log(`   Deploy ID: ${deploy.id || 'N/A'}`);
    console.log(`   Status: ${deploy.status || 'building'}\n`);
    console.log('⏳ El servicio se reiniciará automáticamente en 1-2 minutos\n');
    console.log('📊 Monitorea en:');
    console.log(`   https://dashboard.render.com/web/${SERVICE_ID}\n`);
    return true;
  } else {
    console.log(`⚠️  No se pudo iniciar deploy automático: Status ${response.status}`);
    console.log('   Debes hacer un deploy manual desde Render Dashboard\n');
    return false;
  }
}

async function main() {
  try {
    const existingVar = await getCurrentEnvVars();
    const updated = await updateDeepgramKey(existingVar);
    
    if (updated) {
      await triggerDeploy();
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║                    ✅ ACTUALIZACIÓN COMPLETA                 ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝\n');
      console.log('📝 Resumen:');
      console.log('   ✅ DEEPGRAM_API_KEY actualizada en Render');
      console.log('   ✅ Deploy iniciado');
      console.log('   ⏳ Espera 2-3 minutos para que el servicio se reinicie\n');
      console.log('🧪 Prueba después de 2-3 minutos:');
      console.log('   1. Haz una llamada conversacional desde el widget');
      console.log('   2. Verifica que Deepgram transcribe correctamente');
      console.log('   3. Revisa los logs en Render si hay problemas\n');
    } else {
      console.log('❌ No se pudo actualizar la variable');
      console.log('   Actualiza manualmente en Render Dashboard:\n');
      console.log('   1. Ve a: https://dashboard.render.com');
      console.log(`   2. Busca servicio: ${SERVICE_ID}`);
      console.log('   3. Environment > Environment Variables');
      console.log('   4. Edita DEEPGRAM_API_KEY');
      console.log(`   5. Valor: ${NEW_DEEPGRAM_API_KEY}\n`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
