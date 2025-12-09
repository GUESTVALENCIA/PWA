#!/usr/bin/env node
/**
 * Añadir variables de entorno faltantes para post-producción
 * Especialmente BRIDGEDATA_API_KEY para tiempo real
 */

const https = require('https');
const fs = require('fs');

const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_API_URL = 'api.vercel.com';
const PROJECT_ID = 'prj_xXv3QbfvVdW18VTNijbaxOlv2wI2'; // Proyecto "pwa"

// Variables necesarias para post-producción y tiempo real
const MISSING_VARS = {
  'BRIDGEDATA_API_KEY': 'Clave API de BridgeData para booking/reservas en tiempo real',
  'NEON_DB_URL': 'URL de conexión a Neon Database (verificar si ya está configurada)'
};

// Variables adicionales opcionales pero recomendadas
const OPTIONAL_VARS = {
  'WHATSAPP_SANDRA': 'Número de WhatsApp de Sandra',
  'TWILIO_SID': 'SID de Twilio para comunicaciones',
  'TWILIO_AUTH_TOKEN': 'Token de autenticación de Twilio',
  'TWILIO_PHONE_NUMBER': 'Número de teléfono de Twilio',
  'META_ACCESS_TOKEN': 'Token de acceso de Meta para WhatsApp Business',
  'META_PHONE_NUMBER_ID': 'ID de número de teléfono de Meta',
  'PAYPAL_CLIENT_ID': 'Client ID de PayPal',
  'PAYPAL_CLIENT_SECRET': 'Client Secret de PayPal',
  'PAYPAL_MODE': 'Modo de PayPal (sandbox/production)'
};

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

function readEnvFile() {
  const envPath = '.env';
  if (!fs.existsSync(envPath)) return {};
  
  const content = fs.readFileSync(envPath, 'utf8');
  const vars = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return vars;
}

async function getExistingVars() {
  try {
    const envVars = await vercelAPI(`/v9/projects/${PROJECT_ID}/env`);
    const existing = {};
    
    if (envVars.envs) {
      for (const env of envVars.envs) {
        if (!existing[env.key]) {
          existing[env.key] = env;
        }
      }
    }
    
    return existing;
  } catch (error) {
    console.error('Error obteniendo variables existentes:', error.message);
    return {};
  }
}

async function copyVarFromOtherProject(key, sourceProjectId = 'prj_HNCaiegvbQcqBHrV8kZwttlKrDPe') {
  try {
    const envVars = await vercelAPI(`/v9/projects/${sourceProjectId}/env`);
    
    if (envVars.envs) {
      // Buscar la variable
      for (const env of envVars.envs) {
        if (env.key === key || env.key === key.replace('_API_KEY', '').replace('API_KEY_', 'API_KEY_')) {
          return env.value;
        }
      }
      
      // Buscar variaciones del nombre
      const variations = [
        key,
        key.replace('BRIDGEDATA', 'BRIDGE_DATA'),
        key.replace('_API_KEY', ''),
        'API_KEY_' + key.replace('_API_KEY', '')
      ];
      
      for (const env of envVars.envs) {
        if (variations.includes(env.key)) {
          return env.value;
        }
      }
    }
  } catch (error) {
    console.error(`Error copiando ${key}:`, error.message);
  }
  
  return null;
}

async function setEnvVar(key, value, targets = ['production', 'preview', 'development']) {
  if (!value || value === '') {
    console.log(`  ⚠️  ${key}: Valor vacío, omitiendo`);
    return false;
  }
  
  let success = false;
  for (const target of targets) {
    try {
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
      console.log(`  ✅ ${key} -> ${target}`);
      success = true;
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      if (error.toString().includes('already exists') || error.toString().includes('409')) {
        console.log(`  ⚠️  ${key} ya existe en ${target}, actualizando...`);
        // Intentar actualizar
        try {
          // Primero obtener el ID de la variable existente
          const envVars = await vercelAPI(`/v9/projects/${PROJECT_ID}/env`);
          if (envVars.envs) {
            const existing = envVars.envs.find(e => e.key === key && e.target && e.target.includes(target));
            if (existing) {
              // Eliminar la existente
              await vercelAPI(`/v9/projects/${PROJECT_ID}/env/${existing.id}`, 'DELETE');
              // Añadir la nueva
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
              console.log(`  ✅ ${key} actualizado en ${target}`);
              success = true;
            }
          }
        } catch (updateError) {
          console.log(`  ⚠️  No se pudo actualizar ${key} en ${target}`);
        }
      } else {
        console.error(`  ❌ Error en ${key} (${target}):`, error.message || error.toString());
      }
    }
  }
  
  return success;
}

