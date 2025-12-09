// Vercel Serverless Function - Sandra Transcribe/STT API
// Endpoint: /api/sandra/transcribe

const https = require('https');

// Transcribir audio con Deepgram
function transcribeAudio(audioBase64) {
  return new Promise((resolve, reject) => {
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    if (!audioBuffer || audioBuffer.length === 0) {
      reject(new Error('Audio buffer vacío'));
      return;
    }

    const queryParams = new URLSearchParams({
      model: 'nova-2',
      language: 'es',
      punctuate: 'true',
      smart_format: 'true',
      diarize: 'false',
      multichannel: 'false',
      interim_results: 'false'
    });

    const options = {
      hostname: 'api.deepgram.com',
      path: `/v1/listen?${queryParams.toString()}`,
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm;codecs=opus',
        'Content-Length': audioBuffer.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Deepgram Error ${res.statusCode}: ${data.substring(0, 200)}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          const transcript = json?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
          resolve(transcript.trim());
        } catch (e) {
          reject(new Error('Error parseando respuesta de Deepgram: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(audioBuffer);
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
    const { audio } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Audio is required' });
    }

    // Verificar que la API key esté configurada
    if (!process.env.DEEPGRAM_API_KEY) {
      console.error('⚠️ DEEPGRAM_API_KEY no configurada');
      return res.status(500).json({ error: 'DEEPGRAM_API_KEY debe estar configurada en variables de entorno' });
    }

    const transcript = await transcribeAudio(audio);
    
    return res.status(200).json({ transcript });
  } catch (error) {
    console.error('Sandra Transcribe Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

