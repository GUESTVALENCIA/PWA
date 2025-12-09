#!/usr/bin/env node
/**
 * Script de Deployment Automático con Tokens de Vercel
 * Configura proyecto, variables de entorno y despliega
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 DEPLOYMENT AUTOMÁTICO A VERCEL - GuestsValencia PWA + Sandra IA\n');

// Tokens proporcionados
const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_PROJECT_TOKEN = '56zab4D9ovbL8Sj63n4WdA3b';

// Lista completa de variables de entorno
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
    console.warn('⚠️  Archivo .env no encontrado, buscando .env.local...');
    const envLocalPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envLocalPath)) {
      return readEnvFromFile(envLocalPath);
    }
    return {};
  }
  return readEnvFromFile(envPath);
}

function readEnvFromFile(filePath) {
  const envContent = fs.readFileSync(filePath, 'utf8');
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

function setEnvVarViaAPI(key, value, environments = ['production', 'preview', 'development']) {
  if (!value || value === '') {
    return false;
  }
  
  for (const env of environments) {
    try {
      // Usar Vercel CLI con el token
      const command = `echo "${value.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`')}" | npx vercel env add ${key} ${env} --token ${VERCEL_API_TOKEN}`;
      execSync(command, { stdio: 'pipe', shell: true });
      console.log(`  ✅ ${key} -> ${env}`);
      return true;
    } catch (error) {
      console.error(`  ❌ Error en ${key} (${env}):`, error.message);
      return false;
    }
  }
  return true;
}

function deployToVercel() {
  console.log('\n🚀 Desplegando a producción...\n');
  try {
    // Configurar token
    process.env.VERCEL_TOKEN = VERCEL_API_TOKEN;
    
    const output = execSync('npx vercel --prod --yes --token ' + VERCEL_API_TOKEN, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log(output);
    
    // Extraer URL
    const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/g);
    if (urlMatch && urlMatch.length > 0) {
      return urlMatch[urlMatch.length - 1];
    }
    
    return null;
  } catch (error) {
    console.error('Error durante deployment:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
    return null;
  }
}

async function main() {
  console.log('📖 Leyendo variables de entorno...\n');
  const envVars = readEnvFile();
  
  console.log(`📊 Variables encontradas: ${Object.keys(envVars).length}\n`);
  
  // Verificar variables críticas
  const critical = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'GROQ_API_KEY', 'CARTESIA_API_KEY', 
                    'CARTESIA_VOICE_ID', 'DEEPGRAM_API_KEY', 'BRIDGEDATA_API_KEY', 'NEON_DB_URL'];
  
  console.log('🔍 Verificando variables críticas...');
  const missing = [];
  for (const key of critical) {
    if (envVars[key]) {
      console.log(`  ✅ ${key}`);
    } else {
      console.log(`  ⚠️  FALTA: ${key}`);
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    console.log(`\n⚠️  Advertencia: Faltan ${missing.length} variables críticas`);
    console.log('El deployment continuará pero algunas funciones pueden no funcionar\n');
  }
  
  // Configurar variables en Vercel
  console.log('\n⚙️  Configurando variables de entorno en Vercel...\n');
  let configured = 0;
  
  for (const key of ALL_ENV_VARS) {
    const value = envVars[key];
    if (value) {
      console.log(`Configurando ${key}...`);
      if (setEnvVarViaAPI(key, value)) {
        configured++;
        // Pequeño delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }
  
  console.log(`\n✅ ${configured} variables configuradas\n`);
  
  // Deploy
  const productionUrl = deployToVercel();
  
  // Guardar URL
  if (productionUrl) {
    fs.writeFileSync(
      path.join(__dirname, 'PRODUCTION_URL.txt'),
      productionUrl + '\n' + new Date().toISOString() + '\n'
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEPLOYMENT COMPLETADO');
    console.log('='.repeat(60));
    console.log(`\n✅ URL de Producción: ${productionUrl}\n`);
    console.log('📄 URL guardada en: PRODUCTION_URL.txt\n');
    console.log('📋 Verificaciones:');
    console.log('  1. Abre la URL y verifica que la app carga');
    console.log('  2. Prueba el widget de Sandra IA');
    console.log('  3. Verifica endpoints: /api/sandra/chat');
    console.log('  4. Revisa logs en Vercel Dashboard\n');
    
    return productionUrl;
  } else {
    console.log('\n⚠️  Deployment completado pero no se pudo extraer la URL');
    console.log('Verifica en el dashboard de Vercel\n');
    return null;
  }
}

main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