async function main() {
  console.log('⚙️  AÑADIENDO VARIABLES FALTANTES PARA POST-PRODUCCIÓN\n');
  console.log(`📦 Proyecto: pwa (${PROJECT_ID})\n`);
  
  // 1. Obtener variables existentes
  console.log('📋 Verificando variables existentes...');
  const existing = await getExistingVars();
  console.log(`   ${Object.keys(existing).length} variables encontradas\n`);
  
  // 2. Leer variables del .env local
  console.log('📖 Leyendo variables desde .env local...');
  const localVars = readEnvFile();
  console.log(`   ${Object.keys(localVars).length} variables encontradas\n`);
  
  // 3. Variables que necesitamos añadir
  const varsToAdd = {};
  
  console.log('🔍 Buscando variables faltantes...\n');
  
  // Verificar variables críticas
  for (const [key, description] of Object.entries(MISSING_VARS)) {
    if (!existing[key] || !existing[key].value) {
      console.log(`⚠️  FALTA: ${key} - ${description}`);
      
      // Buscar en .env local primero
      if (localVars[key]) {
        varsToAdd[key] = localVars[key];
        console.log(`  ✅ Encontrada en .env local`);
      } else {
        // Intentar copiar del otro proyecto
        console.log(`  🔍 Buscando en proyecto fuente...`);
        const value = await copyVarFromOtherProject(key);
        if (value) {
          varsToAdd[key] = value;
          console.log(`  ✅ Copiada del proyecto fuente`);
        } else {
          console.log(`  ❌ No encontrada. Necesitas añadirla manualmente.`);
        }
      }
    } else {
      console.log(`✅ ${key} ya está configurada`);
    }
  }
  
  // Verificar variables opcionales
  console.log(`\n📋 Verificando variables opcionales recomendadas...\n`);
  for (const [key, description] of Object.entries(OPTIONAL_VARS)) {
    if (!existing[key] || !existing[key].value) {
      if (localVars[key]) {
        varsToAdd[key] = localVars[key];
        console.log(`✅ ${key} - Añadida desde .env local`);
      } else {
        const value = await copyVarFromOtherProject(key);
        if (value) {
          varsToAdd[key] = value;
          console.log(`✅ ${key} - Copiada del proyecto fuente`);
        }
      }
    }
  }
  
  // 4. Configurar variables
  if (Object.keys(varsToAdd).length > 0) {
    console.log(`\n⚙️  Configurando ${Object.keys(varsToAdd).length} variables...\n`);
    
    let configured = 0;
    for (const [key, value] of Object.entries(varsToAdd)) {
      console.log(`Configurando ${key}...`);
      if (await setEnvVar(key, value)) {
        configured++;
      }
    }
    
    console.log(`\n✅ ${configured} variables configuradas exitosamente\n`);
  } else {
    console.log(`\n✅ Todas las variables necesarias ya están configuradas\n`);
  }
  
  // 5. Resumen final
  console.log('='.repeat(60));
  console.log('🎉 CONFIGURACIÓN COMPLETADA');
  console.log('='.repeat(60));
  
  const finalVars = await getExistingVars();
  console.log(`\n📊 Total de variables configuradas: ${Object.keys(finalVars).length}\n`);
  
  console.log('📋 Variables críticas para tiempo real:');
  const critical = ['BRIDGEDATA_API_KEY', 'NEON_DB_URL'];
  for (const key of critical) {
    if (finalVars[key] && finalVars[key].value) {
      console.log(`  ✅ ${key}`);
    } else {
      console.log(`  ⚠️  ${key} - FALTA (añadir manualmente en Vercel Dashboard)`);
    }
  }
  
  console.log('\n📋 Próximos pasos:');
  console.log('  1. Verifica las variables en Vercel Dashboard');
  console.log('  2. Si BRIDGEDATA_API_KEY falta, añádela manualmente');
  console.log('  3. Reinicia el deployment si es necesario');
  console.log('  4. Prueba el flujo completo de Sandra con datos en tiempo real\n');
  
  const prodUrl = 'https://pwa-2caws3ssh-guests-valencias-projects.vercel.app';
  console.log(`🌐 URL de Producción: ${prodUrl}\n`);
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

