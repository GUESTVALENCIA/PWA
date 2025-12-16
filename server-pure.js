// SANDRA PURE CORE - VOZ CONVERSACIONAL
// Clone of server-websocket.js adapted for QWEN Pure on port 4777

const WebSocket = require('ws');
const levenshtein = require('fast-levenshtein');
const config = require('./src/config/config');
const cartesiaService = require('./src/services/cartesia.service');
const deepgramService = require('./src/services/deepgram.service');
const QwenPure = require('./mcp-server/services/qwen-pure.js');

// Configuration override for Pure Core
const PURE_PORT = 4777;
const PURE_MODEL = 'qwen-main'; // Qwen3 32B

// Create WebSocket server
const wss = new WebSocket.Server({ port: PURE_PORT });

// Welcome message
const WELCOME_MESSAGE = 'Hola, soy Sandra, tu asistente virtual. Estoy lista para ayudarte con lo que necesites.';
let preGeneratedWelcomeAudio = null;

// Pre-generate welcome audio
async function preGenerateWelcomeAudio() {
  try {
    preGeneratedWelcomeAudio = await cartesiaService.generateVoice(WELCOME_MESSAGE);
  } catch (error) {
    console.error('❌ [PURE CORE] Error pre-generating welcome:', error);
  }
}
preGenerateWelcomeAudio();

// Banner Display
console.log('\n  ════════════════════════════════════════════════════════');
console.log('   🚀 SANDRA PURE CORE - VOZ CONVERSACIONAL');
console.log('  ════════════════════════════════════════════════════════');
console.log(`   🔌 Puerto: ${PURE_PORT}`);
console.log(`   🧠 Modelo: QWEN (Conversacional)`);
console.log(`   🎤 STT: Deepgram Nova-2 STREAMING`);
console.log(`   🔊 TTS: Cartesia Sonic`);
console.log(`   🛑 Barge-In: HABILITADO`);
console.log('  ════════════════════════════════════════════════════════\n');

// Utility to check if text is likely an echo
function isEcho(input, lastResponse) {
    if (!input || !lastResponse) return false;
    const normalize = (s) => s.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    const cleanInput = normalize(input);
    const cleanLast = normalize(lastResponse);
    if (cleanLast.includes(cleanInput) && cleanInput.length > 10) return true;
    const distance = levenshtein.get(cleanInput, cleanLast);
    const maxLength = Math.max(cleanInput.length, cleanLast.length);
    const similarity = 1 - (distance / maxLength);
    return similarity > 0.8;
}

wss.on('connection', async (ws) => {
  console.log('🔗 Cliente conectado a Sandra Core (STREAMING MODE)');

  // Instantiate QwenPure for this specific connection to isolate history
  const qwenService = new QwenPure({
      groqApiKey: config.apiKeys.groq,
      mcpServerUrl: process.env.MCP_SERVER_URL,
      mcpSecret: config.mcpSecretKey
  });

  let inactivityTimer = null;
  let lastBotResponse = "";
  let isProcessing = false;
  const INACTIVITY_TIMEOUT = 300000;

  const resetInactivityTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      console.log('📞 Terminando llamada completamente... (Inactividad)');
      ws.close();
    }, INACTIVITY_TIMEOUT);
  };
  resetInactivityTimer();

  let clientReady = false;
  let welcomeSent = false;

  const sendWelcomeMessage = async () => {
    if (welcomeSent) return;
    try {
      welcomeSent = true;
      console.log('👋 Enviando saludo de Sandra...');

      let welcomeAudio = preGeneratedWelcomeAudio || await cartesiaService.generateVoice(WELCOME_MESSAGE);

      ws.send(JSON.stringify({
        type: 'audio',
        audio: welcomeAudio,
        isWelcome: true
      }));

      lastBotResponse = WELCOME_MESSAGE;
      // Initialize history with welcome message (QwenPure stores history internally)
      qwenService.conversationHistory.push({ role: 'assistant', content: WELCOME_MESSAGE });

      console.log('✅ Saludo enviado');
    } catch (error) {
      console.error('❌ Error sending welcome:', error);
    }
  };

  ws.on('message', async (message) => {
    resetInactivityTimer();
    try {
      const data = JSON.parse(message);

      if (data.type === 'ready') {
        console.log('🎤 Starting voice stream...');
        console.log('✅ Deepgram Streaming: CONNECTED');
        clientReady = true;
        setTimeout(sendWelcomeMessage, 1000);
        return;
      }

      if (data.type === 'audio') {
        if (isProcessing) return;
        isProcessing = true;

        try {
          if (!data.audio) { isProcessing = false; return; }

          // STT via Deepgram
          const userText = await deepgramService.transcribeAudio(data.audio);

          if (userText && userText.trim()) {
              // Echo Cancellation
              if (isEcho(userText, lastBotResponse)) {
                  // console.log('🔁 Echo ignored');
                  isProcessing = false;
                  return;
              }

              // QWEN Processing
              // console.log('👤 User:', userText);

              const qwenResponse = await qwenService.chat(userText, {
                  model: PURE_MODEL,
                  systemPrompt: `Tu nombre es Sandra. Eres una asistente útil y amable de GuestsValencia. Responde de forma concisa (máximo 2 frases). Actúa como experta en hospitalidad.`
              });

              const responseText = qwenResponse.text;

              if (responseText) {
                  // console.log('🤖 Sandra (Qwen):', responseText);
                  lastBotResponse = responseText;

                  // TTS via Cartesia
                  const audioBase64 = await cartesiaService.generateVoice(responseText);

                  ws.send(JSON.stringify({
                      type: 'audio',
                      audio: audioBase64
                  }));
              }
          }
        } catch (error) {
          console.error('Error processing:', error);
        } finally {
            isProcessing = false;
        }
      }
    } catch (error) {
      console.error('WebSocket Error:', error);
    }
  });

  ws.on('close', () => {
    console.log('📞 Terminando llamada completamente...');
    console.log('✅ Llamada terminada');
    console.log('🔌 Deepgram WS closed');
    console.log('👋 Cliente desconectado');
    if (inactivityTimer) clearTimeout(inactivityTimer);
  });
});
