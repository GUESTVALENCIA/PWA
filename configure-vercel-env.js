#!/usr/bin/env node
/**
 * Script para configurar variables de entorno en Vercel
 * Ya que el proyecto está desplegado manualmente
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('⚙️  CONFIGURACIÓN DE VARIABLES DE ENTORNO EN VERCEL\n');

const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';

// Lista completa de variables
const ALL_ENV_VARS = [
  // Críticas
  'GEMINI_API_KEY',
  'OPENAI_API_KEY',
  'GROQ_API_KEY',
  'CARTESIA_API_KEY',
  'CARTESIA_VOICE_ID',
  'DEEPGRAM_API_KEY',
  'BRIDGEDATA_API_KEY',
  'NEON_DB_URL',
  // Opcionales
  'ANTHROPIC_API_KEY',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID',
  'HEYGEN_API_KEY',
  'HEYGEN_AVATAR_ID',
  'ID_VIDEO_AVATAR',
  'BRIGHTDATA_PROXY_URL',
  'BRIGHTDATA_HTTP_PROXY',
  'SUPABASE_API_KEY',
  'TWILIO_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'WHATSAPP_SANDRA',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_MODE',
  'ADMIN_SECRET_KEY',
  'TRAINING_API_KEY',
  'META_ACCESS_TOKEN',
  'META_PHONE_NUMBER_ID',
  'LIVEKIT_URL',
  'LIVEKIT_API_KEY',
  'LIVEKIT_API_SECRET'
];

function readEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  Archivo .env no encontrado');
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (value) {
          envVars[key.trim()] = value;
        }
      }
    }
  });
  
  return envVars;
}

async function setEnvVar(key, value, environments = ['production', 'preview', 'development']) {
  if (!value || value === '') {
    return false;
  }
  
  for (const env of environments) {
    try {
      // Escapar el valor correctamente
      const escapedValue = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\$/g, '\\$')
        .replace(/`/g, '\\`');
      
      // Usar PowerShell para pasar el valor de forma segura
      const command = process.platform === 'win32' 
        ? `$value = "${escapedValue}"; echo $value | npx vercel env add ${key} ${env} --token ${VERCEL_API_TOKEN} --yes`
        : `echo "${escapedValue}" | npx vercel env add ${key} ${env} --token ${VERCEL_API_TOKEN} --yes`;
      
      execSync(command, { stdio: 'pipe', shell: true });
      console.log(`  ✅ ${key} -> ${env}`);
      // Pequeño delay para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    } catch (error) {
      // Si la variable ya existe, intentar actualizarla
      if (error.message.includes('already exists') || error.message.includes('already')) {
        try {
          console.log(`  ⚠️  ${key} ya existe en ${env}, intentando actualizar...`);
          const updateCommand = process.platform === 'win32'
            ? `$value = "${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$')}"; echo $value | npx vercel env rm ${key} ${env} --token ${VERCEL_API_TOKEN} --yes; echo $value | npx vercel env add ${key} ${env} --token ${VERCEL_API_TOKEN} --yes`
            : `echo "${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}" | npx vercel env rm ${key} ${env} --token ${VERCEL_API_TOKEN} --yes 2>/dev/null; echo "${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}" | npx vercel env add ${key} ${env} --token ${VERCEL_API_TOKEN} --yes`;
          execSync(updateCommand, { stdio: 'pipe', shell: true });
          console.log(`  ✅ ${key} actualizado en ${env}`);
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (updateError) {
          console.error(`  ❌ Error actualizando ${key} en ${env}`);
        }
      } else {
        console.error(`  ❌ Error en ${key} (${env}):`, error.message.split('\n')[0]);
      }
      return false;
    }
  }
  return true;
}

async function getProductionUrl() {
  try {
    const output = execSync(`npx vercel ls --token ${VERCEL_API_TOKEN}`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Buscar la URL de producción
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('https://') && line.includes('.vercel.app')) {
        const match = line.match(/https:\/\/[^\s]+\.vercel\.app/);
        if (match) {
          return match[0];
        }
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function main() {
  console.log('📖 Leyendo variables de entorno desde .env...\n');
  const envVars = readEnvFile();
  
  console.log(`📊 Variables encontradas: ${Object.keys(envVars).length}\n`);
  
  // Mostrar qué variables tenemos
  console.log('📋 Variables disponibles:\n');
  for (const key of ALL_ENV_VARS) {
    if (envVars[key]) {
      console.log(`  ✅ ${key}`);
    } else {
      console.log(`  ⚠️  ${key} - NO configurada`);
    }
  }
  
  console.log('\n⚙️  Configurando variables en Vercel...\n');
  
  let configured = 0;
  let skipped = 0;
  
  for (const key of ALL_ENV_VARS) {
    const value = envVars[key];
    if (value) {
      console.log(`Configurando ${key}...`);
      if (await setEnvVar(key, value)) {
        configured++;
      }
    } else {
      skipped++;
    }
  }
  
  console.log(`\n✅ ${configured} variables configuradas`);
  console.log(`⚠️  ${skipped} variables omitidas (no están en .env)\n`);
  
  // Intentar obtener URL de producción
  console.log('🔍 Buscando URL de producción...');
  const prodUrl = await getProductionUrl();
  
  if (prodUrl) {
    console.log(`\n✅ URL de Producción encontrada: ${prodUrl}\n`);
    fs.writeFileSync(
      path.join(__dirname, 'PRODUCTION_URL.txt'),
      prodUrl + '\n' + new Date().toISOString() + '\n'
    );
    console.log('📄 URL guardada en: PRODUCTION_URL.txt\n');
  } else {
    console.log('\n⚠️  No se pudo obtener la URL automáticamente');
    console.log('Puedes obtenerla desde: https://vercel.com/dashboard\n');
  }
  
  console.log('='.repeat(60));
  console.log('🎉 CONFIGURACIÓN COMPLETADA');
  console.log('='.repeat(60));
  console.log('\n📋 Próximos pasos:');
  console.log('  1. Verifica las variables en Vercel Dashboard');
  console.log('  2. Si faltan variables, añádelas manualmente o al .env');
  console.log('  3. Reinicia el deployment si es necesario');
  console.log('  4. Prueba los endpoints /api/sandra/*\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

