/**
 * Script de prueba para diagnosticar problemas del chat
 * Ejecutar: node test-chat-api.js
 */

const fetch = require('node-fetch');

const PRODUCTION_URL = 'https://pwa-chi-six.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

async function testChatAPI(baseUrl) {
  console.log(`\n🔍 Probando chat API en: ${baseUrl}\n`);
  
  const testCases = [
    {
      name: 'Test 1: /api/sandra/chat',
      url: `${baseUrl}/api/sandra/chat`,
      body: {
        message: 'Hola, ¿cómo estás?',
        role: 'hospitality'
      }
    },
    {
      name: 'Test 2: /api/sandra/assistant',
      url: `${baseUrl}/api/sandra/assistant`,
      body: {
        transcription: 'Hola, ¿cómo estás?',
        messages: [],
        generateAudio: false
      }
    },
    {
      name: 'Test 3: /api/config',
      url: `${baseUrl}/api/config`,
      body: null,
      method: 'GET'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    
    try {
      const options = {
        method: testCase.method || 'POST',
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (testCase.body) {
        options.body = JSON.stringify(testCase.body);
      }
      
      const response = await fetch(testCase.url, options);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   OK: ${response.ok}`);
      
      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
        console.log(`   ✅ JSON válido`);
        console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
        
        if (testCase.name.includes('chat') && data.reply) {
          console.log(`   Reply: ${data.reply.substring(0, 100)}...`);
          console.log(`   Model: ${data.model || 'unknown'}`);
        } else if (testCase.name.includes('assistant')) {
          console.log(`   Reply: ${(data.reply || data.text || '').substring(0, 100)}...`);
          console.log(`   Model: ${data.model || data.usedModel || 'unknown'}`);
        } else if (testCase.name.includes('config')) {
          console.log(`   MCP_SERVER_URL: ${data.MCP_SERVER_URL || 'N/A'}`);
          console.log(`   Has Token: ${!!data.MCP_TOKEN}`);
        }
      } catch (parseError) {
        console.log(`   ❌ Error parseando JSON:`);
        console.log(`   ${text.substring(0, 200)}...`);
      }
      
      if (!response.ok) {
        console.log(`   ⚠️ RESPUESTA NO OK - Posible error`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error en request:`, error.message);
    }
  }
}

// Ejecutar pruebas
async function runTests() {
  console.log('🚀 INICIANDO PRUEBAS DE CHAT API\n');
  console.log('='.repeat(60));
  
  // Probar producción
  await testChatAPI(PRODUCTION_URL);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Pruebas completadas\n');
}

runTests().catch(console.error);

