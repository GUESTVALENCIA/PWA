#!/usr/bin/env node

/**
 * Test de conexión con Groq API
 * Verificar que Groq responde correctamente antes de continuar
 */

import https from 'https';

const GROQ_API_KEY = process.env.GROQ_API_KEY || 'gsk_test_key';

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║           🧪 TEST DE CONEXIÓN CON GROQ API                   ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

function makeGroqRequest(message, systemPrompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'qwen2.5-72b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
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
    req.write(payload);
    req.end();
  });
}

async function testGroqConnection() {
  console.log('📡 Probando conexión con Groq API...\n');
  
  if (!GROQ_API_KEY || GROQ_API_KEY === 'gsk_test_key') {
    console.log('❌ GROQ_API_KEY no configurada');
    console.log('   Configura la variable de entorno GROQ_API_KEY\n');
    process.exit(1);
  }

  console.log(`🔑 API Key: ${GROQ_API_KEY.substring(0, 10)}...${GROQ_API_KEY.substring(GROQ_API_KEY.length - 4)}\n`);

  const testMessage = 'Responde con solo: OK';
  const systemPrompt = 'Responde brevemente.';

  try {
    const response = await makeGroqRequest(testMessage, systemPrompt);

    if (response.status === 200) {
      const content = response.data?.choices?.[0]?.message?.content || 'No content';
      console.log('✅ Groq API responde correctamente');
      console.log(`📝 Respuesta: "${content}"\n`);
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║                    ✅ GROQ FUNCIONA                           ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝\n');
      return true;
    } else {
      console.log(`❌ Error en Groq API: Status ${response.status}`);
      console.log('Respuesta:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`❌ Error de conexión: ${error.message}`);
    return false;
  }
}

testGroqConnection().then(success => {
  process.exit(success ? 0 : 1);
});
