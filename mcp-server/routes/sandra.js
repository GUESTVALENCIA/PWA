const express = require('express');
const router = express.Router();
const https = require('https'); // For some calls if needed, but fetch is preferred in Node 18+

// --- SANDRA CORE ENGINE (Ported from api-gateway.js) ---
const GLOBAL_CONVERSATION_RULES = `
REGLAS CONVERSACIONALES GLOBALES (Sandra IA 8.0 Pro):
- Responde SIEMPRE en español neutro, con buena ortografía y gramática.
- Usa párrafos cortos y bien separados.
- Actúa como una experta en Hospitalidad y Turismo para Guests Valencia.
- Si te preguntan por disponibilidad, ofrece revisar datos en tiempo real.
- Brevedad estricta: máximo 4 frases salvo que se pida detalle.
`;

class AIOrchestrator {
  constructor() {
    this.providers = {
      openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o'
      },
      gemini: {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
        model: 'gemini-1.5-pro'
      },
      cartesia: {
        url: 'https://api.cartesia.ai/tts/bytes',
        model: 'sonic-multilingual',
        defaultVoice: '2d5b0e6cf361460aa7fc47e3cee4b30c'
      },
      deepgram: {
        url: 'https://api.deepgram.com/v1/listen?model=nova-2&language=es'
      }
    };
  }

  async generateResponse(shortPrompt, context = 'hospitality') {
    const fullSystemPrompt = `${GLOBAL_CONVERSATION_RULES}\nRole: ${context}`;

    try {
      console.log("Attempting Gemini...");
      return await this.callGemini(shortPrompt, fullSystemPrompt);
    } catch (error) {
      console.warn("Gemini Failed, falling back to OpenAI", error.message);
      return await this.callOpenAI(shortPrompt, fullSystemPrompt);
    }
  }

  async callGemini(prompt, systemPrompt) {
    if (!process.env.GEMINI_API_KEY) throw new Error("Missing Gemini Key");

    const response = await fetch(`${this.providers.gemini.url}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nUser: ${prompt}` }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error body: ${errorText.slice(0, 2000)}`);
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error(`Gemini API returned invalid response: no candidates found. Response: ${JSON.stringify(data)}`);
    }

    const candidate = data.candidates[0];
    if (!candidate || !candidate.content) {
      throw new Error(`Gemini API returned invalid candidate structure.`);
    }

    if (!candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      throw new Error(`Gemini API returned invalid content parts.`);
    }

    const text = candidate.content.parts[0].text;
    if (!text || typeof text !== 'string') {
      throw new Error(`Gemini API returned invalid text content.`);
    }

    return text;
  }

  async callOpenAI(prompt, systemPrompt) {
    if (!process.env.OPENAI_API_KEY) throw new Error("Missing OpenAI Key");

    const response = await fetch(this.providers.openai.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: this.providers.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API Error body: ${errorText.slice(0, 2000)}`);
      throw new Error(`OpenAI API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== 'string') {
      throw new Error(`OpenAI API: Unexpected response structure.`);
    }

    return content;
  }

  async generateVoice(text, voiceId) {
    if (!process.env.CARTESIA_API_KEY) throw new Error("Missing Cartesia Key");

    const selectedVoice = voiceId || this.providers.cartesia.defaultVoice;

    const response = await fetch(this.providers.cartesia.url, {
      method: "POST",
      headers: {
        "Cartesia-Version": "2024-06-10",
        "X-API-Key": process.env.CARTESIA_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_id: this.providers.cartesia.model,
        transcript: text,
        voice: {
          mode: "id",
          id: selectedVoice
        },
        output_format: {
          container: "mp3",
          sample_rate: 44100
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Cartesia Error: ${response.status} - ${err.slice(0, 100)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }

  async transcribeAudio(audioBuffer, contentType = "application/octet-stream") {
    if (!process.env.DEEPGRAM_API_KEY) throw new Error("Missing Deepgram Key");

    const response = await fetch(this.providers.deepgram.url, {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": contentType
      },
      body: audioBuffer
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Deepgram Error: ${response.status} - ${err.slice(0, 100)}`);
    }

    const data = await response.json();
    const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    if (!transcript) {
      throw new Error(`Deepgram API: No transcript found.`);
    }

    return transcript;
  }
}

