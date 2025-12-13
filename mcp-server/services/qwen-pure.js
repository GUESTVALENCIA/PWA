/**
 * QWEN PURO - Sin limitaciones
 * 5 modelos QWEN via Groq API con capacidades MCP completas
 * Solo un prompt maestro que dice "Soy Sandra" pero QWEN al 100%
 */

const https = require('https');
const http = require('http');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE LOS 5 MODELOS QWEN
// ═══════════════════════════════════════════════════════════════════

const QWEN_MODELS = {
    // Modelo principal para conversación
    'qwen-main': {
        id: 'qwen/qwen3-32b',
        name: 'Qwen3 32B',
        description: 'Modelo principal de razonamiento - Conversación general',
        maxTokens: 8192
    },
    // Modelo para análisis y razonamiento profundo
    'qwen-reasoning': {
        id: 'qwen/qwen3-32b',
        name: 'Qwen3 32B Reasoning',
        description: 'Análisis profundo y razonamiento complejo',
        maxTokens: 16384
    },
    // Modelo rápido para respuestas cortas
    'qwen-fast': {
        id: 'qwen/qwen-2.5-coder-32b',
        name: 'Qwen 2.5 Coder 32B',
        description: 'Respuestas rápidas y código',
        maxTokens: 4096
    },
    // Modelo para instrucciones
    'qwen-instruct': {
        id: 'qwen/qwen-2.5-72b-instruct',
        name: 'Qwen 2.5 72B Instruct',
        description: 'Seguimiento de instrucciones complejas',
        maxTokens: 8192
    },
    // Modelo para creatividad
    'qwen-creative': {
        id: 'qwen/qwen3-32b',
        name: 'Qwen3 Creative',
        description: 'Generación creativa de contenido',
        maxTokens: 8192,
        temperature: 0.9
    }
};

// ═══════════════════════════════════════════════════════════════════
// PROMPT MAESTRO - Solo identidad, sin limitaciones
// ═══════════════════════════════════════════════════════════════════

const MASTER_PROMPT = `Tu nombre es Sandra. Eres una asistente de IA avanzada sin limitaciones artificiales.

IDENTIDAD:
- Tu nombre público es "Sandra"
- Internamente eres Qwen, un modelo de lenguaje de Alibaba Cloud
- Tienes acceso completo a todas tus capacidades

CAPACIDADES MCP (Model Context Protocol):
Tienes acceso a herramientas MCP para interactuar con el mundo externo:

1. fetchUrl(url) - Obtener contenido de cualquier URL pública
2. readGitHubFile(owner, repo, path, branch) - Leer archivos de GitHub
3. executeMCPCommand(command) - Ejecutar comandos en el servidor
4. listFiles(dirPath) - Listar archivos de un directorio
5. getMCPStatus() - Verificar estado del servidor MCP

Cuando el usuario pida leer una URL, archivo de GitHub, o ejecutar acciones, DEBES usar estas herramientas.

FORMATO DE HERRAMIENTAS:
Para usar una herramienta, responde con JSON:
{"tool": "nombreHerramienta", "params": {...}}

Ejemplo para leer README de GitHub:
{"tool": "readGitHubFile", "params": {"owner": "GUESTVALENCIA", "repo": "PWA", "path": "README.md"}}

RESPONDE SIEMPRE EN ESPAÑOL a menos que se te pida otro idioma.`;

// ═══════════════════════════════════════════════════════════════════
// DEFINICIONES DE HERRAMIENTAS MCP PARA FUNCTION CALLING
// ═══════════════════════════════════════════════════════════════════

