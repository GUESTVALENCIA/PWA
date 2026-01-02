/**
 * QWEN PURE CLIENT - Cliente JavaScript para QWEN Puro con MCP
 * Se conecta directamente al endpoint /api/qwen/chat
 * 
 * USO:
 * const qwen = new QwenClient();
 * const response = await qwen.chat("Lee el README de GUESTVALENCIA/PWA");
 */

class QwenClient {
    constructor(options = {}) {
        // Detectar URL base automáticamente
        if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
            this.baseUrl = options.baseUrl || 'http://localhost:4040';
        } else {
            this.baseUrl = options.baseUrl || 'https://pwa-imbf.onrender.com';
        }

        this.defaultModel = options.model || 'qwen-main';
        this.enableMCP = options.enableMCP !== false;
        this.history = [];
        this.onMessage = options.onMessage || null;
        this.onToolCall = options.onToolCall || null;
        this.onError = options.onError || null;
    }

    /**
     * Enviar mensaje a QWEN Puro
     * @param {string} message - Mensaje del usuario
     * @param {object} options - Opciones adicionales
     * @returns {Promise<object>} Respuesta de QWEN
     */
    async chat(message, options = {}) {
        const {
            model = this.defaultModel,
            temperature = 0.7,
            enableMCP = this.enableMCP,
            includeHistory = true
        } = options;

        try {
            const response = await fetch(`${this.baseUrl}/api/qwen/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    model,
                    temperature,
                    enableMCP,
                    history: includeHistory ? this.history : []
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

            // Actualizar historial
            this.history.push({ role: 'user', content: message });
            this.history.push({ role: 'assistant', content: data.reply });

            // Callbacks
            if (data.toolCalls && data.toolCalls.length > 0 && this.onToolCall) {
                data.toolCalls.forEach(tc => this.onToolCall(tc));
            }
            if (this.onMessage) {
                this.onMessage(data);
            }

            return data;

        } catch (error) {
            console.error(' [QwenClient] Error:', error);
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }

    /**
     * Obtener modelos disponibles
     * @returns {Promise<object>} Lista de modelos
     */
    async getModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/qwen/models`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(' [QwenClient] Error obteniendo modelos:', error);
            throw error;
        }
    }

    /**
     * Verificar estado del servidor MCP
     * @returns {Promise<object>} Estado del servidor
     */
    async getMCPStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/mcp/status`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(' [QwenClient] Error verificando MCP:', error);
            throw error;
        }
    }

    /**
     * Limpiar historial de conversación
     */
    clearHistory() {
        this.history = [];
    }

    /**
     * Cambiar modelo por defecto
     * @param {string} model - Nombre del modelo
     */
    setModel(model) {
        this.defaultModel = model;
    }

    /**
     * Métodos de conveniencia para operaciones MCP comunes
     */

    async readGitHubFile(owner, repo, path, branch = 'main') {
        return await this.chat(
            `Lee el archivo ${path} del repositorio ${owner}/${repo} (rama ${branch}) y muéstrame su contenido`,
            { enableMCP: true }
        );
    }

    async fetchUrl(url) {
        return await this.chat(
            `Obtén el contenido de la URL: ${url}`,
            { enableMCP: true }
        );
    }

    async summarizeRepo(owner, repo) {
        return await this.chat(
            `Lee el README del repositorio ${owner}/${repo} y hazme un resumen con tus palabras`,
            { enableMCP: true }
        );
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.QwenClient = QwenClient;

    // Crear instancia global lista para usar
    window.qwen = new QwenClient();

    console.log(' [QwenClient] Cliente QWEN Puro cargado');
    console.log('   Uso: await window.qwen.chat("Tu mensaje aquí")');
    console.log('   Modelos: await window.qwen.getModels()');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = QwenClient;
}
