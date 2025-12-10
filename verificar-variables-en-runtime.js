#!/usr/bin/env node
/**
 * Script para verificar qué variables están disponibles EN RUNTIME
 * A través de un endpoint de diagnóstico
 */

const https = require('https');

const PRODUCTION_URL = 'https://pwa-chi-six.vercel.app';

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
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('\n🔍 VERIFICANDO VARIABLES EN RUNTIME...\n');
  console.log('⚠️  IMPORTANTE: Si las variables están configuradas pero no se usan,');
  console.log('   puede ser que Vercel necesite un nuevo deploy para cargarlas.\n');

  // Intentar hacer una llamada que muestre logs
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/sandra/chat`, {
      method: 'POST',
      body: {
        message: 'test',
        role: 'hospitality'
      }
    });

    console.log('Respuesta del endpoint:');
    console.log('- Estado:', response.status);
    console.log('- Modelo usado:', response.data.model || 'unknown');
    
    if (response.data.model && response.data.model.includes('gemini')) {
      console.log('\n⚠️  PROBLEMA DETECTADO:');
      console.log('   El sistema está usando Gemini, lo que significa que:');
      console.log('   1. OPENAI_API_KEY no está disponible en runtime, O');
      console.log('   2. OPENAI_API_KEY falló al hacer la llamada, O');
      console.log('   3. Necesitas hacer un nuevo deploy en Vercel');
      console.log('\n💡 SOLUCIÓN:');
      console.log('   1. Ve a Vercel Dashboard > Deployments');
      console.log('   2. Haz clic en "Redeploy" en el último deployment');
      console.log('   3. Esto cargará las variables de entorno que configuraste');
    } else if (response.data.model && (response.data.model.includes('gpt-4o') || response.data.model.includes('gpt-4'))) {
      console.log('\n✅ GPT-4o está funcionando correctamente!');
    } else if (response.data.model && response.data.model.includes('qwen')) {
      console.log('\n⚠️  Está usando Groq (Qwen) como fallback');
      console.log('   Esto significa que OPENAI_API_KEY no está funcionando');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();

