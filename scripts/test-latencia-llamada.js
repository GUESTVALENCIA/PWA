/**
 * 🧪 SCRIPT DE MEDICIÓN DE LATENCIA - PRODUCCIÓN REAL
 * 
 * Mide la latencia REAL en PRODUCCIÓN desde que se descuelga la llamada hasta que se recibe la respuesta del modelo.
 * 
 * Mide:
 * 1. Tiempo de conexión WebSocket (real)
 * 2. Primer ringtone (1.43s real)
 * 3. Envío de audio REAL (a los 1.44s)
 * 4. Latencia TOTAL de respuesta (STT → IA → TTS) - REAL desde servidor
 * 
 * USO:
 *   node scripts/test-latencia-llamada.js
 * 
 * OPCIONAL - Audio real desde archivo:
 *   TEST_AUDIO_FILE=./mi-audio.wav node scripts/test-latencia-llamada.js
 * 
 * REQUISITOS:
 *   - Variables de entorno configuradas (.env)
 *   - Servidor WebSocket corriendo en PRODUCCIÓN
 * 
 * NOTA: Este script usa AUDIO REAL y mide latencia REAL en PRODUCCIÓN.
 */

import dotenv from 'dotenv';
import WebSocket from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

// Configuración
const WS_URL = process.env.MCP_SERVER_URL?.replace('https://', 'wss://').replace('http://', 'ws://') || 'wss://pwa-imbf.onrender.com';
const FIRST_RINGTONE_DURATION_MS = 1430; // 1.43 segundos (duración real del primer ringtone)
const QUESTION_DELAY_MS = 10; // 10ms después del primer ringtone (1.44s total)

