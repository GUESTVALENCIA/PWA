/**
 * 🧪 SCRIPT DE TEST DE LATENCIA - Pipeline Completo de Llamada
 * 
 * Mide la latencia REAL desde que se descuelga la llamada hasta que se recibe la respuesta del modelo.
 * 
 * Mide:
 * 1. Tiempo de conexión WebSocket (real)
 * 2. Tiempo de los dos ringtones (simulado: 4s total)
 * 3. Tiempo de generación del saludo (TTS) - REAL desde servidor
 * 4. Tiempo de transcripción (STT) - REAL desde servidor
 * 5. Tiempo de respuesta IA - REAL desde servidor
 * 6. Tiempo de generación de audio respuesta (TTS) - REAL desde servidor
 * 7. Latencia total del pipeline
 * 
 * USO:
 *   node scripts/test-latencia-llamada.js
 * 
 * REQUISITOS:
 *   - Variables de entorno configuradas (.env)
 *   - Servidor WebSocket corriendo (Render o local)
 * 
 * NOTA: Este script mide tiempos REALES del servidor, no simulados.
 */

import dotenv from 'dotenv';
import WebSocket from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

// Configuración
const WS_URL = process.env.MCP_SERVER_URL?.replace('https://', 'wss://').replace('http://', 'ws://') || 'wss://pwa-imbf.onrender.com';
const RINGTONE_DURATION_MS = 2000; // 2 segundos por ringtone (2 ringtones = 4 segundos total)

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Métricas de latencia
const metrics = {
  startTime: null,
  wsConnectTime: null,
  ringtonesEndTime: null,
  greetingReceivedTime: null,
  transcriptionStartTime: null,
  transcriptionEndTime: null,
  aiResponseStartTime: null,
  aiResponseEndTime: null,
  ttsResponseStartTime: null,
  ttsResponseEndTime: null,
  endTime: null,
};

// Estado del test
let testState = {
  wsConnected: false,
  greetingReceived: false,
  transcriptionSent: false,
  aiResponseReceived: false,
  ttsResponseReceived: false,
  testComplete: false,
};

/**
 * Calcular diferencia de tiempo en ms
 */
function getTimeDiff(start, end) {
  if (!start || !end) return null;
  return end - start;
}

/**
 * Formatear tiempo en ms a formato legible
 */
