#!/usr/bin/env node
/**
 * Script para Probar DIRECTAMENTE cada API con sus credenciales
 * Esto verifica si las APIs están realmente disponibles y funcionando
 */

const https = require('https');

// Colores
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
        resolve({ 
          status: res.statusCode, 
          headers: res.headers,
          body: body,
          ok: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testOpenAIDirect() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.blue}🔵 PROBANDO OPENAI (GPT-4o) DIRECTAMENTE${colors.reset}`);
  console.log('='.repeat(70));

  // Esta función necesita que las variables estén en el servidor
  // Vamos a probar a través del endpoint de producción
  console.log(`\n📤 Probando a través del endpoint de producción...`);
  console.log(`   Esto verifica si OPENAI_API_KEY está configurada en Vercel\n`);

  try {
    const response = await makeRequest('https://pwa-chi-six.vercel.app/api/sandra/chat', {
      method: 'POST',
      body: {
        message: 'Responde solo: OK',
        role: 'hospitality'
      }
    });

    let data;
    try {
      data = JSON.parse(response.body);
    } catch (e) {
      console.log(`${colors.red}❌ Error parseando respuesta: ${response.body.substring(0, 200)}${colors.reset}`);
      return { success: false, error: 'Invalid JSON response' };
    }

    console.log(`   Estado HTTP: ${response.status}`);
    console.log(`   Modelo usado: ${data.model || 'unknown'}`);
    
    if (data.model && (data.model.includes('gpt-4o') || data.model.includes('gpt-4'))) {
      console.log(`${colors.green}✅ GPT-4o ESTÁ FUNCIONANDO${colors.reset}`);
      console.log(`   Respuesta: "${data.reply?.substring(0, 80)}..."`);
      return { success: true, model: data.model, working: true };
    } else if (data.model && data.model.includes('gemini')) {
      console.log(`${colors.yellow}⚠️  OPENAI_API_KEY NO ESTÁ CONFIGURADA O NO ES VÁLIDA${colors.reset}`);
      console.log(`   El sistema está usando Gemini como fallback`);
      return { success: false, model: data.model, working: false, reason: 'OPENAI_API_KEY no configurada o inválida' };
    } else if (data.model && data.model.includes('qwen')) {
      console.log(`${colors.yellow}⚠️  OPENAI_API_KEY NO ESTÁ CONFIGURADA${colors.reset}`);
      console.log(`   El sistema está usando Groq (Qwen) como fallback`);
      return { success: false, model: data.model, working: false, reason: 'OPENAI_API_KEY no configurada, usando Groq' };
    } else {
      console.log(`${colors.red}❌ NO SE PUEDE DETERMINAR EL MODELO${colors.reset}`);
      return { success: false, model: data.model || 'unknown', working: false, reason: 'Modelo desconocido' };
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function testGroqDirect() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}🟣 PROBANDO GROQ (QWEN/DEEPSEEK) DIRECTAMENTE${colors.reset}`);
  console.log('='.repeat(70));

  console.log(`\n📤 Probando a través del endpoint de producción...`);
  console.log(`   Esto verifica si GROQ_API_KEY está configurada en Vercel\n`);

  try {
    // Hacer múltiples requests para ver si alguna vez usa Groq
    let foundGroq = false;
    let lastModel = null;

    for (let i = 0; i < 3; i++) {
      const response = await makeRequest('https://pwa-chi-six.vercel.app/api/sandra/chat', {
        method: 'POST',
        body: {
          message: `Test ${i + 1}: Responde solo OK`,
          role: 'hospitality'
        }
      });

      let data;
      try {
        data = JSON.parse(response.body);
      } catch (e) {
        continue;
      }

      lastModel = data.model || lastModel;

      if (data.model && (data.model.includes('qwen') || data.model.includes('deepseek'))) {
        foundGroq = true;
        console.log(`${colors.green}✅ GROQ ESTÁ FUNCIONANDO${colors.reset}`);
        console.log(`   Modelo usado: ${data.model}`);
        console.log(`   Respuesta: "${data.reply?.substring(0, 80)}..."`);
        return { success: true, model: data.model, working: true };
      }
    }

    if (!foundGroq) {
      console.log(`${colors.yellow}⚠️  GROQ_API_KEY NO ESTÁ CONFIGURADA O NO SE ESTÁ USANDO${colors.reset}`);
      console.log(`   Último modelo detectado: ${lastModel || 'unknown'}`);
      return { success: false, model: lastModel, working: false, reason: 'GROQ_API_KEY no configurada o no se está usando' };
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function testGeminiDirect() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.yellow}🟢 PROBANDO GEMINI DIRECTAMENTE${colors.reset}`);
  console.log('='.repeat(70));

  try {
    const response = await makeRequest('https://pwa-chi-six.vercel.app/api/sandra/chat', {
      method: 'POST',
      body: {
        message: 'Responde solo: OK',
        role: 'hospitality'
      }
    });

    let data;
    try {
      data = JSON.parse(response.body);
    } catch (e) {
      return { success: false, error: 'Invalid JSON response' };
    }

    if (data.model && data.model.includes('gemini')) {
      console.log(`${colors.green}✅ GEMINI ESTÁ FUNCIONANDO${colors.reset}`);
      console.log(`   Modelo: ${data.model}`);
      console.log(`   Respuesta: "${data.reply?.substring(0, 80)}..."`);
      return { success: true, model: data.model, working: true };
    } else {
      console.log(`${colors.yellow}⚠️  GEMINI NO SE ESTÁ USANDO${colors.reset}`);
      console.log(`   Modelo actual: ${data.model || 'unknown'}`);
      return { success: false, model: data.model, working: false };
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}🔍 VERIFICACIÓN DIRECTA DE TODAS LAS APIs${colors.reset}`);
  console.log('='.repeat(70));
  console.log(`\n📅 Fecha: ${new Date().toISOString()}`);
  console.log(`🌐 URL: https://pwa-chi-six.vercel.app\n`);

  const results = {
    openai: null,
    groq: null,
    gemini: null
  };

  results.openai = await testOpenAIDirect();
  results.groq = await testGroqDirect();
  results.gemini = await testGeminiDirect();

  // Resumen final
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}📊 RESUMEN FINAL${colors.reset}`);
  console.log('='.repeat(70));

  console.log(`\n${colors.blue}🔵 OpenAI (GPT-4o):${colors.reset}`);
  if (results.openai?.working) {
    console.log(`   ${colors.green}✅ FUNCIONANDO - Modelo: ${results.openai.model}${colors.reset}`);
  } else {
    console.log(`   ${colors.red}❌ NO FUNCIONANDO${colors.reset}`);
    console.log(`   ${colors.yellow}   Razón: ${results.openai?.reason || 'Desconocido'}${colors.reset}`);
    console.log(`   ${colors.yellow}   Acción: Configura OPENAI_API_KEY en Vercel${colors.reset}`);
  }

  console.log(`\n${colors.cyan}🟣 Groq (Qwen/DeepSeek):${colors.reset}`);
  if (results.groq?.working) {
    console.log(`   ${colors.green}✅ FUNCIONANDO - Modelo: ${results.groq.model}${colors.reset}`);
  } else {
    console.log(`   ${colors.yellow}⚠️  NO SE ESTÁ USANDO${colors.reset}`);
    console.log(`   ${colors.yellow}   Razón: ${results.groq?.reason || 'Desconocido'}${colors.reset}`);
    console.log(`   ${colors.yellow}   Acción: Configura GROQ_API_KEY en Vercel${colors.reset}`);
  }

  console.log(`\n${colors.yellow}🟢 Gemini:${colors.reset}`);
  if (results.gemini?.working) {
    console.log(`   ${colors.green}✅ FUNCIONANDO - Modelo: ${results.gemini.model}${colors.reset}`);
  } else {
    console.log(`   ${colors.red}❌ NO FUNCIONANDO${colors.reset}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}💡 RECOMENDACIONES${colors.reset}`);
  console.log('='.repeat(70));

  if (!results.openai?.working) {
    console.log(`\n${colors.yellow}1. CONFIGURA OPENAI_API_KEY EN VERCEL:${colors.reset}`);
    console.log(`   - Ve a Vercel Dashboard > Tu Proyecto > Settings > Environment Variables`);
    console.log(`   - Agrega: OPENAI_API_KEY = sk-... (tu key de OpenAI)`);
    console.log(`   - Selecciona: Production, Preview, Development`);
    console.log(`   - Haz un nuevo deploy después de agregar la variable`);
  }

  if (!results.groq?.working && results.openai?.working) {
    console.log(`\n${colors.yellow}2. OPCIONAL - CONFIGURA GROQ_API_KEY PARA FALLBACK:${colors.reset}`);
    console.log(`   - Ve a Vercel Dashboard > Tu Proyecto > Settings > Environment Variables`);
    console.log(`   - Agrega: GROQ_API_KEY = gsk_... (tu key de Groq)`);
    console.log(`   - Esto servirá como fallback si OpenAI falla`);
  }

  if (results.gemini?.working && !results.openai?.working) {
    console.log(`\n${colors.red}⚠️  ACTUALMENTE ESTÁS USANDO GEMINI COMO ÚLTIMO RECURSO${colors.reset}`);
    console.log(`   ${colors.yellow}Para producción, deberías usar GPT-4o${colors.reset}`);
  }

  console.log('\n');
}

main().catch(error => {
  console.error(`\n${colors.red}❌ Error fatal: ${error}${colors.reset}`);
  process.exit(1);
});

