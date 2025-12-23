// WebSocket Server for Real-Time Conversational Call
// Runs on port 4041 to avoid interference with HTTP server

const WebSocket = require('ws');
const levenshtein = require('fast-levenshtein');
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
    console.log(' [SERVER] Pre-generating welcome audio...');
    preGeneratedWelcomeAudio = await cartesiaService.generateVoice(WELCOME_MESSAGE);
    console.log(' [SERVER] Welcome audio pre-generated and cached');
  } catch (error) {
    console.error(' [SERVER] Error pre-generating welcome:', error);
    console.log(' [SERVER] Welcome audio will be generated in real-time if needed');
  }
}

// Pre-generate welcome on start
preGenerateWelcomeAudio();

console.log(` WebSocket Server started on port ${config.wsPort}`);

// Utility to check if text is likely an echo
function isEcho(input, lastResponse) {
    if (!input || !lastResponse) return false;

    // Normalize texts
    const normalize = (s) => s.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    const cleanInput = normalize(input);
    const cleanLast = normalize(lastResponse);

    // 1. Direct inclusion (e.g., STT caught part of the sentence)
    if (cleanLast.includes(cleanInput) && cleanInput.length > 10) return true;

    // 2. Levenshtein Distance (Fuzzy match)
    // If input is > 80% similar to last response
    const distance = levenshtein.get(cleanInput, cleanLast);
    const maxLength = Math.max(cleanInput.length, cleanLast.length);
    const similarity = 1 - (distance / maxLength);

    return similarity > 0.8;
}

wss.on('connection', async (ws) => {
  console.log(' Client connected for conversational call');
  
  let conversationHistory = [];
  let inactivityTimer = null;
  let lastActivityTime = Date.now();
  let lastBotResponse = ""; // Store last response for echo cancellation
  let isProcessing = false; // Simple lock to prevent race conditions/loops

  const INACTIVITY_TIMEOUT = 300000; // 5 minutes
  
  const resetInactivityTimer = () => {
    lastActivityTime = Date.now();
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      console.log('⏱ Call inactive, closing connection...');
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
      console.log(' Welcome already sent, ignoring duplicate');
      return;
    }
    if (!clientReady) {
      console.log(' Client not ready yet');
      return;
    }
    
    try {
      welcomeSent = true;
      console.log(' [SERVER] Sending welcome audio...');
      
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
      lastBotResponse = WELCOME_MESSAGE; // Initial echo context
      conversationHistory.push({ role: 'assistant', content: WELCOME_MESSAGE });
      console.log(' [SERVER] Welcome sent');
    } catch (error) {
      console.error(' [SERVER] Error sending welcome:', error);
      welcomeSent = false;
    }
  };
  
  ws.on('message', async (message) => {
    resetInactivityTimer();
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'ready') {
        console.log(' [SERVER] Client ready');
        clientReady = true;
        
        console.log('⏱ [SERVER] Waiting 1s before welcome...');
        welcomeTimeout = setTimeout(async () => {
          welcomeTimeout = null;
          await sendWelcomeMessage();
        }, 1000);
        
        return;
      }
      
      if (data.type === 'audio') {

        if (isProcessing) {
             console.log('⏳ [SERVER] Busy processing previous request, skipping audio frame...');
             return;
        }

        console.log(' Audio received, processing...');
        isProcessing = true; // Lock
        
        try {
          if (!data.audio) {
            ws.send(JSON.stringify({
              type: 'noSpeech',
              message: 'No audio received.'
            }));
            isProcessing = false;
            return;
          }
          
          // STT
          let userText = '';
          try {
             // Try Deepgram first if configured
             if (config.apiKeys.deepgram) {
                 userText = await deepgramService.transcribeAudio(data.audio);
             } else {
                 throw new Error('No STT service configured');
             }
          } catch(sttError) {
              console.error('STT Error:', sttError);
               ws.send(JSON.stringify({
                  type: 'noSpeech',
                  message: 'Could not understand audio.'
                }));
               isProcessing = false;
               return;
          }

          if (userText && userText.trim()) {
              console.log(' User STT:', userText);

              //  ECHO CANCELLATION CHECK
              if (isEcho(userText, lastBotResponse)) {
                  console.log(' [ECHO DETECTED] Ignoring input similar to last response.');
                  ws.send(JSON.stringify({ type: 'echoIgnored' }));
                  isProcessing = false;
                  return;
              }

              conversationHistory.push({ role: 'user', content: userText });
              
              // LLM
              const systemPrompt = `${config.globalConversationRules}\nRole: luxury`;
              let responseText = '';
              try {
                  // Primary: Gemini
                  responseText = await geminiService.generateContent(userText, systemPrompt);
              } catch (llmError) {
                  console.error('LLM Gemini Error:', llmError);
                  // Fallback: Groq
                  if (config.apiKeys.groq) {
                       console.log(' Failing over to Groq...');
                       const groqResp = await groqService.callGroqQwen(systemPrompt, userText, conversationHistory);
                       responseText = groqResp.text;
                  } else {
                      responseText = 'Lo siento, estoy teniendo problemas técnicos.';
                  }
              }

              if (responseText) {
                  console.log(' Sandra:', responseText);
                  lastBotResponse = responseText; // Update echo context
                  conversationHistory.push({ role: 'assistant', content: responseText });

                  // TTS
                  const audioBase64 = await cartesiaService.generateVoice(responseText);

                  ws.send(JSON.stringify({
                      type: 'audio',
                      audio: audioBase64
                  }));
              }
          } else {
              // Empty transcript handling
              console.log(' Empty transcript received');
              ws.send(JSON.stringify({ type: 'noSpeech' }));
          }

        } catch (error) {
          console.error(' Error processing audio:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Error processing audio: ' + error.message
          }));
        } finally {
            isProcessing = false; // Unlock
        }
        
      } else if (data.type === 'text') {
        const userMessage = data.text;
        conversationHistory.push({ role: 'user', content: userMessage });
        
        const systemPrompt = `${config.globalConversationRules}\nRole: luxury`;
        const response = await geminiService.generateContent(userMessage, systemPrompt);

        lastBotResponse = response;
        conversationHistory.push({ role: 'assistant', content: response });
        
        const audioBase64 = await cartesiaService.generateVoice(response);
        ws.send(JSON.stringify({
          type: 'audio',
          audio: audioBase64
        }));
      }
      
    } catch (error) {
      console.error(' WebSocket Error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    console.log(' Client disconnected');
    if (inactivityTimer) clearTimeout(inactivityTimer);
  });
  
  ws.on('error', (error) => {
    console.error(' WebSocket connection error:', error);
    if (inactivityTimer) clearTimeout(inactivityTimer);
  });
});
