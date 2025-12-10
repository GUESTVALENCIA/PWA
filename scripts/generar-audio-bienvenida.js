/**
 * Script para generar el audio grabado del saludo de bienvenida
 * Este script genera el audio una sola vez usando Cartesia y lo guarda en assets/audio/welcome.mp3
 */

// Cargar variables de entorno desde .env en el root o desde mcp-server/.env
const envPath = require('path').join(__dirname, '../.env');
const mcpEnvPath = require('path').join(__dirname, '../mcp-server/.env');
if (require('fs').existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else if (require('fs').existsSync(mcpEnvPath)) {
  require('dotenv').config({ path: mcpEnvPath });
} else {
  require('dotenv').config();
}
const https = require('https');
const fs = require('fs');
const path = require('path');

const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;
const CARTESIA_VOICE_ID = process.env.CARTESIA_VOICE_ID || '2d5b0e6cf361460aa7fc47e3cee4b30c';

// Mensaje de bienvenida exacto del chat
const WELCOME_TEXT = '¡Hola! Soy Sandra. Bienvenido a GuestsValencia. ¿En qué puedo ayudarte hoy?';

// Generar audio con Cartesia
async function generateWelcomeAudio() {
  return new Promise((resolve, reject) => {
    if (!CARTESIA_API_KEY) {
      reject(new Error('CARTESIA_API_KEY no configurada. Configúrala en mcp-server/.env'));
      return;
    }

    const postData = JSON.stringify({
      model_id: 'sonic-multilingual',
      transcript: WELCOME_TEXT,
      voice: {
        mode: 'id',
        id: CARTESIA_VOICE_ID
      },
      output_format: {
        container: 'mp3',
        sample_rate: 44100  // CD quality
      }
    });

    const options = {
      hostname: 'api.cartesia.ai',
      path: '/tts/bytes',
      method: 'POST',
      headers: {
        'Cartesia-Version': '2024-06-10',
        'X-API-Key': CARTESIA_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('🎙️ Generando audio del saludo de bienvenida con Cartesia...');
    console.log(`📝 Texto: "${WELCOME_TEXT}"`);
    console.log(`🔊 Voz ID: ${CARTESIA_VOICE_ID}`);

    const req = https.request(options, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          const errorText = Buffer.concat(chunks).toString();
          reject(new Error(`Cartesia API Error: ${res.statusCode} - ${errorText}`));
          return;
        }

        const audioBuffer = Buffer.concat(chunks);
        console.log(`✅ Audio generado: ${audioBuffer.length} bytes`);
        resolve(audioBuffer);
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Error en request a Cartesia: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

// Guardar audio en archivo
async function saveWelcomeAudio() {
  try {
    // Crear directorio si no existe
    const audioDir = path.join(__dirname, '../assets/audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
      console.log(`📁 Directorio creado: ${audioDir}`);
    }

    // Generar audio
    const audioBuffer = await generateWelcomeAudio();

    // Guardar archivo
    const filePath = path.join(audioDir, 'welcome.mp3');
    fs.writeFileSync(filePath, audioBuffer);
    
    const fileSizeKB = (audioBuffer.length / 1024).toFixed(2);
    console.log(`✅ Audio guardado exitosamente:`);
    console.log(`   📄 Archivo: ${filePath}`);
    console.log(`   📊 Tamaño: ${fileSizeKB} KB`);
    console.log(`   🎵 Formato: MP3, 44.1kHz`);
    console.log('');
    console.log('✅ El servidor MCP ahora usará este archivo grabado en lugar de generar con TTS');

  } catch (error) {
    console.error('❌ Error generando audio de bienvenida:', error.message);
    process.exit(1);
  }
}

// Ejecutar
saveWelcomeAudio();

