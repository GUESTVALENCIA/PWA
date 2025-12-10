#!/usr/bin/env node
/**
 * Script para Verificar Conexiones de Sandra (Chat y Llamada)
 * Prueba que los endpoints funcionen correctamente
 */

const https = require('https');

const PRODUCTION_URL = 'https://pwa-chi-six.vercel.app';
const LOCAL_URL = 'http://localhost:4040';

// Determinar URL base
const BASE_URL = process.env.TEST_URL || PRODUCTION_URL;

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
          resolve({ status: res.statusCode, data: json, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, raw: body });
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

async function testChatConnection() {
  console.log('\n📝 PROBANDO CONEXIÓN DE CHAT...');
  console.log('='.repeat(60));

  try {
    const testMessage = 'Hola Sandra, ¿estás ahí?';
    console.log(`\n📤 Enviando mensaje: "${testMessage}"`);
    console.log(`   Endpoint: ${BASE_URL}/api/sandra/chat`);

    const response = await makeRequest(`${BASE_URL}/api/sandra/chat`, {
      method: 'POST',
      body: {
        message: testMessage,
        role: 'hospitality'
      }
    });

    if (response.status === 200) {
      console.log('✅ Chat conectado correctamente');
      console.log(`   Estado: ${response.status}`);
      
      if (response.data && response.data.reply) {
        console.log(`   Respuesta: "${response.data.reply.substring(0, 100)}..."`);
        return { success: true, response: response.data.reply };
      } else {
        console.log('⚠️  Respuesta recibida pero sin campo "reply"');
        console.log('   Data:', JSON.stringify(response.data).substring(0, 200));
        return { success: false, error: 'Respuesta sin campo reply' };
      }
    } else {
      console.log(`❌ Error en chat: Estado ${response.status}`);
      console.log('   Respuesta:', response.raw.substring(0, 200));
      return { success: false, error: `Status ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ Error de conexión en chat: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAssistantConnection() {
  console.log('\n🤖 PROBANDO CONEXIÓN DE ASSISTANT (Sandra-Live)...');
  console.log('='.repeat(60));

  try {
    const testMessage = 'Hola Sandra, busco un apartamento en Valencia';
    console.log(`\n📤 Enviando mensaje: "${testMessage}"`);
    console.log(`   Endpoint: ${BASE_URL}/api/sandra/assistant`);

    const response = await makeRequest(`${BASE_URL}/api/sandra/assistant`, {
      method: 'POST',
      body: {
        transcription: testMessage,
        messages: [],
        generateAudio: false
      }
    });

    if (response.status === 200) {
      console.log('✅ Assistant conectado correctamente');
      console.log(`   Estado: ${response.status}`);
      
      if (response.data && response.data.reply) {
        console.log(`   Respuesta: "${response.data.reply.substring(0, 100)}..."`);
        
        if (response.data.action) {
          console.log(`   🔧 Acción invocada: ${response.data.action}`);
          console.log(`   📋 Parámetros:`, JSON.stringify(response.data.params));
        }
        
        return { success: true, response: response.data.reply, action: response.data.action };
      } else {
        console.log('⚠️  Respuesta recibida pero sin campo "reply"');
        console.log('   Data:', JSON.stringify(response.data).substring(0, 200));
        return { success: false, error: 'Respuesta sin campo reply' };
      }
    } else {
      console.log(`❌ Error en assistant: Estado ${response.status}`);
      console.log('   Respuesta:', response.raw.substring(0, 200));
      return { success: false, error: `Status ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ Error de conexión en assistant: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testConfigEndpoint() {
  console.log('\n⚙️  PROBANDO ENDPOINT DE CONFIGURACIÓN...');
  console.log('='.repeat(60));

  try {
    const response = await makeRequest(`${BASE_URL}/api/config`);

    if (response.status === 200) {
      console.log('✅ Config endpoint funcionando');
      console.log('   Configuración:', JSON.stringify(response.data));
      return { success: true, config: response.data };
    } else {
      console.log(`❌ Error en config: Estado ${response.status}`);
      return { success: false, error: `Status ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ Error de conexión en config: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🔍 VERIFICACIÓN DE CONEXIONES DE SANDRA');
  console.log('='.repeat(60));
  console.log(`\n🌐 URL Base: ${BASE_URL}`);
  console.log(`📅 Fecha: ${new Date().toISOString()}\n`);

  const results = {
    config: null,
    chat: null,
    assistant: null
  };

  // 1. Probar config
  results.config = await testConfigEndpoint();

  // 2. Probar chat
  results.chat = await testChatConnection();

  // 3. Probar assistant (Sandra-Live)
  results.assistant = await testAssistantConnection();

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));

  console.log(`\n⚙️  Config Endpoint:     ${results.config.success ? '✅ OK' : '❌ FALLO'}`);
  console.log(`📝 Chat Connection:      ${results.chat.success ? '✅ OK' : '❌ FALLO'}`);
  console.log(`🤖 Assistant Connection: ${results.assistant.success ? '✅ OK' : '❌ FALLO'}`);

  const allOk = results.chat.success && results.assistant.success;

  if (allOk) {
    console.log('\n🎉 ¡TODAS LAS CONEXIONES FUNCIONAN CORRECTAMENTE!');
    console.log('\n✅ Sandra está lista para usar en:');
    console.log('   - Chat de texto');
    console.log('   - Llamadas conversacionales');
    console.log('   - Function calling (Sandra-Live)');
    
    if (results.assistant.action) {
      console.log('\n🔧 Function Calling activo: La IA puede invocar acciones automáticamente');
    }
  } else {
    console.log('\n⚠️  ALGUNAS CONEXIONES FALLARON');
    if (!results.chat.success) {
      console.log('   ❌ Chat no responde correctamente');
    }
    if (!results.assistant.success) {
      console.log('   ❌ Assistant no responde correctamente');
    }
    console.log('\n💡 Verifica:');
    console.log('   1. Que el deploy en Vercel esté completado');
    console.log('   2. Que las variables de entorno estén configuradas');
    console.log('   3. Que los endpoints estén correctamente configurados en vercel.json');
  }

  console.log('\n');
  process.exit(allOk ? 0 : 1);
}

main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

