#!/usr/bin/env node
/**
 * Configurar todas las variables de entorno en el proyecto PWA
 */

const https = require('https');
const fs = require('fs');

const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_API_URL = 'api.vercel.com';
const PROJECT_ID = 'prj_xXv3QbfvVdW18VTNijbaxOlv2wI2'; // Proyecto "pwa"

// Variables críticas necesarias para el proyecto PWA
const REQUIRED_VARS = {
  'GEMINI_API_KEY': '',
  'OPENAI_API_KEY': '',
  'GROQ_API_KEY': '',
  'CARTESIA_API_KEY': '',
  'CARTESIA_VOICE_ID': '',
  'DEEPGRAM_API_KEY': '',
  'BRIDGEDATA_API_KEY': '',
  'NEON_DB_URL': '',
  'ANTHROPIC_API_KEY': ''
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

async function copyVarsFromOtherProject() {
  console.log(' Copiando variables del proyecto guestsvalencia-site...\n');
  
  const sourceProjectId = 'prj_HNCaiegvbQcqBHrV8kZwttlKrDPe';
  
  try {
    const envVars = await vercelAPI(`/v9/projects/${sourceProjectId}/env`);
    
    if (envVars.envs) {
      const envMap = {};
      for (const env of envVars.envs) {
        if (!envMap[env.key]) {
          envMap[env.key] = env;
        }
      }
      return envMap;
    }
  } catch (error) {
    console.error('Error obteniendo variables:', error.message);
  }
  
  return {};
}

async function setEnvVar(key, value, targets = ['production', 'preview', 'development']) {
  if (!value || value === '') return false;
  
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
      console.log(`   ${key} -> ${target}`);
      await new Promise(resolve => setTimeout(resolve, 200));
      return true;
    } catch (error) {
      if (error.toString().includes('already exists')) {
        console.log(`    ${key} ya existe en ${target}`);
      } else {
        console.error(`   Error en ${key} (${target}):`, error.message);
      }
    }
  }
  return true;
}

async function main() {
  console.log('  CONFIGURANDO VARIABLES EN PROYECTO PWA\n');
  console.log(` Proyecto ID: ${PROJECT_ID}\n`);
  
  // 1. Leer variables del .env local
  console.log(' Leyendo variables desde .env local...');
  const localVars = readEnvFile();
  console.log(`   ${Object.keys(localVars).length} variables encontradas\n`);
  
  // 2. Copiar variables del otro proyecto como referencia
  console.log(' Obteniendo variables del proyecto guestsvalencia-site...');
  const sourceVars = await copyVarsFromOtherProject();
  console.log(`   ${Object.keys(sourceVars).length} variables disponibles\n`);
  
  // 3. Mapear nombres si es necesario
  const varMapping = {
    'API_KEY_GROQ': 'GROQ_API_KEY',
    'NEON_DATABASE_URL': 'NEON_DB_URL'
  };
  
  // 4. Configurar variables
  console.log('  Configurando variables...\n');
  
  let configured = 0;
  const allVars = { ...localVars };
  
  // Primero, usar variables locales si están disponibles
  for (const [key, value] of Object.entries(localVars)) {
    if (REQUIRED_VARS.hasOwnProperty(key) || key.includes('API_KEY') || key.includes('VOICE') || key.includes('URL')) {
      console.log(`Configurando ${key} desde .env local...`);
      if (await setEnvVar(key, value)) {
        configured++;
      }
    }
  }
  
  // Luego, copiar variables críticas del proyecto fuente si faltan
  const criticalKeys = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'CARTESIA_API_KEY', 'CARTESIA_VOICE_ID', 
                        'DEEPGRAM_API_KEY', 'ANTHROPIC_API_KEY', 'API_KEY_GROQ', 'NEON_DATABASE_URL'];
  
  for (const sourceKey of criticalKeys) {
    const targetKey = varMapping[sourceKey] || sourceKey;
    
    if (sourceVars[sourceKey] && !allVars[targetKey]) {
      console.log(`Configurando ${targetKey} desde proyecto fuente...`);
      const value = sourceVars[sourceKey].value;
      if (await setEnvVar(targetKey, value)) {
        configured++;
      }
    }
  }
  
  console.log(`\n ${configured} variables configuradas\n`);
  
  // 5. Mostrar URL de producción
  const prodUrl = 'https://pwa-2caws3ssh-guests-valencias-projects.vercel.app';
  console.log('='.repeat(60));
  console.log(' CONFIGURACIÓN COMPLETADA');
  console.log('='.repeat(60));
  console.log(`\n URL de Producción: ${prodUrl}\n`);
  
  fs.writeFileSync('PRODUCTION_URL.txt', `${prodUrl}\n${new Date().toISOString()}\n`);
  console.log(' URL guardada en: PRODUCTION_URL.txt\n');
  
  console.log(' Próximos pasos:');
  console.log('  1. Verifica las variables en Vercel Dashboard');
  console.log('  2. Si faltan variables críticas (BRIDGEDATA_API_KEY, NEON_DB_URL), añádelas manualmente');
  console.log('  3. Prueba la aplicación en:', prodUrl);
  console.log('  4. Verifica los endpoints /api/sandra/*\n');
}

main().catch(error => {
  console.error('\n Error:', error.message);
  process.exit(1);
});

