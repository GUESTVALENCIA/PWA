/**
 * 🧪 TEST: Verificar que el modelo OpenAI GPT-4o-mini responde en Render
 * 
 * Este script se conecta al servidor en Render y verifica que:
 * 1. El servidor está activo
 * 2. El modelo GPT-4o-mini responde correctamente
 * 3. La latencia es aceptable
 */

const RENDER_URL = process.env.MCP_SERVER_URL || 'https://pwa-imbf.onrender.com';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testModeloRender() {
  console.log(`${colors.cyan}🧪 TEST: Verificando modelo OpenAI GPT-4o-mini en Render${colors.reset}\n`);
  console.log(`${colors.blue}🌐 Servidor: ${RENDER_URL}${colors.reset}\n`);

  // 1. Verificar que el servidor está activo
  console.log(`${colors.blue}1️⃣ Verificando que el servidor está activo...${colors.reset}`);
  
  try {
    const healthResponse = await fetch(`${RENDER_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (healthResponse.ok) {
      console.log(`${colors.green}✅ Servidor activo${colors.reset}\n`);
    } else {
      console.log(`${colors.yellow}⚠️  Servidor responde pero con código ${healthResponse.status}${colors.reset}\n`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error conectando al servidor: ${error.message}${colors.reset}`);
    console.error(`${colors.yellow}💡 Verifica que el servidor esté desplegado en Render${colors.reset}\n`);
    process.exit(1);
  }

  // 2. Test del modelo usando WebSocket (simulando llamada conversacional)
  console.log(`${colors.blue}2️⃣ Probando modelo GPT-4o-mini con mensaje de prueba...${colors.reset}\n`);

  const testMessage = 'Hola, ¿qué tal?';
  console.log(`${colors.blue}📤 Mensaje de prueba: "${testMessage}"${colors.reset}`);
  console.log(`${colors.blue}🤖 Modelo esperado: GPT-4o-mini${colors.reset}\n`);

  return new Promise((resolve, reject) => {
    const wsUrl = RENDER_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/`);

    let responseReceived = false;
    const startTime = Date.now();

    ws.on('open', () => {
      console.log(`${colors.green}✅ WebSocket conectado${colors.reset}`);
      
      // Enviar mensaje de prueba
      ws.send(JSON.stringify({
        route: 'audio',
        action: 'stt',
        payload: {
          audio: Buffer.from('test').toString('base64'), // Audio dummy para inicializar
          format: 'linear16',
          encoding: 'linear16',
          sampleRate: 48000,
          channels: 1
        }
      }));

      // Simular transcripción finalizada
      setTimeout(() => {
        // Enviar transcripción simulada
        ws.send(JSON.stringify({
          route: 'conserje',
          action: 'transcription',
          payload: {
            text: testMessage,
            final: true
          }
        }));
      }, 1000);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Buscar respuesta del modelo
        if (message.route === 'audio' && message.action === 'tts') {
          const endTime = Date.now();
          const latency = endTime - startTime;
          
          responseReceived = true;
          
          console.log(`${colors.green}✅ RESPUESTA DEL MODELO RECIBIDA${colors.reset}`);
          console.log(`${colors.cyan}⏱️  Latencia total: ${latency}ms${colors.reset}`);
          console.log(`${colors.cyan}📝 Respuesta recibida (audio TTS generado)${colors.reset}\n`);

          // Evaluar latencia
          if (latency < 2000) {
            console.log(`${colors.green}✅ Latencia EXCELENTE (< 2s) - Perfecto para llamadas conversacionales${colors.reset}`);
          } else if (latency < 3000) {
            console.log(`${colors.yellow}⚠️  Latencia BUENA (< 3s) - Aceptable para llamadas conversacionales${colors.reset}`);
          } else if (latency < 5000) {
            console.log(`${colors.yellow}⚠️  Latencia REGULAR (< 5s) - Funcional pero mejorable${colors.reset}`);
          } else {
            console.log(`${colors.red}❌ Latencia ALTA (> 5s) - Puede afectar la experiencia${colors.reset}`);
          }

          console.log(`\n${colors.green}🎉 TEST COMPLETADO EXITOSAMENTE${colors.reset}`);
          console.log(`${colors.cyan}✅ El modelo GPT-4o-mini está respondiendo correctamente${colors.reset}`);
          console.log(`${colors.cyan}✅ Listo para llamadas conversacionales${colors.reset}\n`);

          ws.close();
          resolve(true);
        }
      } catch (error) {
        // Ignorar errores de parsing, seguir esperando
      }
    });

    ws.on('error', (error) => {
      console.error(`${colors.red}❌ Error en WebSocket: ${error.message}${colors.reset}`);
      reject(error);
    });

    ws.on('close', () => {
      if (!responseReceived) {
        console.error(`${colors.red}❌ Conexión cerrada sin respuesta del modelo${colors.reset}`);
        console.error(`${colors.yellow}💡 Verifica:${colors.reset}`);
        console.error(`${colors.yellow}   1. El servidor está desplegado en Render${colors.reset}`);
        console.error(`${colors.yellow}   2. OPENAI_API_KEY está configurada en Render${colors.reset}`);
        console.error(`${colors.yellow}   3. El modelo GPT-4o-mini está disponible${colors.reset}\n`);
        reject(new Error('No response received'));
      }
    });

    // Timeout después de 10 segundos
    setTimeout(() => {
      if (!responseReceived) {
        ws.close();
        console.error(`${colors.red}❌ Timeout: No se recibió respuesta en 10 segundos${colors.reset}`);
        reject(new Error('Timeout'));
      }
    }, 10000);
  });
}

// Ejecutar test
if (typeof WebSocket === 'undefined') {
  console.error(`${colors.red}❌ WebSocket no disponible en este entorno${colors.reset}`);
  console.error(`${colors.yellow}💡 Este test debe ejecutarse en Node.js con ws package o en el navegador${colors.reset}`);
  process.exit(1);
}

testModeloRender().catch(error => {
  console.error(`${colors.red}❌ Error fatal:${colors.reset}`, error.message);
  process.exit(1);
});