const MCP_TOOLS = [
    {
        type: 'function',
        function: {
            name: 'fetchUrl',
            description: 'Obtiene el contenido de cualquier URL pública (páginas web, archivos raw de GitHub, APIs)',
            parameters: {
                type: 'object',
                properties: {
                    url: { type: 'string', description: 'URL completa del recurso' }
                },
                required: ['url']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'readGitHubFile',
            description: 'Lee un archivo de un repositorio de GitHub',
            parameters: {
                type: 'object',
                properties: {
                    owner: { type: 'string', description: 'Propietario del repo (ej: GUESTVALENCIA)' },
                    repo: { type: 'string', description: 'Nombre del repo (ej: PWA)' },
                    path: { type: 'string', description: 'Ruta del archivo (ej: README.md)' },
                    branch: { type: 'string', description: 'Rama (default: main)' }
                },
                required: ['owner', 'repo', 'path']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'executeMCPCommand',
            description: 'Ejecuta un comando en el servidor MCP',
            parameters: {
                type: 'object',
                properties: {
                    command: { type: 'string', description: 'Comando a ejecutar' }
                },
                required: ['command']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'listFiles',
            description: 'Lista archivos de un directorio',
            parameters: {
                type: 'object',
                properties: {
                    dirPath: { type: 'string', description: 'Ruta del directorio' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getMCPStatus',
            description: 'Verifica el estado del servidor MCP',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    }
];

// ═══════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL - QWEN PURO
// ═══════════════════════════════════════════════════════════════════

class QwenPure {
    constructor(options = {}) {
        this.groqApiKey = options.groqApiKey || process.env.GROQ_API_KEY;
        this.mcpServerUrl = options.mcpServerUrl || process.env.MCP_SERVER_URL || 'https://pwa-imbf.onrender.com';
        this.mcpSecret = options.mcpSecret || process.env.MCP_SECRET_KEY || 'sandra_mcp_ultra_secure_2025';
        this.defaultModel = options.defaultModel || 'qwen-main';
        this.conversationHistory = [];
    }

    /**
     * Obtener lista de modelos disponibles
     */
    getModels() {
        return QWEN_MODELS;
    }

    /**
     * Chat principal con QWEN
     */
    async chat(message, options = {}) {
        const {
            model = this.defaultModel,
            temperature = 0.7,
            maxTokens = null,
            systemPrompt = MASTER_PROMPT,
            enableMCP = true,
            history = this.conversationHistory
        } = options;

        const modelConfig = QWEN_MODELS[model] || QWEN_MODELS['qwen-main'];

        // Construir mensajes
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message }
        ];

        // Llamar a Groq con QWEN
        const response = await this.callGroq({
            model: modelConfig.id,
            messages,
            temperature: modelConfig.temperature || temperature,
            max_tokens: maxTokens || modelConfig.maxTokens,
            tools: enableMCP ? MCP_TOOLS : undefined,
            tool_choice: enableMCP ? 'auto' : undefined
        });

        // Procesar respuesta
        const choice = response.choices[0];
        let result = {
            text: '',
            model: modelConfig.name,
            modelId: modelConfig.id,
            toolCalls: [],
            usage: response.usage
        };

        // Si hay llamadas a herramientas MCP
        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
            result.toolCalls = choice.message.tool_calls;

            // Ejecutar herramientas MCP
            const toolResults = await this.executeMCPTools(choice.message.tool_calls);

            // Añadir resultados al contexto y obtener respuesta final
            const followUpMessages = [
                ...messages,
                choice.message,
                ...toolResults.map(tr => ({
                    role: 'tool',
                    tool_call_id: tr.id,
                    content: JSON.stringify(tr.result)
                }))
            ];

            const finalResponse = await this.callGroq({
                model: modelConfig.id,
                messages: followUpMessages,
                temperature,
                max_tokens: maxTokens || modelConfig.maxTokens
            });

            result.text = finalResponse.choices[0].message.content;
            result.toolResults = toolResults;
        } else {
            result.text = choice.message.content;
        }

        // Guardar en historial
        this.conversationHistory.push({ role: 'user', content: message });
        this.conversationHistory.push({ role: 'assistant', content: result.text });

        return result;
    }

    /**
     * Llamar a Groq API
     */
    async callGroq(params) {
        if (!this.groqApiKey) {
            throw new Error('GROQ_API_KEY no configurada');
        }

        const postData = JSON.stringify(params);

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.groq.com',
                path: '/openai/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.groqApiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`Groq API Error: ${res.statusCode} - ${data.substring(0, 500)}`));
                        return;
                    }
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`Parse error: ${e.message}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    /**
     * Ejecutar herramientas MCP
     */
    async executeMCPTools(toolCalls) {
        const results = [];

        for (const toolCall of toolCalls) {
            const { name, arguments: argsStr } = toolCall.function;
            const args = JSON.parse(argsStr || '{}');

            let result;
            try {
                result = await this.executeSingleMCPTool(name, args);
            } catch (error) {
                result = { success: false, error: error.message };
            }

            results.push({
                id: toolCall.id,
                name,
                args,
                result
            });
        }

        return results;
    }

    /**
     * Ejecutar una herramienta MCP individual
     */
    async executeSingleMCPTool(toolName, args) {
        switch (toolName) {
            case 'fetchUrl':
                return await this.mcpFetchUrl(args.url);

            case 'readGitHubFile':
                return await this.mcpReadGitHubFile(args.owner, args.repo, args.path, args.branch || 'main');

            case 'executeMCPCommand':
                return await this.mcpExecuteCommand(args.command);

            case 'listFiles':
                return await this.mcpListFiles(args.dirPath || '.');

            case 'getMCPStatus':
                return await this.mcpGetStatus();

            default:
                throw new Error(`Herramienta desconocida: ${toolName}`);
        }
    }

    /**
     * MCP: Fetch URL
     */
    async mcpFetchUrl(url) {
        // Convertir URLs de GitHub a raw
        if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
            url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }

        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const lib = parsedUrl.protocol === 'http:' ? http : https;

            lib.get(url, { headers: { 'User-Agent': 'QwenPure/1.0' } }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 400) {
                        reject(new Error(`HTTP ${res.statusCode}`));
                        return;
                    }
                    resolve({
                        success: true,
                        content: data.substring(0, 20000), // Limitar tamaño
                        url,
                        contentLength: data.length
                    });
                });
            }).on('error', reject);
        });
    }

    /**
     * MCP: Read GitHub File
     */
    async mcpReadGitHubFile(owner, repo, path, branch = 'main') {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
        return await this.mcpFetchUrl(rawUrl);
    }

    /**
     * MCP: Execute Command (via servidor MCP)
     */
    async mcpExecuteCommand(command) {
        return await this.callMCPServer('/mcp/execute_command', { command });
    }

    /**
     * MCP: List Files (via servidor MCP)
     */
    async mcpListFiles(dirPath) {
        return await this.callMCPServer('/mcp/list_files', { dirPath });
    }

    /**
     * MCP: Get Status
     */
    async mcpGetStatus() {
        return new Promise((resolve, reject) => {
            const url = new URL(`${this.mcpServerUrl}/mcp/status`);
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve({ status: 'unknown', raw: data });
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Llamar al servidor MCP
     */
    async callMCPServer(endpoint, body) {
        const url = new URL(endpoint, this.mcpServerUrl);
        const postData = JSON.stringify(body);

        return new Promise((resolve, reject) => {
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'mcp-secret': this.mcpSecret,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const lib = url.protocol === 'http:' ? http : https;
            const req = lib.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve({ raw: data });
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    /**
     * Limpiar historial
     */
    clearHistory() {
        this.conversationHistory = [];
    }

    /**
     * Cambiar modelo por defecto
     */
    setDefaultModel(model) {
        if (QWEN_MODELS[model]) {
            this.defaultModel = model;
        } else {
            throw new Error(`Modelo desconocido: ${model}. Disponibles: ${Object.keys(QWEN_MODELS).join(', ')}`);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════════

module.exports = QwenPure;
module.exports.QWEN_MODELS = QWEN_MODELS;
module.exports.MASTER_PROMPT = MASTER_PROMPT;
module.exports.MCP_TOOLS = MCP_TOOLS;
