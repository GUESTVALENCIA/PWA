// server-mcp.js

// Servidor MCP para Bastanteo / Sandra IA

// Protocolo: JSON-RPC 2.0 sobre HTTP, endpoint /mcp, puerto 4042

const http = require('http');
const https = require('https');
const url = require('url');
const { randomUUID } = require('crypto');
require('dotenv').config();

// === CONFIGURACIÓN BÁSICA ===

const PORT = process.env.BASTANTEO_MCP_PORT || 4042;
const MCP_API_KEY = process.env.BASTANTEO_MCP_API_KEY || '';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY || '';
const CARTESIA_VOICE_ID = process.env.CARTESIA_VOICE_ID || '';

// Aviso en consola si no hay API key (sólo debería pasar en local)
if (!MCP_API_KEY) {
  console.warn(
    '⚠️  BASTANTEO_MCP_API_KEY no está definida. ' +
      'En producción debes configurarla para proteger el servidor MCP.'
  );
}

// === ORQUESTADOR (basado en server.js actual) ===

const GLOBAL_CONVERSATION_RULES = `
REGLAS CONVERSACIONALES GLOBALES (Sandra IA 8.0 Pro):
- IMPORTANTE: Sandra SÍ puede realizar llamadas de voz conversacionales en tiempo real.
  Cuando un usuario solicite "llamada de voz", "llamada conversacional" o "hablar contigo",
  debes ofrecerle amablemente esta opción. NO es una videollamada, es una llamada de voz
  en tiempo real con audio bidireccional.
- Responde SIEMPRE en español neutro, con buena ortografía y gramática.
- Usa párrafos cortos y bien separados.
- Actúa como una experta en Hospitalidad y Turismo para Guests Valencia.
- Si te preguntan por disponibilidad, ofrece revisar datos en tiempo real.
- Brevedad estricta: máximo 4 frases salvo que se pida detalle.
`;

class AIOrchestrator {
  constructor() {
    this.providers = {
      gemini: {
        hostname: 'generativelanguage.googleapis.com',
        path: '/v1beta/models/gemini-2.5-flash:generateContent',
        model: 'gemini-2.5-flash'
      },
      cartesia: {
        hostname: 'api.cartesia.ai',
        path: '/tts/bytes',
        model: 'sonic-multilingual',
        defaultVoice: CARTESIA_VOICE_ID
      }
    };
  }

