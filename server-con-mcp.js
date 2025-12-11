// Servidor Local para Sistema Galaxy + MCP ENDPOINTS
// Actualizado por Opus para Sandra IA 8.0 Pro

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const fsPromises = require('fs').promises;

// Cargar variables de entorno desde .env
require('dotenv').config();

// API Keys desde variables de entorno
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;
const CARTESIA_VOICE_ID = process.env.CARTESIA_VOICE_ID;
const MCP_SECRET_KEY = process.env.MCP_SECRET_KEY || 'sandra_mcp_ultra_secure_2025';

// Reglas conversacionales (del sistema Galaxy original)
const GLOBAL_CONVERSATION_RULES = `
REGLAS CONVERSACIONALES GLOBALES (Sandra IA 8.0 Pro):
- IMPORTANTE: Sandra SÍ puede realizar llamadas de voz conversacionales en tiempo real. Cuando un usuario solicite "llamada de voz", "llamada conversacional" o "hablar contigo", debes ofrecerle amablemente esta opción. NO es una videollamada, es una llamada de voz en tiempo real con audio bidireccional.
- Responde SIEMPRE en español neutro, con buena ortografía y gramática.
- Usa párrafos cortos y bien separados.
- Actúa como una experta en Hospitalidad y Turismo para Guests Valencia.
- Si te preguntan por disponibilidad, ofrece revisar datos en tiempo real.
- Brevedad estricta: máximo 4 frases salvo que se pida detalle.
`;

// AIOrchestrator (adaptado del sistema Galaxy original)
class AIOrchestrator {
  constructor() {
    this.providers = {
      gemini: {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        model: 'gemini-2.5-flash'
      },
      cartesia: {
        url: 'https://api.cartesia.ai/tts/bytes',
        model: 'sonic-multilingual',
        defaultVoice: CARTESIA_VOICE_ID
      }
    };
  }

  async generateResponse(shortPrompt, context = 'luxury') {
    const fullSystemPrompt = `${GLOBAL_CONVERSATION_RULES}\nRole: ${context}`;
    
    try {
      console.log("🔄 Attempting Gemini...");
      return await this.callGemini(shortPrompt, fullSystemPrompt);
    } catch (error) {
      console.error("❌ Gemini Error:", error.message);
      throw error;
    }
  }

  callGemini(prompt, systemPrompt) {
    return new Promise((resolve, reject) => {
      const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;
      const postData = JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }]
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            console.error('❌ Gemini API Error:', res.statusCode, data);
            reject(new Error(`Gemini API Error: ${res.statusCode} ${res.statusMessage} - ${data.substring(0, 200)}`));
            return;
          }

