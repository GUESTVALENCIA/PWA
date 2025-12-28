#!/usr/bin/env node
/**
 * Configurar TODAS las variables de Vercel automáticamente
 * Usa el token y las variables del archivo VARIABLESFULL.txt
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_API_URL = 'api.vercel.com';
const PROJECT_ID = 'prj_xXv3QbfvVdW18VTNijbaxOlv2wI2'; // Proyecto PWA

// Variables extraídas del archivo VARIABLESFULL.txt
const VARIABLES = {
  // LLM APIs
  'GROQ_API_KEY': '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',
  'OPENAI_API_KEY': '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',
  'GEMINI_API_KEY': 'AIzaSyDUKR3tAPvCthWdlRA8w3qY0Saz018im0M',
  'ANTHROPIC_API_KEY': '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',
  
  // Voice APIs
  'CARTESIA_API_KEY': 'sk_car_4kqDWMhSVqXgXUdma44WAc',
  'CARTESIA_VOICE_ID': '2d5b0e6cf361460aa7fc47e3cee4b30c',
  'DEEPGRAM_API_KEY': '53202ecf825c59e8ea498f7cf68c4822c2466005',
  
  // MCP Server
  'MCP_SERVER_URL': 'https://pwa-imbf.onrender.com',
  'MCP_TOKEN': '', // Opcional
  
  // Database
  'DATABASE_URL': 'postgresql://neondb_owner:npg_G2baKCg4FlyN@ep-fragrant-meadow-ah27lbiy-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  'NEON_DB_URL': 'postgresql://neondb_owner:npg_G2baKCg4FlyN@ep-fragrant-meadow-ah27lbiy-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  
  // BrightData Proxy
  'BRIDGEDATA_API_KEY': 'brd-customer-hl_c4b3455e-zone-mcp_booking_airbnb:rsxgwjh411m4',
  'BRIGHTDATA_PROXY_URL': 'wss://brd-customer-hl_c4b3455e-zone-mcp_booking_airbnb:rsxgwjh411m4@brd.superproxy.io:9222',
  
  // Render API
  'RENDER_API_KEY': 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR',
  
  // LiveKit
  'LIVEKIT_URL': 'wss://sandra-ia-zao5fe43.livekit.cloud',
  'LIVEKIT_API_KEY': 'APIqjYoygUaeqVr',
  'LIVEKIT_API_SECRET': 'VfvfuprOXBDHgU4CoBdFxLPqCMnwf1pC2WVaKpz3ltoB',
  
  // Twilio
  'TWILIO_ACCOUNT_SID': 'AC38300ea2b028ab4a55d6487f6451f69b',
  'TWILIO_AUTH_TOKEN': '5502a7df0779ba9124318c4e0543d695',
  'TWILIO_API_KEY': 'SK869e3c1bcc587a0c4588e4864f1d65cb',
  'TWILIO_API_SECRET': 'vntK8Q2sZ60T9RHkiHMOOoGbIOm4vuCZ',
  
  // Meta/Facebook
  'META_ACCESS_TOKEN': 'EAATkBfISk9cBPiszg5gmZAmq9GODrr3zeI9YHGSzSNFGebVMz8piNXlPy1Gzr0smXpr1ZCDMwrP8v0FCWuttmrWSQLxMcTY0OWC3LSHYVPcFm41uSBlVU9wSsuPZACk1zHuDUIo68jvFEfkzcSt3BLgRddLs9Rjl1NKSwufuUpkGZA5VCY8EYpGs94PHtatCAD75tswLMsyC19CWmI3C0PeieksEJpdSTBjjWUxZCpm4ZD',
  'META_PHONE_NUMBER_ID': '15551715026',
  
  // HeyGen
  'HEYGEN_API_KEY': 'M2IzYzcyOGY1ZmFhNGI5YmE5NzBlZTFiNDhmOTc3MDMtMTc1MzU4MDA1OA==',
  'HEYGEN_AVATAR_ID': 'a7a7e63f00a74ff984d4b43f984c438c',
  
  // ElevenLabs
  'ELEVENLABS_API_KEY': 'sk_972694e47b2a8ace6912f6689b8527b746cdf4bec9bae242',
  'ELEVENLABS_VOICE_ID': '06H5cbUvetCmVYi9HUXk',
  
  // Cloudflare
  'CLOUDFLARE_API_TOKEN': 'WGQ-Nl4N_1SBU8A-BwedHjPMOgYPtBcG2ovEVKaZ',
  
  // Airtable
  'AIRTABLE_API_KEY': 'patXZdUY9gvEdPGD6.6fa36d14b7704748b52338675e9068e4477b54a6639148bea21903eea1c3c95e',
  
  // Supabase
  'SUPABASE_API_KEY': 'sbp_3a189b37629297730dca5ceb1b48851414f4a58c',
  
  // OpenRouter
  'OPENROUTER_API_KEY': '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',
  
  // PayPal
  'PAYPAL_CLIENT_ID': 'AYs9dULgQ12igjVhbMCFnXtBVcrmrJ25PWV949ZOFMFyEQTAS1eE7Bdm7iybUqnA0GSGZRl5q9Ar-wT8',
  'PAYPAL_CLIENT_SECRET': 'EEjIKqOQpLodh6VEpwt0z3YOE_xkk1sQ1J1DzSKXjfpKKGZ6WqjidWus3hcrIwpl3jyo6JpI2jHsg7mA',
  'PAYPAL_MODE': 'sandbox',
  
  // Model defaults
  'OPENAI_MODEL_DEFAULT': 'gpt-4o',
  'OPENAI_MODEL_GUEST': 'gpt-4o',
  'OPENAI_MODEL_VISITOR': 'gpt-4o-mini',
  'LIMIT_GUEST_TXT': 'gpt-4o',
  'LIMIT_VISITOR_TXT': 'gpt-4o',
  'LIMIT_PREMIUN_TXT': 'gpt-4o',
  
  // Training
  'TRAINING_API_KEY': 'gv_train_s7_S4ndraValencia_8k9ZrT2pQ6',
  
  // Admin
  'ADMIN_SECRET_KEY': 'GV_admin_2bfe7f97a3f64',
  
  // Environment
  'NODE_ENV': 'production',
  'REQUIRE_AUTH': 'false'
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
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
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
  console.log('📥 Obteniendo variables actuales de Vercel...\n');
  try {
    const response = await vercelAPI(`/v9/projects/${PROJECT_ID}/env`);
    if (response.status === 200 && response.data.envs) {
      return response.data.envs;
    }
    return [];
  } catch (error) {
    console.error('❌ Error obteniendo variables:', error.message);
    return [];
  }
}

async function setEnvVar(key, value, target = ['production', 'preview', 'development']) {
  console.log(`   ⚙️  Configurando ${key}...`);
  try {
    const response = await vercelAPI(`/v9/projects/${PROJECT_ID}/env`, 'POST', {
      key,
      value,
      type: 'encrypted',
      target
    });
    
    if (response.status === 200 || response.status === 201) {
      console.log(`   ✅ ${key} configurada correctamente`);
      return true;
    } else {
      console.log(`   ⚠️  ${key}: ${response.status} - ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error configurando ${key}: ${error.message}`);
    return false;
  }
}

async function updateEnvVar(envId, key, value, target = ['production', 'preview', 'development']) {
  console.log(`   🔄 Actualizando ${key}...`);
  try {
    const response = await vercelAPI(`/v9/projects/${PROJECT_ID}/env/${envId}`, 'PATCH', {
      value,
      target
    });
    
    if (response.status === 200) {
      console.log(`   ✅ ${key} actualizada correctamente`);
      return true;
    } else {
      console.log(`   ⚠️  ${key}: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error actualizando ${key}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 CONFIGURACIÓN AUTOMÁTICA DE VARIABLES EN VERCEL\n');
  console.log('='.repeat(70));
  console.log(`Proyecto ID: ${PROJECT_ID}`);
  console.log(`Total de variables a configurar: ${Object.keys(VARIABLES).length}`);
  console.log('='.repeat(70) + '\n');

  // Obtener variables actuales
  const currentVars = await getCurrentEnvVars();
  const currentVarsMap = {};
  currentVars.forEach(env => {
    currentVarsMap[env.key] = env;
  });

  console.log(`📊 Variables actuales en Vercel: ${currentVars.length}\n`);

  // Configurar todas las variables
  let configured = 0;
  let updated = 0;
  let errors = 0;

  for (const [key, value] of Object.entries(VARIABLES)) {
    if (!value || value.trim() === '') {
      console.log(`   ⏭️  Omitiendo ${key} (valor vacío)`);
      continue;
    }

    if (currentVarsMap[key]) {
      // Variable existe, actualizar
      const result = await updateEnvVar(currentVarsMap[key].id, key, value);
      if (result) updated++;
      else errors++;
    } else {
      // Variable nueva, crear
      const created = await setEnvVar(key, value);
      if (created) configured++;
      else errors++;
    }
    
    // Pequeña pausa para no saturar la API
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN');
  console.log('='.repeat(70));
  console.log(`✅ Variables nuevas configuradas: ${configured}`);
  console.log(`🔄 Variables actualizadas: ${updated}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`📝 Total procesadas: ${Object.keys(VARIABLES).length}`);
  console.log('='.repeat(70) + '\n');

  // Verificar configuración final
  console.log('🔍 Verificando configuración final...\n');
  const finalVars = await getCurrentEnvVars();
  console.log(`✅ Total de variables en Vercel: ${finalVars.length}\n`);

  // Mostrar variables críticas
  console.log('🔑 VARIABLES CRÍTICAS CONFIGURADAS:');
  const criticalVars = ['GROQ_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 
                        'CARTESIA_API_KEY', 'DEEPGRAM_API_KEY', 'MCP_SERVER_URL'];
  criticalVars.forEach(key => {
    const env = finalVars.find(e => e.key === key);
    if (env) {
      const preview = env.value ? env.value.substring(0, 20) + '...' : '(vacío)';
      console.log(`   ✅ ${key}: ${preview}`);
    } else {
      console.log(`   ❌ ${key}: NO CONFIGURADA`);
    }
  });

  console.log('\n✅ Configuración completada!\n');
}

main().catch(console.error);

