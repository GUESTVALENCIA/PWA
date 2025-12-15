// WebSocket Server for Real-Time Conversational Call
// Runs on port 4041 to avoid interference with HTTP server

const WebSocket = require('ws');
const config = require('./src/config/config');
const geminiService = require('./src/services/gemini.service');
const cartesiaService = require('./src/services/cartesia.service');
const deepgramService = require('./src/services/deepgram.service');
const groqService = require('./src/services/groq.service');

// Create WebSocket server
const wss = new WebSocket.Server({ port: config.wsPort });

// PRE-GENERATE WELCOME AUDIO on server start
let preGeneratedWelcomeAudio = null;
const WELCOME_MESSAGE = 'Hola, soy Sandra, bienvenido a GuestsValencia, ¿en qué puedo ayudarte hoy?';

async function preGenerateWelcomeAudio() {
  try {
    console.log('🎙️ [SERVER] Pre-generating welcome audio...');
    preGeneratedWelcomeAudio = await cartesiaService.generateVoice(WELCOME_MESSAGE);
    console.log('✅ [SERVER] Welcome audio pre-generated and cached');
  } catch (error) {
    console.error('❌ [SERVER] Error pre-generating welcome:', error);
    console.log('⚠️ [SERVER] Welcome audio will be generated in real-time if needed');
  }
}

// Pre-generate welcome on start
preGenerateWelcomeAudio();

console.log(`🔌 WebSocket Server started on port ${config.wsPort}`);

wss.on('connection', async (ws) => {
  console.log('✅ Client connected for conversational call');
  
  let conversationHistory = [];
  let inactivityTimer = null;
  let lastActivityTime = Date.now();
  const INACTIVITY_TIMEOUT = 300000; // 5 minutes
  
  const resetInactivityTimer = () => {
    lastActivityTime = Date.now();
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      console.log('⏱️ Call inactive, closing connection...');
      ws.send(JSON.stringify({
        type: 'timeout',
        message: 'Llamada cerrada por inactividad'
      }));
      ws.close();
    }, INACTIVITY_TIMEOUT);
  };
  
  resetInactivityTimer();
  
  let clientReady = false;
  let welcomeSent = false;
  let welcomeTimeout = null;
  
  const sendWelcomeMessage = async () => {
    if (welcomeSent) {
      console.log('⚠️ Welcome already sent, ignoring duplicate');
      return;
    }
    if (!clientReady) {
      console.log('⚠️ Client not ready yet');
      return;
    }
    
    try {
      welcomeSent = true;
      console.log('👋 [SERVER] Sending welcome audio...');
      
      let welcomeAudio;
      if (preGeneratedWelcomeAudio) {
        welcomeAudio = preGeneratedWelcomeAudio;
      } else {
        welcomeAudio = await cartesiaService.generateVoice(WELCOME_MESSAGE);
      }
      
      const messageToSend = JSON.stringify({
        type: 'audio',
        audio: welcomeAudio,
        isWelcome: true
      });
      
      ws.send(messageToSend);
      conversationHistory.push({ role: 'assistant', content: WELCOME_MESSAGE });
      console.log('✅ [SERVER] Welcome sent');
    } catch (error) {
      console.error('❌ [SERVER] Error sending welcome:', error);
      welcomeSent = false;
    }
  };
  
  ws.on('message', async (message) => {
    resetInactivityTimer();
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'ready') {
        console.log('✅ [SERVER] Client ready');
        clientReady = true;
        
        console.log('⏱️ [SERVER] Waiting 1s before welcome...');
        welcomeTimeout = setTimeout(async () => {
          welcomeTimeout = null;
          await sendWelcomeMessage();
        }, 1000);
        
        return;
      }
      
      if (data.type === 'audio') {
        console.log('🎤 Audio received, processing...');
        
        try {
          if (!data.audio) {
            ws.send(JSON.stringify({
              type: 'noSpeech',
              message: 'No audio received.'
            }));
            return;
          }
          
          // STT
          let userText = '';
          try {
             // Try Deepgram first if configured
             if (config.apiKeys.deepgram) {
                 userText = await deepgramService.transcribeAudio(data.audio);
             } else {
                 // Fallback logic or other STT could go here
                 throw new Error('No STT service configured');
             }
          } catch(sttError) {
              console.error('STT Error:', sttError);
               ws.send(JSON.stringify({
                  type: 'noSpeech',
                  message: 'Could not understand audio.'
                }));
               return;
          }

          if (userText && userText.trim()) {
              console.log('👤 User:', userText);
              conversationHistory.push({ role: 'user', content: userText });
              
              // LLM
              const systemPrompt = `${config.globalConversationRules}\nRole: luxury`;
              let responseText = '';
              try {
                  responseText = await geminiService.generateContent(userText, systemPrompt);
              } catch (llmError) {
                  console.error('LLM Error:', llmError);
                  // Fallback to Groq if needed
                  if (config.apiKeys.groq) {
                       const groqResp = await groqService.callGroqQwen(systemPrompt, userText, conversationHistory);
                       responseText = groqResp.text;
                  } else {
                      responseText = 'Lo siento, estoy teniendo problemas técnicos.';
                  }
              }

              if (responseText) {
                  console.log('🤖 Sandra:', responseText);
                  conversationHistory.push({ role: 'assistant', content: responseText });

                  // TTS
                  const audioBase64 = await cartesiaService.generateVoice(responseText);

                  ws.send(JSON.stringify({
                      type: 'audio',
                      audio: audioBase64
                  }));
              }
          }
          
        } catch (error) {
          console.error('❌ Error processing audio:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Error processing audio: ' + error.message
          }));
        }
        
      } else if (data.type === 'text') {
        const userMessage = data.text;
        conversationHistory.push({ role: 'user', content: userMessage });
        
        const systemPrompt = `${config.globalConversationRules}\nRole: luxury`;
        const response = await geminiService.generateContent(userMessage, systemPrompt);

        conversationHistory.push({ role: 'assistant', content: response });
        
        const audioBase64 = await cartesiaService.generateVoice(response);
        ws.send(JSON.stringify({
          type: 'audio',
          audio: audioBase64
        }));
      }
      
    } catch (error) {
      console.error('❌ WebSocket Error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('❌ Client disconnected');
    if (inactivityTimer) clearTimeout(inactivityTimer);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket connection error:', error);
    if (inactivityTimer) clearTimeout(inactivityTimer);
  });
});