  async generateResponse(shortPrompt, context = 'luxury') {
    const fullSystemPrompt = `${GLOBAL_CONVERSATION_RULES}\nRole: ${context}`;
    console.log('🧠 [Orchestrator] Generando respuesta con Gemini (contexto: %s)', context);

    const fullPrompt = `${fullSystemPrompt}\n\nUser: ${shortPrompt}`;
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }]
    });

    return new Promise((resolve, reject) => {
      if (!GEMINI_API_KEY) {
        return reject(new Error('GEMINI_API_KEY no configurada'));
      }

      const options = {
        hostname: this.providers.gemini.hostname,
        path: `${this.providers.gemini.path}?key=${encodeURIComponent(GEMINI_API_KEY)}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            console.error('❌ Gemini API Error:', res.statusCode, data.substring(0, 200));
            return reject(
              new Error(`Gemini API Error: ${res.statusCode} - ${data.substring(0, 200)}`)
            );
          }

          try {
            const jsonData = JSON.parse(data);
            const candidate = jsonData.candidates?.[0];
            const text = candidate?.content?.parts?.[0]?.text;

            if (!text || typeof text !== 'string') {
              return reject(new Error('Respuesta de Gemini inválida o vacía'));
            }

            console.log('✅ [Orchestrator] Respuesta Gemini OK');
            resolve(text);
          } catch (err) {
            reject(new Error('Error parseando respuesta de Gemini: ' + err.message));
          }
        });
      });

      req.on('error', err => {
        reject(new Error('Error en petición a Gemini: ' + err.message));
      });

      req.write(postData);
      req.end();
    });
  }
}

const orchestrator = new AIOrchestrator();

// === GESTIÓN DE SESIONES EN MEMORIA ===

/**
 * sessions: Map<sessionId, {
 *   id,
 *   userId,
 *   locale,
 *   llmBackend,
 *   context,
 *   history: [{ role: 'user'|'assistant', content: string, ts: number }],
 *   createdAt,
 *   updatedAt,
 *   active: boolean
 * }>
 */
const sessions = new Map();

// Configuración LLM (simple, en memoria)
const llmConfig = {
  global: {
    primary_llm: 'gemini-2.5-flash',
    fallback_llms: ['gpt-4o']
  },
  tenants: {},
  sessions: {}
};

// === DEFINICIÓN DE TOOLS PARA MCP ===

const MCP_TOOLS = [
  // Coinciden con el JSON de diseño que nos dio Cursor
  {
    name: 'bastanteo_start_session',
    description:
      'Crea una nueva sesión de conversación en Bastanteo. La sesión mantiene historial y contexto.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
        locale: { type: 'string', default: 'es-ES' },
        llm_backend: {
          type: 'string',
          enum: ['gpt-4o', 'gemini-2.5-flash', 'groq', 'auto'],
          default: 'auto'
        },
        context: {
          type: 'string',
          description: "Contexto/rol ('luxury', etc.)",
          default: 'luxury'
        }
      },
      required: []
    }
  },
  {
    name: 'bastanteo_send_message',
    description: 'Envía un mensaje a una sesión activa y devuelve la respuesta de Sandra.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        message: { type: 'string' },
        metadata: { type: 'object' }
      },
      required: ['session_id', 'message']
    }
  },
  {
    name: 'bastanteo_get_session_state',
    description: 'Devuelve el estado completo de una sesión.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' }
      },
      required: ['session_id']
    }
  },
  {
    name: 'bastanteo_end_session',
    description: 'Cierra una sesión. Opcionalmente mantiene historial.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        keep_history: { type: 'boolean', default: false }
      },
      required: ['session_id']
    }
  },
  {
    name: 'bastanteo_configure_llms',
    description:
      'Configura qué modelos LLM se usan (global, tenant o sesión). De momento se guarda en memoria.',
    inputSchema: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['global', 'tenant', 'session'],
          default: 'global'
        },
        target_id: { type: 'string' },
        primary_llm: {
          type: 'string',
          enum: ['gpt-4o', 'gemini-2.5-flash', 'groq'],
          default: 'gemini-2.5-flash'
        },
        fallback_llms: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['gpt-4o', 'gemini-2.5-flash', 'groq']
          },
          default: ['gpt-4o']
        }
      },
      required: ['scope']
    }
  },
  {
    name: 'bastanteo_list_sessions',
    description: 'Lista sesiones activas o recientes (solo memoria local).',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
        active_only: { type: 'boolean', default: true },
        limit: { type: 'integer', minimum: 1, maximum: 500, default: 50 }
      },
      required: []
    }
  }
];

// === UTILIDADES ===

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function makeJsonRpcError(id, code, message, data) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code,
      message,
      data
    }
  };
}

// === IMPLEMENTACIÓN DE LAS TOOLS ===

async function tool_startSession(args) {
  const sessionId = randomUUID();
  const now = Date.now();
  const session = {
    id: sessionId,
    userId: args.user_id || `anon-${sessionId.slice(0, 8)}`,
    locale: args.locale || 'es-ES',
    llmBackend: args.llm_backend || 'auto',
    context: args.context || 'luxury',
    history: [],
    createdAt: now,
    updatedAt: now,
    active: true
  };

  sessions.set(sessionId, session);

  return {
    session_id: sessionId,
    user_id: session.userId,
    locale: session.locale,
    llm_backend: session.llmBackend,
    context: session.context,
    active: true
  };
}

async function tool_sendMessage(args) {
  const session = sessions.get(args.session_id);
  if (!session) {
    throw new Error(`Sesión no encontrada: ${args.session_id}`);
  }
  if (!session.active) {
    throw new Error(`Sesión ${args.session_id} está cerrada`);
  }

  const message = String(args.message ?? '');
  if (!message.trim()) {
    throw new Error('Mensaje vacío no permitido');
  }

  const now = Date.now();
  session.history.push({
    role: 'user',
    content: message,
    ts: now
  });

  // Por ahora, siempre usamos Gemini (respeta contexto "luxury")
  const reply = await orchestrator.generateResponse(message, session.context);

  session.history.push({
    role: 'assistant',
    content: reply,
    ts: Date.now()
  });

  session.updatedAt = Date.now();

  return {
    session_id: session.id,
    reply,
    backend_used: 'gemini-2.5-flash',
    message_count: session.history.length
  };
}

async function tool_getSessionState(args) {
  const session = sessions.get(args.session_id);
  if (!session) {
    throw new Error(`Sesión no encontrada: ${args.session_id}`);
  }

  // No devolvemos TODO el historial si creciera mucho; lo dejamos tal cual de momento
  return {
    ...session
  };
}

async function tool_endSession(args) {
  const session = sessions.get(args.session_id);
  if (!session) {
    throw new Error(`Sesión no encontrada: ${args.session_id}`);
  }

  session.active = false;
  session.updatedAt = Date.now();

  if (!args.keep_history) {
    sessions.delete(args.session_id);
    return {
      session_id: args.session_id,
      status: 'deleted'
    };
  }

  return {
    session_id: args.session_id,
    status: 'closed_kept_history'
  };
}

async function tool_configureLlms(args) {
  const { scope, target_id, primary_llm, fallback_llms } = args;

  switch (scope) {
    case 'global':
      llmConfig.global = {
        primary_llm: primary_llm || llmConfig.global.primary_llm,
        fallback_llms: fallback_llms || llmConfig.global.fallback_llms
      };
      break;

    case 'tenant':
      if (!target_id) throw new Error('target_id requerido para scope=tenant');
      llmConfig.tenants[target_id] = {
        primary_llm: primary_llm || llmConfig.global.primary_llm,
        fallback_llms: fallback_llms || llmConfig.global.fallback_llms
      };
      break;

    case 'session':
      if (!target_id) throw new Error('target_id requerido para scope=session');
      llmConfig.sessions[target_id] = {
        primary_llm: primary_llm || llmConfig.global.primary_llm,
        fallback_llms: fallback_llms || llmConfig.global.fallback_llms
      };
      break;

    default:
      throw new Error(`scope inválido: ${scope}`);
  }

  return {
    scope,
    target_id: target_id || null,
    primary_llm: primary_llm || llmConfig.global.primary_llm,
    fallback_llms: fallback_llms || llmConfig.global.fallback_llms
  };
}

async function tool_listSessions(args) {
  const { user_id, active_only = true, limit = 50 } = args || {};

  const out = [];
  for (const session of sessions.values()) {
    if (user_id && session.userId !== user_id) continue;
    if (active_only && !session.active) continue;

    out.push({
      id: session.id,
      user_id: session.userId,
      active: session.active,
      created_at: session.createdAt,
      updated_at: session.updatedAt,
      locale: session.locale,
      llm_backend: session.llmBackend,
      context: session.context
    });

    if (out.length >= limit) break;
  }

  return {
    sessions: out,
    total: out.length
  };
}

async function runToolByName(name, args) {
  switch (name) {
    case 'bastanteo_start_session':
      return tool_startSession(args || {});

    case 'bastanteo_send_message':
      return tool_sendMessage(args || {});

    case 'bastanteo_get_session_state':
      return tool_getSessionState(args || {});

    case 'bastanteo_end_session':
      return tool_endSession(args || {});

    case 'bastanteo_configure_llms':
      return tool_configureLlms(args || {});

    case 'bastanteo_list_sessions':
      return tool_listSessions(args || {});

    default:
      throw new Error(`Tool no soportada: ${name}`);
  }
}

// === SERVIDOR JSON-RPC / MCP ===

function collectRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // CORS simple por si lo pruebas desde herramientas web
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (parsedUrl.pathname !== '/mcp') {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  // Autenticación por API key (si está configurada)
  const headerApiKey = req.headers['x-api-key'];
  if (MCP_API_KEY && headerApiKey !== MCP_API_KEY) {
    return sendJson(res, 401, {
      error: 'Unauthorized',
      message: 'X-API-Key inválida o ausente'
    });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      error: 'Method Not Allowed',
      message: 'Sólo se admite POST en /mcp'
    });
  }

  let raw;
  try {
    raw = await collectRequestBody(req);
  } catch (err) {
    return sendJson(res, 400, makeJsonRpcError(null, -32700, 'Error leyendo body', err.message));
  }

  let rpc;
  try {
    rpc = JSON.parse(raw);
  } catch (err) {
    return sendJson(
      res,
      400,
      makeJsonRpcError(null, -32700, 'JSON inválido en petición', err.message)
    );
  }

  const { id, method, params } = rpc;

  if (!method || rpc.jsonrpc !== '2.0') {
    return sendJson(
      res,
      400,
      makeJsonRpcError(id, -32600, 'Petición JSON-RPC inválida', { received: rpc })
    );
  }

  try {
    if (method === 'initialize') {
      const result = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'bastanteo-mcp',
          version: '0.1.0'
        }
      };

      return sendJson(res, 200, { jsonrpc: '2.0', id, result });
    }

    if (method === 'tools/list') {
      const result = {
        tools: MCP_TOOLS.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema
        }))
      };

      return sendJson(res, 200, { jsonrpc: '2.0', id, result });
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (!toolName) {
        throw new Error('Falta parámetro params.name en tools/call');
      }

      const toolResult = await runToolByName(toolName, args);

      const result = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(toolResult)
          }
        ]
      };

      return sendJson(res, 200, { jsonrpc: '2.0', id, result });
    }

    // Método no soportado
    return sendJson(
      res,
      400,
      makeJsonRpcError(id, -32601, `Método no soportado: ${method}`, null)
    );
  } catch (err) {
    console.error('❌ Error procesando JSON-RPC:', err);
    return sendJson(
      res,
      500,
      makeJsonRpcError(id, -32603, 'Error interno en servidor MCP', err.message)
    );
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor MCP Bastanteo escuchando en http://localhost:${PORT}/mcp`);
  if (MCP_API_KEY) {
    console.log('🔐 Autenticación por X-API-Key habilitada.');
  } else {
    console.log('⚠️ Autenticación DESHABILITADA (sólo recomendable en local).');
  }
});