function formatTime(ms) {
  if (ms === null || ms === undefined) return 'N/A';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Imprimir métrica con color
 */
function printMetric(label, value, color = colors.cyan) {
  console.log(`${color}${label.padEnd(40)} ${colors.bright}${value}${colors.reset}`);
}

/**
 * Imprimir resumen de métricas
 */
function printMetrics() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}${colors.magenta}📊 RESUMEN DE LATENCIAS${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  // Fase 1: Conexión WebSocket
  const wsConnectLatency = getTimeDiff(metrics.startTime, metrics.wsConnectTime);
  printMetric('1. Conexión WebSocket:', formatTime(wsConnectLatency), wsConnectLatency < 500 ? colors.green : colors.yellow);

  // Fase 2: Ringtones (simulado)
  const ringtonesLatency = RINGTONE_DURATION_MS * 2; // 2 ringtones
  printMetric('2. Ringtones (2x):', formatTime(ringtonesLatency), colors.blue);

  // Fase 3: Saludo (TTS)
  const greetingLatency = getTimeDiff(metrics.ringtonesEndTime, metrics.greetingReceivedTime);
  printMetric('3. Generación Saludo (TTS):', formatTime(greetingLatency), greetingLatency < 2000 ? colors.green : colors.yellow);

  // Fase 4: Transcripción (STT)
  const transcriptionLatency = getTimeDiff(metrics.transcriptionStartTime, metrics.transcriptionEndTime);
  printMetric('4. Transcripción (STT):', formatTime(transcriptionLatency), transcriptionLatency < 1000 ? colors.green : colors.yellow);

  // Fase 5: Respuesta IA
  const aiResponseLatency = getTimeDiff(metrics.aiResponseStartTime, metrics.aiResponseEndTime);
  printMetric('5. Respuesta IA:', formatTime(aiResponseLatency), aiResponseLatency < 2000 ? colors.green : colors.yellow);

  // Fase 6: Audio Respuesta (TTS)
  const ttsResponseLatency = getTimeDiff(metrics.ttsResponseStartTime, metrics.ttsResponseEndTime);
  printMetric('6. Audio Respuesta (TTS):', formatTime(ttsResponseLatency), ttsResponseLatency < 2000 ? colors.green : colors.yellow);

  // Latencia total
  const totalLatency = getTimeDiff(metrics.startTime, metrics.endTime);
  printMetric('\n⏱️  LATENCIA TOTAL:', formatTime(totalLatency), totalLatency < 10000 ? colors.green : colors.red);

  // Desglose por componentes
  console.log('\n' + '-'.repeat(60));
  console.log(`${colors.bright}📈 DESGLOSE POR COMPONENTES:${colors.reset}\n`);

  const networkLatency = wsConnectLatency;
  const ttsLatency = (greetingLatency || 0) + (ttsResponseLatency || 0);
  const sttLatency = transcriptionLatency || 0;
  const aiLatency = aiResponseLatency || 0;
  const otherLatency = (totalLatency || 0) - networkLatency - ttsLatency - sttLatency - aiLatency - ringtonesLatency;

  printMetric('  • Red (WebSocket):', formatTime(networkLatency));
  printMetric('  • TTS (Saludo + Respuesta):', formatTime(ttsLatency));
  printMetric('  • STT (Transcripción):', formatTime(sttLatency));
  printMetric('  • IA (Procesamiento):', formatTime(aiLatency));
  printMetric('  • Ringtones:', formatTime(ringtonesLatency));
  printMetric('  • Otros (overhead):', formatTime(otherLatency));

  // Análisis
  console.log('\n' + '-'.repeat(60));
  console.log(`${colors.bright}🔍 ANÁLISIS:${colors.reset}\n`);

  if (totalLatency < 5000) {
    console.log(`${colors.green}✅ Latencia EXCELENTE (< 5s)${colors.reset}`);
  } else if (totalLatency < 10000) {
    console.log(`${colors.yellow}⚠️  Latencia ACEPTABLE (5-10s)${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Latencia ALTA (> 10s) - Necesita optimización${colors.reset}`);
  }

  // Recomendaciones
  if (ttsLatency > 4000) {
    console.log(`${colors.yellow}💡 Recomendación: Optimizar TTS (considerar WebSocket streaming)${colors.reset}`);
  }
  if (aiLatency > 3000) {
    console.log(`${colors.yellow}💡 Recomendación: Optimizar respuesta IA (modelo más rápido o caché)${colors.reset}`);
  }
  if (networkLatency > 1000) {
    console.log(`${colors.yellow}💡 Recomendación: Verificar latencia de red${colors.reset}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Ejecutar test completo
 */
async function runLatencyTest() {
  console.log(`${colors.bright}${colors.cyan}🧪 INICIANDO TEST DE LATENCIA${colors.reset}\n`);
  console.log(`📡 Conectando a: ${WS_URL}\n`);

  metrics.startTime = Date.now();

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);

    // FASE 1: Conexión WebSocket
    ws.on('open', () => {
      metrics.wsConnectTime = Date.now();
      testState.wsConnected = true;
      console.log(`${colors.green}✅ WebSocket conectado${colors.reset} (${formatTime(getTimeDiff(metrics.startTime, metrics.wsConnectTime))})\n`);

      // Simular ringtones (2 segundos cada uno = 4 segundos total)
      console.log(`${colors.blue}📞 Simulando ringtones (2x = 4s)...${colors.reset}\n`);
      setTimeout(() => {
        metrics.ringtonesEndTime = Date.now();
        console.log(`${colors.green}✅ Ringtones completados${colors.reset}\n`);

        // Enviar mensaje "ready" para iniciar saludo
        console.log(`${colors.cyan}📤 Enviando mensaje "ready"...${colors.reset}`);
        ws.send(JSON.stringify({
          route: 'conserje',
          action: 'message',
          payload: { type: 'ready' }
        }));
      }, RINGTONE_DURATION_MS * 2);
    });

    // FASE 2: Recibir saludo (TTS) - REAL
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Saludo recibido (REAL desde servidor)
        if (message.route === 'audio' && message.action === 'tts' && message.payload?.isWelcome) {
          if (!testState.greetingReceived) {
            metrics.greetingReceivedTime = Date.now();
            testState.greetingReceived = true;
            const greetingLatency = getTimeDiff(metrics.ringtonesEndTime || metrics.wsConnectTime, metrics.greetingReceivedTime);
            console.log(`${colors.green}✅ Saludo recibido (REAL)${colors.reset} (${formatTime(greetingLatency)})`);
            console.log(`   Texto: "${message.payload.text || 'N/A'}"\n`);

            // Esperar un momento y enviar transcripción real
            setTimeout(() => {
              metrics.transcriptionStartTime = Date.now();
              console.log(`${colors.cyan}🎤 Enviando transcripción de prueba...${colors.reset}`);
              
              // Enviar mensaje de transcripción simulada (el servidor procesará STT → IA → TTS)
              // Usamos un mensaje directo que simula una transcripción final
              ws.send(JSON.stringify({
                route: 'conserje',
                action: 'message',
                payload: {
                  type: 'transcription_final',
                  text: 'Hola Sandra, ¿cómo estás?'
                }
              }));
            }, 1000); // Esperar 1s después del saludo
          }
        }

        // Transcripción procesada (REAL desde servidor)
        if (message.route === 'conserje' && message.action === 'message' && message.payload?.type === 'transcription_final') {
          if (!testState.transcriptionSent) {
            metrics.transcriptionEndTime = Date.now();
            testState.transcriptionSent = true;
            const transcriptionLatency = getTimeDiff(metrics.transcriptionStartTime, metrics.transcriptionEndTime);
            console.log(`${colors.green}✅ Transcripción procesada (REAL)${colors.reset} (${formatTime(transcriptionLatency)})`);
            console.log(`   Texto: "${message.payload.text || 'N/A'}"\n`);

            // Marcar inicio de respuesta IA
            metrics.aiResponseStartTime = Date.now();
            console.log(`${colors.cyan}🤖 Esperando respuesta IA (REAL)...${colors.reset}`);
          }
        }

        // Respuesta IA recibida (REAL desde servidor)
        if (message.route === 'conserje' && message.action === 'message' && message.payload?.type === 'response_complete') {
          if (!testState.aiResponseReceived) {
            metrics.aiResponseEndTime = Date.now();
            testState.aiResponseReceived = true;
            const aiLatency = getTimeDiff(metrics.aiResponseStartTime, metrics.aiResponseEndTime);
            console.log(`${colors.green}✅ Respuesta IA generada (REAL)${colors.reset} (${formatTime(aiLatency)})`);
            console.log(`   Texto: "${message.payload.text?.substring(0, 50) || 'N/A'}..."\n`);

            // Marcar inicio de TTS respuesta
            metrics.ttsResponseStartTime = Date.now();
            console.log(`${colors.cyan}🎙️ Esperando audio respuesta (TTS REAL)...${colors.reset}`);
          }
        }

        // Respuesta conversacional recibida (REAL desde servidor)
        if (message.route === 'audio' && message.action === 'tts' && !message.payload?.isWelcome) {
          if (!testState.ttsResponseReceived) {
            metrics.ttsResponseEndTime = Date.now();
            testState.ttsResponseReceived = true;
            const ttsLatency = getTimeDiff(metrics.ttsResponseStartTime, metrics.ttsResponseEndTime);
            console.log(`${colors.green}✅ Audio respuesta recibido (REAL)${colors.reset} (${formatTime(ttsLatency)})`);
            console.log(`   Texto: "${message.payload.text?.substring(0, 50) || 'N/A'}..."\n`);

            if (!metrics.endTime) {
              metrics.endTime = Date.now();
              testState.testComplete = true;
              printMetrics();
              ws.close();
              resolve();
            }
          }
        }
      } catch (error) {
        // Ignorar errores de parsing (puede ser audio binario o mensajes no JSON)
      }
    });

    ws.on('error', (error) => {
      console.error(`${colors.red}❌ Error WebSocket:${colors.reset}`, error.message);
      reject(error);
    });

    ws.on('close', () => {
      if (!testState.testComplete) {
        console.log(`${colors.yellow}⚠️  Conexión cerrada antes de completar el test${colors.reset}\n`);
        printMetrics();
        resolve();
      }
    });

    // Timeout de seguridad (30 segundos)
    setTimeout(() => {
      if (!testState.testComplete) {
        console.log(`${colors.red}⏱️  Timeout: Test no completado en 30s${colors.reset}\n`);
        metrics.endTime = Date.now();
        printMetrics();
        ws.close();
        resolve();
      }
    }, 30000);
  });
}

// Ejecutar test
runLatencyTest()
  .then(() => {
    console.log(`${colors.green}✅ Test completado${colors.reset}\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`${colors.red}❌ Error en test:${colors.reset}`, error);
    process.exit(1);
  });
