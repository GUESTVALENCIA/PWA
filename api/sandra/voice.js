// Vercel Serverless Function - Sandra Voice/TTS API
// Endpoint: /api/sandra/voice

const https = require('https');

// Generar TTS con Cartesia
function generateTTS(text) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model_id: 'sonic-multilingual',
      transcript: text,
      voice: {
        mode: 'id',
        id: process.env.CARTESIA_VOICE_ID
      },
      output_format: {
        container: 'mp3',
        sample_rate: 44100
      }
    });

    const options = {
      hostname: 'api.cartesia.ai',
      path: '/tts/bytes',
      method: 'POST',
      headers: {
        'Cartesia-Version': '2024-06-10',
        'X-API-Key': process.env.CARTESIA_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Cartesia Error: ${res.statusCode}`));
          return;
        }
        const audioBuffer = Buffer.concat(chunks);
        const audioBase64 = audioBuffer.toString('base64');
        resolve(audioBase64);
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Handler de Vercel
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Verificar que las API keys estén configuradas
    if (!process.env.CARTESIA_API_KEY || !process.env.CARTESIA_VOICE_ID) {
      console.error('⚠️ CARTESIA_API_KEY o CARTESIA_VOICE_ID no configuradas');
      return res.status(500).json({ error: 'CARTESIA_API_KEY y CARTESIA_VOICE_ID deben estar configuradas en variables de entorno' });
    }

    const audioBase64 = await generateTTS(text);
    
    return res.status(200).json({ audio: audioBase64 });
  } catch (error) {
    console.error('Sandra Voice Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