const orchestrator = new AIOrchestrator();

// Routes
router.post('/chat', async (req, res) => {
  try {
    const { message, role, model = 'groq' } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });

    const systemPrompt = 'Eres Sandra, la conserje virtual de GuestsValencia. Eres amable, profesional y siempre disponible para ayudar.';
    let reply;

    // Selector de modelo: groq (default), openai, anthropic, gemini
    switch (model.toLowerCase()) {
      case 'groq':
      case 'qwen':
        // GROQ (gratis para producción) - DEFAULT
        if (!process.env.GROQ_API_KEY) {
          throw new Error('GROQ_API_KEY no configurada');
        }
        reply = await callGroq(message, systemPrompt);
        break;

      case 'openai':
      case 'gpt':
        // OpenAI GPT-4o
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY no configurada');
        }
        reply = await callOpenAI(message, systemPrompt);
        break;

      case 'anthropic':
      case 'claude':
        // Anthropic Claude
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY no configurada');
        }
        reply = await callAnthropic(message, systemPrompt);
        break;

      case 'gemini':
        // Google Gemini
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY no configurada');
        }
        reply = await callGemini(message, systemPrompt);
        break;

      default:
        // Fallback a Groq si el modelo no es reconocido
        console.warn(`Modelo desconocido "${model}", usando Groq por defecto`);
        if (!process.env.GROQ_API_KEY) {
          throw new Error('GROQ_API_KEY no configurada');
        }
        reply = await callGroq(message, systemPrompt);
    }

    res.json({ reply, model: model.toLowerCase() });
  } catch (error) {
    console.error(`[${req.body.model || 'groq'}] Sandra Chat Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Función para llamar a Groq (Qwen)
async function callGroq(message, systemPrompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen/qwen-2.5-72b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error: ${response.status} - ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Función para llamar a OpenAI
async function callOpenAI(message, systemPrompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API Error: ${response.status} - ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Función para llamar a Anthropic (Claude)
async function callAnthropic(message, systemPrompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: message }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API Error: ${response.status} - ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Función para llamar a Gemini
async function callGemini(message, systemPrompt) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }]
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Gemini API: Respuesta inválida');
  }
  return data.candidates[0].content.parts[0].text;
}

router.post('/voice', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const audioContent = await orchestrator.generateVoice(text, voiceId);
    res.json({ audioContent });
  } catch (error) {
    console.error("Sandra Voice Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper for multipart/form-data
const multer = require('multer');
const upload = multer();

router.post('/transcribe', upload.any(), async (req, res) => {
  try {
    let audioData;
    let contentType = req.headers['content-type'] || 'application/octet-stream';

    // Handle Multer files (multipart/form-data)
    if (req.files && req.files.length > 0) {
      // Look for field 'audio' or 'file', or just take the first one
      const file = req.files.find(f => f.fieldname === 'audio') ||
                   req.files.find(f => f.fieldname === 'file') ||
                   req.files[0];
      audioData = file.buffer;
      contentType = file.mimetype;
    }
    // Handle JSON with base64
    else if (req.body && (req.body.audio || req.body.data)) {
      const base64 = req.body.audio || req.body.data;
      audioData = Buffer.from(base64, 'base64');
    }
    // Handle raw body (if configured appropriately in express)
    else if (Buffer.isBuffer(req.body)) {
      audioData = req.body;
    }

    if (!audioData) {
      return res.status(400).json({ error: 'No audio data found' });
    }

    const transcript = await orchestrator.transcribeAudio(audioData, contentType);
    res.json({ text: transcript });
  } catch (error) {
    console.error("Sandra Transcribe Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