          try {
            const jsonData = JSON.parse(data);

            if (!jsonData || !jsonData.candidates || !Array.isArray(jsonData.candidates) || jsonData.candidates.length === 0) {
              reject(new Error(`Gemini API returned invalid response: no candidates found.`));
              return;
            }

            const candidate = jsonData.candidates[0];
            if (!candidate || !candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
              reject(new Error(`Gemini API returned invalid candidate structure.`));
              return;
            }

            const text = candidate.content.parts[0].text;
            if (!text || typeof text !== 'string') {
              reject(new Error(`Gemini API returned invalid text content.`));
              return;
            }

            console.log("✅ Gemini response received");
            resolve(text);
          } catch (error) {
            reject(new Error(`Failed to parse Gemini response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Gemini API request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  generateVoice(text, voiceId = CARTESIA_VOICE_ID) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        model_id: this.providers.cartesia.model,
        transcript: text,
        voice: {
          mode: 'id',
          id: voiceId
        },
        output_format: {
          container: 'mp3',
          sample_rate: 24000
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

      const req = https.request(options, (res) => {
        const chunks = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            const errorText = Buffer.concat(chunks).toString();
            reject(new Error(`Cartesia API Error: ${res.statusCode} - ${errorText}`));
            return;
          }

          const audioBuffer = Buffer.concat(chunks);
          const audioBase64 = audioBuffer.toString('base64');
          resolve(audioBase64);
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Cartesia API request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }
}

// Global Orchestrator Instance
const orchestrator = new AIOrchestrator();

// Helper para leer el body del request
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Verificar MCP Secret
function verifyMCPSecret(req) {
  const mcpSecret = req.headers['mcp-secret'];
  return mcpSecret === MCP_SECRET_KEY;
}

// Servidor HTTP único que maneja API y archivos estáticos
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-secret');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        chat: true,
        voice: true,
        vision: false,
        commands: true,
        scheduler: true,
        mcp: true
      }
    }));
    return;
  }

  // ═══════════════════════════════════════════════════════════════════
  // MCP ENDPOINTS - CAPACIDAD DE EJECUCIÓN PARA SANDRA
  // ═══════════════════════════════════════════════════════════════════
  
  if (pathname.startsWith('/mcp/')) {
    const contentType = req.headers['content-type'] || '';
    let parsedBody = null;
    
    if (req.method === 'POST') {
      const rawBody = await getRawBody(req);
      if (contentType.includes('application/json')) {
        try {
          parsedBody = JSON.parse(rawBody.toString('utf8'));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Invalid JSON: ${error.message}` }));
          return;
        }
      }
    }
    
    switch (pathname) {
      case '/mcp/execute_command':
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        
        if (!verifyMCPSecret(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid MCP secret' }));
          return;
        }
        
        const { command } = parsedBody;
        
        if (!command) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Command required' }));
          return;
        }
        
        console.log(`⚡ [MCP] Ejecutando comando: ${command}`);
        
        exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ [MCP] Error ejecutando comando:`, error);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: error.message,
              stderr: stderr
            }));
          } else {
            console.log(`✅ [MCP] Comando ejecutado exitosamente`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              output: stdout,
              stderr: stderr
            }));
          }
        });
        return;
        
      case '/mcp/read_file':
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        
        if (!verifyMCPSecret(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid MCP secret' }));
          return;
        }
        
        try {
          const { filePath } = parsedBody;
          
          if (!filePath) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File path required' }));
            return;
          }
          
          console.log(`📄 [MCP] Leyendo archivo: ${filePath}`);
          
          const content = await fsPromises.readFile(filePath, 'utf-8');
          
          console.log(`✅ [MCP] Archivo leído: ${content.length} caracteres`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            content: content,
            path: filePath,
            size: content.length
          }));
        } catch (error) {
          console.error('❌ [MCP] Error leyendo archivo:', error);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
        return;
        
      case '/mcp/write_file':
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        
        if (!verifyMCPSecret(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid MCP secret' }));
          return;
        }
        
        try {
          const { filePath, content } = parsedBody;
          
          if (!filePath || content === undefined) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File path and content required' }));
            return;
          }
          
          console.log(`💾 [MCP] Escribiendo archivo: ${filePath}`);
          
          await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
          await fsPromises.writeFile(filePath, content, 'utf-8');
          
          console.log(`✅ [MCP] Archivo escrito exitosamente`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            path: filePath,
            size: content.length
          }));
        } catch (error) {
          console.error('❌ [MCP] Error escribiendo archivo:', error);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
        return;
        
      case '/mcp/list_files':
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        
        if (!verifyMCPSecret(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid MCP secret' }));
          return;
        }
        
        try {
          const { dirPath = '.' } = parsedBody;
          
          console.log(`📂 [MCP] Listando directorio: ${dirPath}`);
          
          const items = await fsPromises.readdir(dirPath, { withFileTypes: true });
          
          const files = items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file',
            path: path.join(dirPath, item.name)
          }));
          
          console.log(`✅ [MCP] ${files.length} items encontrados`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            files: files,
            count: files.length,
            directory: dirPath
          }));
        } catch (error) {
          console.error('❌ [MCP] Error listando directorio:', error);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
        return;
        
      case '/mcp/execute_code':
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        
        if (!verifyMCPSecret(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid MCP secret' }));
          return;
        }
        
        try {
          const { language, code } = parsedBody;
          
          if (!language || !code) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Language and code required' }));
            return;
          }
          
          console.log(`💻 [MCP] Ejecutando código ${language}`);
          
          let command;
          let tempFile;
          
          switch (language.toLowerCase()) {
            case 'python':
              tempFile = path.join(process.env.TEMP || '/tmp', `temp_${Date.now()}.py`);
              await fsPromises.writeFile(tempFile, code);
              command = `python3 ${tempFile}`;
              break;
              
            case 'javascript':
            case 'js':
              tempFile = path.join(process.env.TEMP || '/tmp', `temp_${Date.now()}.js`);
              await fsPromises.writeFile(tempFile, code);
              command = `node ${tempFile}`;
              break;
              
            case 'bash':
            case 'sh':
              command = code;
              break;
              
            default:
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: `Language ${language} not supported`
              }));
              return;
          }
          
          exec(command, { timeout: 10000 }, async (error, stdout, stderr) => {
            if (tempFile) {
              try {
                await fsPromises.unlink(tempFile);
              } catch (e) {}
            }
            
            if (error) {
              console.error(`❌ [MCP] Error ejecutando código:`, error);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: error.message,
                stderr: stderr
              }));
            } else {
              console.log(`✅ [MCP] Código ejecutado exitosamente`);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                output: stdout,
                stderr: stderr,
                language: language
              }));
            }
          });
        } catch (error) {
          console.error('❌ [MCP] Error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
        return;
        
      case '/mcp/status':
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'active',
          version: '1.0.0',
          endpoints: [
            '/mcp/execute_command',
            '/mcp/read_file',
            '/mcp/write_file',
            '/mcp/list_files',
            '/mcp/execute_code'
          ],
          capabilities: {
            execute: true,
            fileSystem: true,
            code: true
          }
        }));
        return;
        
      default:
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `MCP endpoint '${pathname}' not found` }));
        return;
    }
  }

  // Si es una petición a /api, manejar como API original
  if (pathname.startsWith('/api/')) {
    try {
      let endpoint = pathname;
      endpoint = endpoint.split('?')[0];
      endpoint = endpoint.replace(/^\/api\//, '').replace(/^\/|\/$/g, '');

      const contentType = req.headers['content-type'] || '';
      let parsedBody = null;
      let rawBody = null;

      if (req.method === 'POST') {
        rawBody = await getRawBody(req);
        
        if (contentType.includes('application/json')) {
          try {
            parsedBody = JSON.parse(rawBody.toString('utf8'));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Invalid JSON: ${error.message}` }));
            return;
          }
        }
      }

      if (req.method === 'POST') {
        switch (endpoint) {
          case 'sandra/transcribe':
            if (!parsedBody || !parsedBody.audio) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing audio in request body' }));
              return;
            }
            
            try {
              const transcript = await transcribeAudio(parsedBody.audio);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ transcript }));
            } catch (error) {
              console.error('❌ Error transcribiendo:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message }));
            }
            return;
            
          case 'sandra/chat':
            if (!parsedBody || !parsedBody.message) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing message in request body' }));
              return;
            }
            
            const chatBody = parsedBody;
            const role = 'luxury';
            console.log('📨 Mensaje recibido:', chatBody.message);
            console.log('🎭 Rol:', role);
            
            try {
              const reply = await orchestrator.generateResponse(chatBody.message, role);
              console.log('✅ Respuesta generada:', reply.substring(0, 50) + '...');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ reply }));
            } catch (error) {
              console.error('❌ Error en chat:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message }));
            }
            return;

          case 'sandra/voice':
            if (!parsedBody || !parsedBody.text) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing text in request body' }));
              return;
            }
            
            const voiceBody = parsedBody;
            try {
              const audioBase64 = await orchestrator.generateVoice(voiceBody.text, voiceBody.voiceId);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ audioContent: audioBase64 }));
            } catch (error) {
              console.error('❌ Error en voice:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message }));
            }
            return;

          default:
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Endpoint '${endpoint}' not found` }));
            return;
        }
      }

      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));

    } catch (error) {
      console.error('❌ Server Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || "Internal Server Error" }));
    }
    return;
  }

  // Servir archivos estáticos
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath.replace(/^\//, ''));

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.json': 'application/json',
      '.svg': 'image/svg+xml'
    }[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

const PORT = process.env.PORT || 4040;

// Función para transcribir audio con Deepgram
async function transcribeAudio(audioBase64) {
  return new Promise((resolve, reject) => {
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    
    if (!DEEPGRAM_API_KEY) {
      reject(new Error('Deepgram API Key no configurada'));
      return;
    }
    
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    if (audioBuffer.length === 0) {
      reject(new Error('Audio buffer vacío'));
      return;
    }
    
    const options = {
      hostname: 'api.deepgram.com',
      path: '/v1/listen?model=nova-2&language=es&punctuate=true&smart_format=true',
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
        'Content-Length': audioBuffer.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Deepgram Error: ${res.statusCode} - ${data.substring(0, 200)}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          const transcript = json.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
          if (transcript) {
            resolve(transcript);
          } else {
            reject(new Error('No se pudo transcribir el audio'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(audioBuffer);
    req.end();
  });
}

server.listen(PORT, () => {
  console.log(`🚀 Servidor Galaxy + MCP corriendo en puerto ${PORT}`);
  console.log(`📡 API Chat: http://localhost:${PORT}/api/sandra/chat`);
  console.log(`🎤 API Voice: http://localhost:${PORT}/api/sandra/voice`);
  console.log(`🎙️ API Transcribe: http://localhost:${PORT}/api/sandra/transcribe`);
  console.log('');
  console.log('🤖 MCP ENDPOINTS ACTIVOS:');
  console.log(`   ✅ POST /mcp/execute_command`);
  console.log(`   ✅ POST /mcp/read_file`);
  console.log(`   ✅ POST /mcp/write_file`);
  console.log(`   ✅ POST /mcp/list_files`);
  console.log(`   ✅ POST /mcp/execute_code`);
  console.log(`   ✅ GET  /mcp/status`);
  console.log('');
  console.log(`🌐 PWA: http://localhost:${PORT}`);
  console.log(`💓 Health: http://localhost:${PORT}/health`);
  console.log('');
  console.log('✨ Sandra IA 8.0 Pro - Ready to Execute!');
});
