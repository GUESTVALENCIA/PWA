/**
 * Test script para verificar el endpoint de chat
 * Ejecutar: node test-chat-endpoint.js
 */

const https = require('https');

const PRODUCTION_URL = 'https://pwa-chi-six.vercel.app';

async function testChatEndpoint() {
  console.log('\n🔍 Probando endpoint de chat...\n');
  
  const testMessage = {
    message: 'Hola, ¿cómo estás?',
    role: 'hospitality'
  };
  
  const url = `${PRODUCTION_URL}/api/sandra/chat`;
  
  console.log(`📤 Enviando POST a: ${url}`);
  console.log(`📝 Mensaje: ${testMessage.message}`);
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testMessage);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const urlObj = new URL(url);
    options.hostname = urlObj.hostname;
    options.path = urlObj.pathname + (urlObj.search || '');
    options.port = urlObj.port || 443;
    
    const req = https.request(options, (res) => {
      let data = '';
      
      console.log(`\n📥 Respuesta recibida:`);
      console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`   Headers:`, res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`\n✅ Respuesta JSON:`, JSON.stringify(json, null, 2));
          
          if (json.reply) {
            console.log(`\n✅ Chat funciona correctamente!`);
            console.log(`   Reply: ${json.reply.substring(0, 100)}...`);
            console.log(`   Model: ${json.model || 'unknown'}`);
          } else if (json.error) {
            console.log(`\n❌ Error en respuesta:`, json.error);
          } else {
            console.log(`\n⚠️ Respuesta inesperada:`, json);
          }
        } catch (e) {
          console.log(`\n❌ Error parseando JSON:`, e.message);
          console.log(`   Raw response:`, data.substring(0, 200));
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error(`\n❌ Error en request:`, error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

testChatEndpoint().catch(console.error);

