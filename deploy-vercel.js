#!/usr/bin/env node
/**
 * Script de Deployment Completo a Vercel
 * Configura proyecto, variables de entorno y despliega
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 DEPLOYMENT COMPLETO A VERCEL - GuestsValencia PWA + Sandra IA\n');

// Lista completa de variables de entorno necesarias
const REQUIRED_ENV_VARS = {
  // IA Models - Core
  'GEMINI_API_KEY': 'Clave API de Google Gemini',
  'OPENAI_API_KEY': 'Clave API de OpenAI (GPT-4o)',
  'GROQ_API_KEY': 'Clave API de Groq (Mixtral)',
  
  // Voice & Transcription
  'CARTESIA_API_KEY': 'Clave API de Cartesia (TTS)',
  'CARTESIA_VOICE_ID': 'ID de voz de Cartesia para Sandra',
  'DEEPGRAM_API_KEY': 'Clave API de Deepgram (STT)',
  
  // Database
  'NEON_DB_URL': 'URL de conexión a Neon Database',
  
  // External APIs
  'BRIDGEDATA_API_KEY': 'Clave API de BridgeData (Booking)',
  
  // Optional Services
  'ANTHROPIC_API_KEY': 'Clave API de Anthropic (Claude) - Opcional',
  'ELEVENLABS_API_KEY': 'Clave API de ElevenLabs - Opcional',
  'ELEVENLABS_VOICE_ID': 'ID de voz de ElevenLabs - Opcional',
  'HEYGEN_API_KEY': 'Clave API de HeyGen (Video Avatar) - Opcional',
  'HEYGEN_AVATAR_ID': 'ID de avatar de HeyGen - Opcional',
  'ID_VIDEO_AVATAR': 'ID de video avatar - Opcional',
  
  // Proxy & Network
  'BRIGHTDATA_PROXY_URL': 'URL de proxy BrightData - Opcional',
  'BRIGHTDATA_HTTP_PROXY': 'HTTP Proxy BrightData - Opcional',
  
  // Database - Additional
  'SUPABASE_API_KEY': 'Clave API de Supabase - Opcional',
  
  // Communications
  'TWILIO_SID': 'SID de Twilio - Opcional',
  'TWILIO_AUTH_TOKEN': 'Token de autenticación de Twilio - Opcional',
  'TWILIO_PHONE_NUMBER': 'Número de teléfono de Twilio - Opcional',
  'WHATSAPP_SANDRA': 'Número de WhatsApp de Sandra - Opcional',
  
  // Payments
  'PAYPAL_CLIENT_ID': 'Client ID de PayPal - Opcional',
  'PAYPAL_CLIENT_SECRET': 'Client Secret de PayPal - Opcional',
  'PAYPAL_MODE': 'Modo de PayPal (sandbox/production) - Opcional',
  
  // Security
  'ADMIN_SECRET_KEY': 'Clave secreta de administrador - Opcional',
  'TRAINING_API_KEY': 'Clave API de entrenamiento - Opcional',
  
  // Meta / WhatsApp Business
  'META_ACCESS_TOKEN': 'Token de acceso de Meta - Opcional',
  'META_PHONE_NUMBER_ID': 'ID de número de teléfono de Meta - Opcional',
  
  // LiveKit
  'LIVEKIT_URL': 'URL de LiveKit - Opcional',
  'LIVEKIT_API_KEY': 'Clave API de LiveKit - Opcional',
  'LIVEKIT_API_SECRET': 'Secreto de API de LiveKit - Opcional',
  
  // Vercel (si se necesita)
  'VERCEL_PROJECT_ID': 'ID del proyecto en Vercel - Auto-generado',
  'VERCEL_API_TOKEN': 'Token de API de Vercel - Opcional'
};

// Variables críticas que DEBEN estar presentes
const CRITICAL_VARS = [
  'GEMINI_API_KEY',
  'OPENAI_API_KEY',
  'GROQ_API_KEY',
  'CARTESIA_API_KEY',
  'CARTESIA_VOICE_ID',
  'DEEPGRAM_API_KEY',
  'BRIDGEDATA_API_KEY',
  'NEON_DB_URL'
];

function checkVercelCLI() {
  try {
    execSync('npx vercel --version', { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync('vercel --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

function getVercelCommand() {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    return 'vercel';
  } catch {
    return 'npx vercel';
  }
}

function loginVercel() {
  console.log('🔐 Iniciando sesión en Vercel...');
  const vercelCmd = getVercelCommand();
  try {
    execSync(`${vercelCmd} login`, { stdio: 'inherit' });
    console.log('✅ Sesión iniciada en Vercel\n');
    return true;
  } catch (error) {
    console.error('❌ Error iniciando sesión:', error.message);
    return false;
  }
}

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
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return envVars;
}

function setVercelEnvVar(key, value, environments = ['production', 'preview', 'development']) {
  if (!value || value === '') {
    console.log(`⚠️  Saltando ${key} (valor vacío)`);
    return false;
  }
  
  const vercelCmd = getVercelCommand();
  try {
    for (const env of environments) {
      // Usar stdin para pasar el valor
      const command = `echo "${value.replace(/"/g, '\\"').replace(/\$/g, '\\$')}" | ${vercelCmd} env add ${key} ${env}`;
      execSync(command, { stdio: 'pipe', shell: true });
      console.log(`✅ ${key} configurado para ${env}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Error configurando ${key}:`, error.message);
    return false;
  }
}

function deployToVercel() {
  console.log('\n🚀 Desplegando a Vercel...\n');
  const vercelCmd = getVercelCommand();
  try {
    const output = execSync(`${vercelCmd} --prod --yes`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Extraer URL de producción
    const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/g);
    if (urlMatch && urlMatch.length > 0) {
      const productionUrl = urlMatch[urlMatch.length - 1]; // La última URL es la de producción
      console.log('\n✅ DEPLOYMENT COMPLETADO EXITOSAMENTE');
      console.log(`🌐 URL de Producción: ${productionUrl}\n`);
      
      // Guardar URL en archivo
      fs.writeFileSync(
        path.join(__dirname, 'PRODUCTION_URL.txt'),
        productionUrl + '\n'
      );
      
      return productionUrl;
    } else {
      console.log('\n✅ Deployment completado, pero no se pudo extraer la URL automáticamente');
      console.log('Verifica la URL en el dashboard de Vercel\n');
      return null;
    }
  } catch (error) {
    console.error('\n❌ Error durante el deployment:', error.message);
    return null;
  }
}

async function main() {
  // 1. Verificar Vercel CLI
  if (!checkVercelCLI()) {
    console.error('❌ Vercel CLI no encontrado.');
    console.error('Por favor instálalo: npm i -g vercel');
    console.error('O usa npx: npx vercel');
    process.exit(1);
  }
  
  console.log(`✅ Vercel CLI disponible\n`);
  
  // 2. Login en Vercel
  console.log('📝 Necesitarás iniciar sesión en Vercel...');
  if (!loginVercel()) {
    console.error('❌ No se pudo iniciar sesión en Vercel');
    process.exit(1);
  }
  
  // 3. Leer variables de entorno del archivo .env
  console.log('\n📖 Leyendo variables de entorno desde .env...');
  const envVars = readEnvFile();
  
  // 4. Verificar variables críticas
  console.log('\n🔍 Verificando variables críticas...');
  const missing = [];
  for (const key of CRITICAL_VARS) {
    if (!envVars[key] || envVars[key] === '') {
      missing.push(key);
      console.warn(`⚠️  FALTA: ${key}`);
    } else {
      console.log(`✅ ${key}`);
    }
  }
  
  if (missing.length > 0) {
    console.error(`\n❌ FALTAN VARIABLES CRÍTICAS: ${missing.join(', ')}`);
    console.error('Por favor, añade estas variables al archivo .env antes de continuar\n');
    process.exit(1);
  }
  
  // 5. Configurar variables en Vercel
  console.log('\n⚙️  Configurando variables de entorno en Vercel...\n');
  let configured = 0;
  let skipped = 0;
  
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = envVars[key];
    if (value && value !== '') {
      if (setVercelEnvVar(key, value)) {
        configured++;
      } else {
        skipped++;
      }
    } else {
      // Para variables opcionales, solo avisar
      if (!CRITICAL_VARS.includes(key)) {
        console.log(`⚠️  ${key} no configurada (opcional)`);
        skipped++;
      }
    }
  }
  
  console.log(`\n📊 Resumen: ${configured} variables configuradas, ${skipped} omitidas\n`);
  
  // 6. Deploy
  const productionUrl = deployToVercel();
  
  // 7. Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('🎉 DEPLOYMENT COMPLETADO');
  console.log('='.repeat(60));
  
  if (productionUrl) {
    console.log(`\n✅ URL de Producción: ${productionUrl}`);
    console.log(`\n📄 URL guardada en: PRODUCTION_URL.txt\n`);
    
    console.log('📋 Próximos pasos:');
    console.log('  1. Verifica que la aplicación funciona en:', productionUrl);
    console.log('  2. Prueba el widget de Sandra IA');
    console.log('  3. Verifica los endpoints /api/sandra/*');
    console.log('  4. Monitorea los logs en Vercel Dashboard\n');
  }
  
  console.log('✨ ¡Sistema completo desplegado en producción!\n');
}

// Ejecutar
main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

