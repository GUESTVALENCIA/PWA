#!/usr/bin/env node
/**
 * Script para Verificar TODAS las APIs de IA Configuradas
 * Prueba cada modelo individualmente con sus credenciales reales
 */

const https = require('https');

const PRODUCTION_URL = 'https://pwa-chi-six.vercel.app';

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json, raw: body, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, raw: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testOpenAI() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.blue}🔵 PROBANDO OPENAI (GPT-4o)${colors.reset}`);
  console.log('='.repeat(70));

  try {
    const testMessage = 'Hola, responde solo con "OK" si me escuchas';
    console.log(`\n📤 Enviando a: ${PRODUCTION_URL}/api/sandra/chat`);
    console.log(`   Mensaje: "${testMessage}"`);

    const response = await makeRequest(`${PRODUCTION_URL}/api/sandra/chat`, {
      method: 'POST',
      body: {
        message: testMessage,
        role: 'hospitality',
        forceModel: 'gpt-4o' // Intentar forzar GPT-4o
      }
    });

    if (response.status === 200) {
      const modelUsed = response.data.model || 'unknown';
      const isGpt4o = modelUsed.includes('gpt-4o') || modelUsed.includes('gpt-4');
      
      if (isGpt4o) {
        console.log(`${colors.green}✅ GPT-4o FUNCIONANDO${colors.reset}`);
        console.log(`   Modelo usado: ${modelUsed}`);
        console.log(`   Respuesta: "${response.data.reply.substring(0, 100)}..."`);
        return { success: true, model: modelUsed, response: response.data.reply };
      } else {
        console.log(`${colors.yellow}⚠️  NO SE ESTÁ USANDO GPT-4o${colors.reset}`);
        console.log(`   Modelo usado: ${modelUsed}`);
        console.log(`   Esto significa que OPENAI_API_KEY no está configurada o no es válida`);
        return { success: false, model: modelUsed, error: 'No se está usando GPT-4o' };
      }
    } else {
      console.log(`${colors.red}❌ Error: ${response.status}${colors.reset}`);
      console.log(`   Respuesta: ${response.raw.substring(0, 200)}`);
      return { success: false, error: `Status ${response.status}` };
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error de conexión: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function testGroqQwen() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}🟣 PROBANDO GROQ (QWEN 2.5)${colors.reset}`);
  console.log('='.repeat(70));

  try {
    const testMessage = 'Hola, responde solo con "OK" si me escuchas';
    console.log(`\n📤 Enviando a: ${PRODUCTION_URL}/api/sandra/chat`);
    console.log(`   Mensaje: "${testMessage}"`);

    const response = await makeRequest(`${PRODUCTION_URL}/api/sandra/chat`, {
      method: 'POST',
      body: {
        message: testMessage,
        role: 'hospitality'
      }
    });

    if (response.status === 200) {
      const modelUsed = response.data.model || 'unknown';
      const isQwen = modelUsed.includes('qwen');
      
      if (isQwen) {
        console.log(`${colors.green}✅ GROQ (QWEN) FUNCIONANDO${colors.reset}`);
        console.log(`   Modelo usado: ${modelUsed}`);
        console.log(`   Respuesta: "${response.data.reply.substring(0, 100)}..."`);
        return { success: true, model: modelUsed, response: response.data.reply };
      } else {
        console.log(`${colors.yellow}⚠️  NO SE ESTÁ USANDO QWEN${colors.reset}`);
        console.log(`   Modelo usado: ${modelUsed}`);
        console.log(`   Esto significa que GROQ_API_KEY no está configurada o no se está usando`);
        return { success: false, model: modelUsed, error: 'No se está usando Qwen' };
      }
    } else {
      console.log(`${colors.red}❌ Error: ${response.status}${colors.reset}`);
      return { success: false, error: `Status ${response.status}` };
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error de conexión: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function testGroqDeepSeek() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}🟣 PROBANDO GROQ (DEEPSEEK R1)${colors.reset}`);
  console.log('='.repeat(70));

  try {
    const testMessage = 'Hola, responde solo con "OK" si me escuchas';
    console.log(`\n📤 Enviando a: ${PRODUCTION_URL}/api/sandra/chat`);
    console.log(`   Mensaje: "${testMessage}"`);

    const response = await makeRequest(`${PRODUCTION_URL}/api/sandra/chat`, {
      method: 'POST',
      body: {
        message: testMessage,
        role: 'hospitality'
      }
    });

    if (response.status === 200) {
      const modelUsed = response.data.model || 'unknown';
      const isDeepSeek = modelUsed.includes('deepseek');
      
      if (isDeepSeek) {
        console.log(`${colors.green}✅ GROQ (DEEPSEEK) FUNCIONANDO${colors.reset}`);
        console.log(`   Modelo usado: ${modelUsed}`);
        console.log(`   Respuesta: "${response.data.reply.substring(0, 100)}..."`);
        return { success: true, model: modelUsed, response: response.data.reply };
      } else {
        console.log(`${colors.yellow}⚠️  NO SE ESTÁ USANDO DEEPSEEK${colors.reset}`);
        console.log(`   Modelo usado: ${modelUsed}`);
        return { success: false, model: modelUsed, error: 'No se está usando DeepSeek' };
      }
    } else {
      console.log(`${colors.red}❌ Error: ${response.status}${colors.reset}`);
      return { success: false, error: `Status ${response.status}` };
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error de conexión: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function testGemini() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.yellow}🟢 PROBANDO GEMINI 2.5-FLASH-LITE${colors.reset}`);
  console.log('='.repeat(70));

  try {
    const testMessage = 'Hola, responde solo con "OK" si me escuchas';
    console.log(`\n📤 Enviando a: ${PRODUCTION_URL}/api/sandra/chat`);
    console.log(`   Mensaje: "${testMessage}"`);

    const response = await makeRequest(`${PRODUCTION_URL}/api/sandra/chat`, {
      method: 'POST',
      body: {
        message: testMessage,
        role: 'hospitality'
      }
    });

    if (response.status === 200) {
      const modelUsed = response.data.model || 'unknown';
      const isGemini = modelUsed.includes('gemini');
      
      if (isGemini) {
        console.log(`${colors.green}✅ GEMINI FUNCIONANDO${colors.reset}`);
        console.log(`   Modelo usado: ${modelUsed}`);
        console.log(`   Respuesta: "${response.data.reply.substring(0, 100)}..."`);
        return { success: true, model: modelUsed, response: response.data.reply };
      } else {
        console.log(`${colors.yellow}⚠️  NO SE ESTÁ USANDO GEMINI${colors.reset}`);
        console.log(`   Modelo usado: ${modelUsed}`);
        return { success: false, model: modelUsed, error: 'No se está usando Gemini' };
      }
    } else {
      console.log(`${colors.red}❌ Error: ${response.status}${colors.reset}`);
      return { success: false, error: `Status ${response.status}` };
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error de conexión: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function testAssistantWithModels() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.blue}🤖 PROBANDO ASSISTANT (SANDRA-LIVE)${colors.reset}`);
  console.log('='.repeat(70));

  try {
    const testMessage = 'Hola Sandra, busco un apartamento en Valencia';
    console.log(`\n📤 Enviando a: ${PRODUCTION_URL}/api/sandra/assistant`);
    console.log(`   Mensaje: "${testMessage}"`);

    const response = await makeRequest(`${PRODUCTION_URL}/api/sandra/assistant`, {
      method: 'POST',
      body: {
        transcription: testMessage,
        messages: [],
        generateAudio: false
      }
    });

    if (response.status === 200) {
      const modelUsed = response.data.model || 'unknown';
      console.log(`${colors.green}✅ ASSISTANT FUNCIONANDO${colors.reset}`);
      console.log(`   Modelo usado: ${modelUsed}`);
      console.log(`   Respuesta: "${response.data.reply.substring(0, 100)}..."`);
      
      if (response.data.action) {
        console.log(`   🔧 Acción: ${response.data.action}`);
      }
      
      return { success: true, model: modelUsed, response: response.data.reply };
    } else {
      console.log(`${colors.red}❌ Error: ${response.status}${colors.reset}`);
      console.log(`   Respuesta: ${response.raw.substring(0, 200)}`);
      return { success: false, error: `Status ${response.status}` };
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error de conexión: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}🔍 VERIFICACIÓN COMPLETA DE TODAS LAS APIs DE IA${colors.reset}`);
  console.log('='.repeat(70));
  console.log(`\n🌐 URL Base: ${PRODUCTION_URL}`);
  console.log(`📅 Fecha: ${new Date().toISOString()}\n`);

  const results = {
    openai: null,
    groqQwen: null,
    groqDeepSeek: null,
    gemini: null,
    assistant: null
  };

  // Probar cada modelo
  results.openai = await testOpenAI();
  results.gemini = await testGemini();
  results.groqQwen = await testGroqQwen();
  results.groqDeepSeek = await testGroqDeepSeek();
  results.assistant = await testAssistantWithModels();

  // Resumen final
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}📊 RESUMEN COMPLETO DE PRUEBAS${colors.reset}`);
  console.log('='.repeat(70));

  console.log(`\n🔵 OpenAI (GPT-4o):        ${results.openai.success ? colors.green + '✅ FUNCIONANDO' : colors.red + '❌ NO FUNCIONA'}${colors.reset}`);
  if (results.openai.success) {
    console.log(`   Modelo detectado: ${results.openai.model}`);
  } else {
    console.log(`   ${colors.yellow}⚠️  Verifica OPENAI_API_KEY en Vercel${colors.reset}`);
  }

  console.log(`\n🟣 Groq (Qwen 2.5):        ${results.groqQwen.success ? colors.green + '✅ FUNCIONANDO' : colors.yellow + '⚠️  NO EN USO'}${colors.reset}`);
  if (results.groqQwen.success) {
    console.log(`   Modelo detectado: ${results.groqQwen.model}`);
  } else {
    console.log(`   ${colors.yellow}⚠️  Verifica GROQ_API_KEY en Vercel${colors.reset}`);
  }

  console.log(`\n🟣 Groq (DeepSeek R1):     ${results.groqDeepSeek.success ? colors.green + '✅ FUNCIONANDO' : colors.yellow + '⚠️  NO EN USO'}${colors.reset}`);
  if (results.groqDeepSeek.success) {
    console.log(`   Modelo detectado: ${results.groqDeepSeek.model}`);
  }

  console.log(`\n🟢 Gemini 2.5-flash-lite:  ${results.gemini.success ? colors.green + '✅ FUNCIONANDO' : colors.red + '❌ NO FUNCIONA'}${colors.reset}`);
  if (results.gemini.success) {
    console.log(`   Modelo detectado: ${results.gemini.model}`);
  } else {
    console.log(`   ${colors.yellow}⚠️  Verifica GEMINI_API_KEY en Vercel${colors.reset}`);
  }

  console.log(`\n🤖 Assistant (Sandra-Live): ${results.assistant.success ? colors.green + '✅ FUNCIONANDO' : colors.red + '❌ NO FUNCIONA'}${colors.reset}`);
  if (results.assistant.success) {
    console.log(`   Modelo detectado: ${results.assistant.model}`);
  }

  // Determinar modelo actual en producción
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}📋 ESTADO ACTUAL EN PRODUCCIÓN${colors.reset}`);
  console.log('='.repeat(70));
  
  if (results.openai.success && results.openai.model.includes('gpt-4o')) {
    console.log(`\n${colors.green}✅ PRODUCCIÓN ESTÁ USANDO: GPT-4o (Correcto)${colors.reset}`);
  } else if (results.groqQwen.success) {
    console.log(`\n${colors.yellow}⚠️  PRODUCCIÓN ESTÁ USANDO: Groq (Qwen) - Fallback${colors.reset}`);
    console.log(`   ${colors.yellow}⚠️  Configura OPENAI_API_KEY para usar GPT-4o${colors.reset}`);
  } else if (results.gemini.success) {
    console.log(`\n${colors.yellow}⚠️  PRODUCCIÓN ESTÁ USANDO: Gemini (Último recurso)${colors.reset}`);
    console.log(`   ${colors.yellow}⚠️  Configura OPENAI_API_KEY y/o GROQ_API_KEY${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ NO SE PUEDE DETERMINAR EL MODELO EN USO${colors.reset}`);
  }

  console.log('\n');
  process.exit(0);
}

main().catch(error => {
  console.error(`\n${colors.red}❌ Error fatal: ${error}${colors.reset}`);
  process.exit(1);
});

