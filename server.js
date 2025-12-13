// Servidor Local para Sistema Galaxy
// Adaptado del api-gateway.js original para Node.js local

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

// Función auxiliar para copiar directorios recursivamente
async function copyDirRecursive(source, destination) {
  await fsPromises.mkdir(destination, { recursive: true });
  const items = await fsPromises.readdir(source, { withFileTypes: true });

  for (const item of items) {
    const srcPath = path.join(source, item.name);
    const destPath = path.join(destination, item.name);

    if (item.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else {
      await fsPromises.copyFile(srcPath, destPath);
    }
  }
}

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

// ═══════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES: GROQ & GITHUB
// ═══════════════════════════════════════════════════════════════════

async function fetchGitHubFile(owner, repo, path, branch = 'main') {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`GitHub Error: ${res.statusCode} - ${url}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function callGroqQwen(apiKey, systemPrompt, userMessage, history = [], modelId = 'qwen-main') {
  // Mapeo de modelos
  const modelMap = {
    'qwen-main': 'qwen-2.5-32b', // Ajustar según disponibilidad real en Groq
    'qwen-fast': 'qwen-2.5-coder-32b',
    'qwen-instruct': 'qwen-2.5-32b', // Fallback seguro
    'qwen-creative': 'qwen-2.5-32b'
  };

  const groqModel = modelMap[modelId] || 'qwen-2.5-32b';

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: userMessage }
  ];

  const postData = JSON.stringify({
    model: groqModel,
    messages: messages,
    temperature: 0.7,
    max_tokens: 4096
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            resolve({
              text: response.choices[0].message.content,
              model: response.model,
              usage: response.usage
            });
          } catch (e) {
            reject(new Error('Invalid JSON from Groq'));
          }
        } else {
          reject(new Error(`Groq API Error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

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

// Global Orchestrator Instance (como en el sistema Galaxy original)
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

  // CORS Headers (como en el sistema Galaxy original)
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
        if (!verifyMCPSecret(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid MCP secret' }));
          return;
        }

        const { command } = parsedBody || {};
        if (!command) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Command required' }));
          return;
        }

        console.log(`⚡ [MCP] Ejecutando comando: ${command}`);
        exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: !error,
            output: stdout || '',
            stderr: stderr || '',
            error: error ? error.message : null
          }));
        });
        return;

      case '/mcp/read_file':
        if (!verifyMCPSecret(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid MCP secret' }));
          return;
        }

        try {
          const { filePath } = parsedBody || {};
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
          console.error(`❌ [MCP] Error leyendo archivo:`, error.message);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
        return;

      case '/mcp/write_file':
        if (!verifyMCPSecret(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid MCP secret' }));
          return;
        }

        try {
          const { filePath: writePath, content: writeContent } = parsedBody || {};
          if (!writePath || writeContent === undefined) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File path and content required' }));
            return;
          }

          console.log(`📝 [MCP] Escribiendo archivo: ${writePath}`);

          // Crear directorio padre si no existe
          const dirPath = path.dirname(writePath);
          await fsPromises.mkdir(dirPath, { recursive: true });

          await fsPromises.writeFile(writePath, writeContent, 'utf-8');

          console.log(`✅ [MCP] Archivo escrito: ${writeContent.length} caracteres`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            path: writePath,
            size: writeContent.length
          }));
        } catch (error) {
          console.error(`❌ [MCP] Error escribiendo archivo:`, error.message);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
        return;

      case '/mcp/list_files':
        if (!verifyMCPSecret(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid MCP secret' }));
          return;
        }

        try {
          const { dirPath = '.' } = parsedBody || {};

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
          console.error(`❌ [MCP] Error listando directorio:`, error.message);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
        return;

      case '/mcp/copy_path':
        if (!verifyMCPSecret(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid MCP secret' }));
          return;
        }

        try {
          const { source, destination } = parsedBody || {};
          if (!source || !destination) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Source and destination paths required' }));
            return;
          }

          console.log(`📋 [MCP] Copiando: ${source} -> ${destination}`);

          // Crear directorio padre si no existe
          const destDir = path.dirname(destination);
          await fsPromises.mkdir(destDir, { recursive: true });

          // Verificar si es directorio o archivo
          const stats = await fsPromises.stat(source);

          if (stats.isDirectory()) {
            // Copiar directorio recursivamente
            await copyDirRecursive(source, destination);
          } else {
            // Copiar archivo
            await fsPromises.copyFile(source, destination);
          }

          console.log(`✅ [MCP] Copiado exitosamente`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            source: source,
            destination: destination
          }));
        } catch (error) {
          console.error(`❌ [MCP] Error copiando:`, error.message);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
        return;

      case '/mcp/status':
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'active',
          version: '2.0.0',
          endpoints: ['/mcp/execute_command', '/mcp/read_file', '/mcp/write_file', '/mcp/list_files', '/mcp/copy_path', '/mcp/status'],
          capabilities: {
            execute: true,
            fileSystem: true,
            copy: true
          }
        }));
        return;

      default:
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `MCP endpoint '${pathname}' not found` }));
        return;
    }
  }

  // Si es una petición a /api, manejar como API
  if (pathname.startsWith('/api/')) {
    try {
      // Extract endpoint from URL (como en el sistema Galaxy original)
      let endpoint = pathname;
      endpoint = endpoint.split('?')[0];
      endpoint = endpoint.replace(/^\/api\//, '').replace(/^\/|\/$/g, '');

      // Parse body based on content type
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
            // Endpoint para transcribir audio con Deepgram
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
            // Siempre usar rol "luxury" (Concierge) como solicitado
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

          // ═══════════════════════════════════════════════════════════════════
          // QWEN PURO - Chat con capacidades MCP
          // ═══════════════════════════════════════════════════════════════════
          case 'qwen/chat':
            if (!parsedBody || !parsedBody.message) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing message in request body' }));
              return;
            }

            try {
              const { message, model = 'qwen-main', enableMCP = true, history = [] } = parsedBody;
              console.log('🔮 [QWEN] Mensaje:', message);
              console.log('🔮 [QWEN] Modelo:', model);

              // Usar GROQ API con QWEN
              const GROQ_API_KEY = process.env.GROQ_API_KEY;
              if (!GROQ_API_KEY) {
                throw new Error('GROQ_API_KEY no configurada');
              }

              // Detectar si necesita leer de GitHub
              let toolResults = [];
              let additionalContext = '';

              if (enableMCP) {
                // Detectar URLs de GitHub o peticiones de lectura
                const githubMatch = message.match(/github\.com\/([^\/]+)\/([^\/\s]+)/i);
                const readmeMatch = message.match(/README|repo(?:sitorio)?.*([A-Za-z0-9_-]+\/[A-Za-z0-9_-]+)/i);

                if (githubMatch || readmeMatch) {
                  let owner, repo, filePath = 'README.md';

                  if (githubMatch) {
                    owner = githubMatch[1];
                    repo = githubMatch[2].replace(/\.git$/, '');
                  } else if (readmeMatch && message.includes('/')) {
                    const parts = message.match(/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)/);
                    if (parts) {
                      owner = parts[1];
                      repo = parts[2];
                    }
                  }

                  if (owner && repo) {
                    console.log(`📖 [MCP] Leyendo ${owner}/${repo}/${filePath}`);
                    try {
                      const githubContent = await fetchGitHubFile(owner, repo, filePath);
                      additionalContext = `\n\n--- CONTENIDO DEL ARCHIVO ${filePath} de ${owner}/${repo} ---\n${githubContent.substring(0, 15000)}\n--- FIN DEL CONTENIDO ---\n`;
                      toolResults.push({
                        tool: 'readGitHubFile',
                        params: { owner, repo, path: filePath },
                        success: true
                      });
                      console.log(`✅ [MCP] Archivo leído: ${githubContent.length} caracteres`);
                    } catch (ghError) {
                      console.error('❌ [MCP] Error leyendo GitHub:', ghError.message);
                      toolResults.push({
                        tool: 'readGitHubFile',
                        params: { owner, repo, path: filePath },
                        success: false,
                        error: ghError.message
                      });
                    }
                  }
                }
              }

              // Prompt del sistema para QWEN
              const qwenSystemPrompt = `Tu nombre es Sandra. Eres una asistente de IA avanzada basada en QWEN sin limitaciones artificiales.
Responde SIEMPRE en español. Eres experta en tecnología, programación y turismo en Valencia.
Cuando uses información de archivos externos, cita la fuente y haz un resumen con tus propias palabras.${additionalContext}`;

              // Llamar a GROQ con QWEN
              const qwenResponse = await callGroqQwen(GROQ_API_KEY, qwenSystemPrompt, message, history, model);

              console.log('✅ [QWEN] Respuesta generada');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                reply: qwenResponse.text,
                model: qwenResponse.model,
                toolResults: toolResults,
                usage: qwenResponse.usage
              }));
            } catch (error) {
              console.error('❌ [QWEN] Error:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message }));
            }
            return;

          case 'qwen/models':
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              models: {
                'qwen-main': { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', description: 'Modelo principal' },
                'qwen-fast': { id: 'qwen/qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder', description: 'Código y respuestas rápidas' },
                'qwen-instruct': { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', description: 'Instrucciones complejas' }
              },
              mcpTools: ['readGitHubFile', 'fetchUrl', 'listFiles', 'getMCPStatus']
            }));
            return;

          case 'github/read':
            // Endpoint directo para leer archivos de GitHub
            try {
              const { owner, repo, path: ghPath = 'README.md', branch = 'main' } = parsedBody || {};
              if (!owner || !repo) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'owner and repo required' }));
                return;
              }

              console.log(`📖 [GitHub] Leyendo ${owner}/${repo}/${ghPath}`);
              const content = await fetchGitHubFile(owner, repo, ghPath, branch);

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                content: content,
                owner, repo, path: ghPath, branch
              }));
            } catch (error) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: error.message }));
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

  // Seguridad: prevenir acceso fuera del directorio
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

// Render usa PORT de variables de entorno, local usa 4040
const PORT = process.env.PORT || 4040;
// Función para transcribir audio con Deepgram (reutilizable)
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
  console.log(`🚀 Servidor Galaxy local corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api/sandra/chat`);
  console.log(`🎤 Voice API disponible en http://localhost:${PORT}/api/sandra/voice`);
  console.log(`🎙️ Transcribe API disponible en http://localhost:${PORT}/api/sandra/transcribe`);
  console.log(`🌐 PWA disponible en http://localhost:${PORT}`);
  console.log(`✨ Sistema Galaxy adaptado para Gemini`);
});