// Audio real - buscar en raíz del proyecto (prioridad)
const ROOT_DIR = join(__dirname, '..');
const AUDIO_PRIORITY = [
  join(ROOT_DIR, 'sandra-conversational.wav'),  // Fallback Sandra Conversacional
  join(ROOT_DIR, 'test-audio.wav'),              // Audio de prueba personalizado
  process.env.TEST_AUDIO_FILE || null            // Variable de entorno
].filter(Boolean);

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
  firstRingtoneEndTime: null,
  questionSentTime: null,
  greetingReceivedTime: null,
  transcriptionStartTime: null,
  transcriptionEndTime: null,
  aiResponseStartTime: null,
  aiResponseEndTime: null,
  ttsResponseStartTime: null,
  ttsResponseEndTime: null,
  endTime: null,
  // Métricas específicas de primera respuesta
  firstResponseLatency: null,
  audioQuality: {
    size: null,
    format: null,
    estimatedDuration: null
  }
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

  // Fase 2: Primer ringtone (real)
  const firstRingtoneLatency = FIRST_RINGTONE_DURATION_MS;
  printMetric('2. Primer Ringtone:', formatTime(firstRingtoneLatency), colors.blue);

  // Fase 3: Saludo (TTS) - opcional, puede no llegar antes de la pregunta
  const greetingLatency = metrics.greetingReceivedTime ? 
    getTimeDiff(metrics.wsConnectTime, metrics.greetingReceivedTime) : null;
  if (greetingLatency !== null) {
    printMetric('3. Generación Saludo (TTS):', formatTime(greetingLatency), greetingLatency < 2000 ? colors.green : colors.yellow);
  }

  // Fase 4: Pregunta enviada
  const questionSentLatency = getTimeDiff(metrics.firstRingtoneEndTime, metrics.questionSentTime);
  printMetric('4. Pregunta enviada:', formatTime(questionSentLatency), colors.cyan);

  // Fase 5: ⭐ PRIMERA RESPUESTA DE IA (MÉTRICA PRINCIPAL)
  const firstResponseLatency = metrics.firstResponseLatency || getTimeDiff(metrics.questionSentTime, metrics.ttsResponseEndTime);
  printMetric('5. ⭐ PRIMERA RESPUESTA IA:', formatTime(firstResponseLatency), firstResponseLatency < 5000 ? colors.green : colors.yellow);

  // Desglose interno de la respuesta (si está disponible)
  if (metrics.transcriptionEndTime && metrics.aiResponseEndTime) {
    const transcriptionLatency = getTimeDiff(metrics.transcriptionStartTime, metrics.transcriptionEndTime);
    const aiResponseLatency = getTimeDiff(metrics.aiResponseStartTime, metrics.aiResponseEndTime);
    const ttsResponseLatency = getTimeDiff(metrics.ttsResponseStartTime, metrics.ttsResponseEndTime);
    
    printMetric('   • STT (Transcripción):', formatTime(transcriptionLatency), colors.blue);
    printMetric('   • IA (Procesamiento):', formatTime(aiResponseLatency), colors.blue);
    printMetric('   • TTS (Audio respuesta):', formatTime(ttsResponseLatency), colors.blue);
  }

  // Latencia total
  const totalLatency = getTimeDiff(metrics.startTime, metrics.endTime);
  printMetric('\n⏱️  LATENCIA TOTAL:', formatTime(totalLatency), totalLatency < 10000 ? colors.green : colors.red);

  // Desglose por componentes
  console.log('\n' + '-'.repeat(60));
  console.log(`${colors.bright}📈 DESGLOSE POR COMPONENTES:${colors.reset}\n`);

  const networkLatency = wsConnectLatency;
  const ringtoneLatency = firstRingtoneLatency;
  const responseLatency = totalResponseLatency || 0;
  const otherLatency = (totalLatency || 0) - networkLatency - ringtoneLatency - responseLatency;

  printMetric('  • Red (WebSocket):', formatTime(networkLatency));
  printMetric('  • Primer Ringtone:', formatTime(ringtoneLatency));
  printMetric('  • Respuesta Completa (STT+IA+TTS):', formatTime(responseLatency));
  printMetric('  • Otros (overhead):', formatTime(otherLatency));

  // Análisis de latencia de primera respuesta
  console.log('\n' + '-'.repeat(60));
  console.log(`${colors.bright}🔍 ANÁLISIS - PRIMERA RESPUESTA IA:${colors.reset}\n`);

  const firstResponseLatency = metrics.firstResponseLatency || 0;
  if (firstResponseLatency < 3000) {
    console.log(`${colors.green}✅ Latencia EXCELENTE (< 3s) - Pipeline optimizado${colors.reset}`);
  } else if (firstResponseLatency < 6000) {
    console.log(`${colors.yellow}⚠️  Latencia ACEPTABLE (3-6s) - Mejorable${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Latencia ALTA (> 6s) - Necesita optimización urgente${colors.reset}`);
  }

  // Análisis de calidad de audio
  console.log('\n' + '-'.repeat(60));
  console.log(`${colors.bright}🎵 CALIDAD DE AUDIO:${colors.reset}\n`);
  
  if (metrics.audioQuality.size) {
    printMetric('  • Tamaño audio enviado:', formatTime(metrics.audioQuality.size) + ' bytes');
    printMetric('  • Formato:', metrics.audioQuality.format.toUpperCase());
    if (metrics.audioQuality.estimatedDuration) {
      printMetric('  • Duración estimada:', metrics.audioQuality.estimatedDuration + 's');
    }
    
    // Evaluar calidad
    if (metrics.audioQuality.size > 10000) {
      console.log(`${colors.green}✅ Audio de buena calidad (tamaño adecuado)${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Audio pequeño - puede afectar transcripción${colors.reset}`);
    }
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

      // Simular primer ringtone (1.43s)
      console.log(`${colors.blue}📞 Simulando primer ringtone (1.43s)...${colors.reset}\n`);
      setTimeout(() => {
        metrics.firstRingtoneEndTime = Date.now();
        console.log(`${colors.green}✅ Primer ringtone completado${colors.reset} (${formatTime(FIRST_RINGTONE_DURATION_MS)})\n`);

          // A los 1.44s (10ms después) enviar pregunta como audio REAL
          setTimeout(() => {
            metrics.questionSentTime = Date.now();
            metrics.transcriptionStartTime = Date.now();
            console.log(`${colors.cyan}💬 Enviando audio REAL de producción${colors.reset}`);
            console.log(`   (${formatTime(getTimeDiff(metrics.firstRingtoneEndTime, metrics.questionSentTime))} después del ringtone)\n`);
          
          // Cargar audio REAL desde archivo (prioridad: raíz del proyecto)
          let audioBuffer;
          let audioFormat = 'pcm';
          let sampleRate = 48000;
          let audioFilePath = null;
          
          try {
            // Buscar archivo de audio en orden de prioridad
            for (const audioPath of AUDIO_PRIORITY) {
              if (fs.existsSync(audioPath)) {
                audioBuffer = fs.readFileSync(audioPath);
                audioFilePath = audioPath;
                console.log(`${colors.green}✅ Audio real cargado: ${path.basename(audioPath)}${colors.reset} (${audioBuffer.length} bytes)\n`);
                
                // Detectar formato por extensión
                if (audioPath.endsWith('.wav')) {
                  audioFormat = 'wav';
                } else if (audioPath.endsWith('.webm')) {
                  audioFormat = 'webm';
                } else if (audioPath.endsWith('.mp3')) {
                  audioFormat = 'mp3';
                }
                break; // Usar el primer archivo encontrado
              }
            }
            
            // Si no se encontró ningún archivo, generar audio de prueba
            if (!audioBuffer) {
              // Generar audio PCM real (tono de prueba - no silencio)
              // 1 segundo de audio PCM a 48kHz, 16-bit, mono
              const duration = 1.0; // 1 segundo
              const samples = Math.floor(sampleRate * duration);
              audioBuffer = Buffer.alloc(samples * 2); // 16-bit = 2 bytes por muestra
              
              // Generar tono de prueba (440Hz - La musical)
              const frequency = 440;
              for (let i = 0; i < samples; i++) {
                const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate);
                const intSample = Math.floor(sample * 32767);
                audioBuffer.writeInt16LE(intSample, i * 2);
              }
              
              console.log(`${colors.yellow}⚠️  Archivos de audio no encontrados, generando tono de prueba${colors.reset} (${audioBuffer.length} bytes)\n`);
              console.log(`${colors.yellow}💡 Para usar audio real, coloca un archivo en la raíz del proyecto:${colors.reset}`);
              console.log(`${colors.yellow}   - sandra-conversational.wav (recomendado)${colors.reset}`);
              console.log(`${colors.yellow}   - test-audio.wav${colors.reset}\n`);
            }
            
            // Guardar métricas de calidad de audio
            if (audioBuffer) {
              metrics.audioQuality.size = audioBuffer.length;
              metrics.audioQuality.format = audioFormat;
              // Estimar duración: para PCM 48kHz 16-bit mono = 2 bytes por muestra
              if (audioFormat === 'pcm' || audioFormat === 'wav') {
                const samples = audioBuffer.length / 2;
                metrics.audioQuality.estimatedDuration = (samples / sampleRate).toFixed(2);
              }
            }
          } catch (error) {
            console.error(`${colors.red}❌ Error cargando audio:${colors.reset}`, error.message);
            // Fallback: generar audio mínimo real
            audioBuffer = Buffer.alloc(9600); // 100ms de audio PCM
            for (let i = 0; i < 4800; i++) {
              const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate);
              audioBuffer.writeInt16LE(Math.floor(sample * 32767), i * 2);
            }
          }
          
          // Convertir a base64
          const audioBase64 = audioBuffer.toString('base64');
          
          // Enviar audio REAL al servidor (producción)
          ws.send(JSON.stringify({
            route: 'audio',
            action: 'stt',
            payload: {
              audio: audioBase64,
              format: audioFormat === 'pcm' ? 'linear16' : audioFormat,
              encoding: 'linear16',
              sampleRate: sampleRate,
              channels: 1,
              mimeType: audioFormat === 'webm' ? 'audio/webm;codecs=opus' : 'audio/raw'
            }
          }));
          
          console.log(`${colors.cyan}📤 Audio REAL enviado al servidor (${audioBuffer.length} bytes, ${audioFormat})${colors.reset}\n`);
        }, QUESTION_DELAY_MS);
      }, FIRST_RINGTONE_DURATION_MS);
    });

    // FASE 2: Recibir saludo (TTS) - REAL
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Saludo recibido (REAL desde servidor) - opcional, puede llegar después
        if (message.route === 'audio' && message.action === 'tts' && message.payload?.isWelcome) {
          if (!testState.greetingReceived) {
            metrics.greetingReceivedTime = Date.now();
            testState.greetingReceived = true;
            const greetingLatency = getTimeDiff(metrics.wsConnectTime, metrics.greetingReceivedTime);
            console.log(`${colors.green}✅ Saludo recibido (REAL)${colors.reset} (${formatTime(greetingLatency)})`);
            console.log(`   Texto: "${message.payload.text || 'N/A'}"\n`);
            // No hacemos nada más, la pregunta ya se envió después del primer ringtone
          }
        }

        // Transcripción procesada (REAL desde servidor) - puede no llegar si el servidor procesa directamente
        if (message.route === 'conserje' && message.action === 'message' && message.payload?.type === 'transcription_final') {
          if (!testState.transcriptionSent) {
            metrics.transcriptionEndTime = Date.now();
            testState.transcriptionSent = true;
            const transcriptionLatency = getTimeDiff(metrics.transcriptionStartTime, metrics.transcriptionEndTime);
            console.log(`${colors.green}✅ Transcripción confirmada (REAL)${colors.reset} (${formatTime(transcriptionLatency)})`);
            console.log(`   Texto: "${message.payload.text || 'N/A'}"\n`);

            // Marcar inicio de respuesta IA
            metrics.aiResponseStartTime = Date.now();
            console.log(`${colors.cyan}🤖 Esperando respuesta IA (REAL)...${colors.reset}`);
          }
        }

        // Respuesta IA recibida (REAL desde servidor) - puede no llegar si el servidor envía directamente audio
        if (message.route === 'conserje' && message.action === 'message' && message.payload?.type === 'response_complete') {
          if (!testState.aiResponseReceived) {
            metrics.aiResponseEndTime = Date.now();
            testState.aiResponseReceived = true;
            // Si no teníamos inicio, usar el tiempo de la pregunta
            if (!metrics.aiResponseStartTime) {
              metrics.aiResponseStartTime = metrics.questionSentTime;
            }
            const aiLatency = getTimeDiff(metrics.aiResponseStartTime, metrics.aiResponseEndTime);
            console.log(`${colors.green}✅ Respuesta IA generada (REAL)${colors.reset} (${formatTime(aiLatency)})`);
            console.log(`   Texto: "${message.payload.text?.substring(0, 50) || 'N/A'}..."\n`);

            // Marcar inicio de TTS respuesta
            metrics.ttsResponseStartTime = Date.now();
            console.log(`${colors.cyan}🎙️ Esperando audio respuesta (TTS REAL)...${colors.reset}`);
          }
        }

        // Respuesta conversacional recibida (REAL desde servidor) - ESTO ES LO QUE MEDIMOS
        if (message.route === 'audio' && message.action === 'tts' && !message.payload?.isWelcome) {
          if (!testState.ttsResponseReceived) {
            metrics.ttsResponseEndTime = Date.now();
            testState.ttsResponseReceived = true;
            
            // Si no teníamos tiempos intermedios, calcularlos ahora
            if (!metrics.aiResponseStartTime) {
              metrics.aiResponseStartTime = metrics.questionSentTime;
            }
            if (!metrics.ttsResponseStartTime) {
              metrics.ttsResponseStartTime = metrics.questionSentTime;
            }
            if (!metrics.transcriptionEndTime) {
              metrics.transcriptionEndTime = metrics.questionSentTime;
            }
            if (!metrics.aiResponseEndTime) {
              metrics.aiResponseEndTime = metrics.ttsResponseEndTime;
            }
            
            // ⭐ MÉTRICA PRINCIPAL: Primera respuesta de IA
            metrics.firstResponseLatency = getTimeDiff(metrics.questionSentTime, metrics.ttsResponseEndTime);
            
            // Calcular calidad del audio recibido
            const audioBase64 = message.payload.audio || '';
            const audioSize = audioBase64 ? Math.floor(audioBase64.length * 0.75) : 0; // Base64 es ~33% más grande
            
            console.log(`${colors.green}✅ Audio respuesta recibido (REAL)${colors.reset}`);
            console.log(`   Texto: "${message.payload.text?.substring(0, 80) || 'N/A'}..."`);
            console.log(`   ${colors.bright}⏱️  Latencia PRIMERA RESPUESTA IA: ${formatTime(metrics.firstResponseLatency)}${colors.reset}`);
            console.log(`   ${colors.cyan}📊 Calidad Audio: ${formatTime(audioSize)} bytes, formato: ${message.payload.format || 'N/A'}${colors.reset}\n`);

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

    // Timeout de seguridad (20 segundos - suficiente para una respuesta)
    setTimeout(() => {
      if (!testState.testComplete) {
        console.log(`${colors.red}⏱️  Timeout: Test no completado en 20s${colors.reset}\n`);
        console.log(`${colors.yellow}⚠️  La respuesta del servidor no llegó a tiempo${colors.reset}\n`);
        metrics.endTime = Date.now();
        printMetrics();
        ws.close();
        resolve();
      }
    }, 20000);
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
