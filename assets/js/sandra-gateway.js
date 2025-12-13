// Sandra Gateway Client - QWEN PURO Edition
// Connects UI to QWEN Pure Backend with MCP capabilities

export class SandraGateway {
    constructor() {
        // Dynamic base URL detection (local vs production)
        if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
            this.baseUrl = 'http://localhost:4040/api';
        } else {
            this.baseUrl = '/api';
        }

        // QWEN Pure configuration
        this.useQwenPure = true; // Usar QWEN Puro por defecto
        this.defaultModel = 'qwen-main';
        this.enableMCP = true;
        this.history = [];
    }

    /**
     * Enviar mensaje - Usa QWEN Puro con MCP
     */
    async sendMessage(message, role = 'hospitality', options = {}) {
        try {
            // Usar QWEN Puro si está habilitado
            if (this.useQwenPure) {
                return await this.sendToQwen(message, options);
            }

            // Fallback al endpoint tradicional
            const response = await fetch(`${this.baseUrl}/sandra/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, role })
            });

            if (!response.ok) throw new Error('Gateway Error');

            const data = await response.json();
            return data.reply;
        } catch (error) {
            console.error('Conversation Error:', error);
            throw error;
        }
    }

    /**
     * Enviar mensaje a QWEN Puro con MCP
     */
    async sendToQwen(message, options = {}) {
        const {
            model = this.defaultModel,
            enableMCP = this.enableMCP,
            temperature = 0.7
        } = options;

        console.log('🔮 [Gateway] Enviando a QWEN Puro:', { message, model, enableMCP });

        try {
            const response = await fetch(`${this.baseUrl}/qwen/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    model,
                    temperature,
                    enableMCP,
                    history: this.history.slice(-10) // Últimos 10 mensajes
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

            // Actualizar historial
            this.history.push({ role: 'user', content: message });
            this.history.push({ role: 'assistant', content: data.reply });

            // Ejecutar herramientas MCP si hay resultados
            if (data.toolResults && data.toolResults.length > 0) {
                console.log('🔧 [Gateway] Herramientas MCP ejecutadas:', data.toolResults);
                // Los resultados ya están incluidos en la respuesta
            }

            console.log('✅ [Gateway] Respuesta QWEN:', {
                model: data.model,
                hasToolCalls: data.toolCalls?.length > 0
            });

            return data.reply;

        } catch (error) {
            console.error('❌ [Gateway] Error QWEN:', error);

            // Fallback al endpoint tradicional si QWEN falla
            console.log('⚠️ [Gateway] Fallback a endpoint tradicional...');
            try {
                const fallbackResponse = await fetch(`${this.baseUrl}/sandra/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, role: 'hospitality' })
                });

                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    return fallbackData.reply;
                }
            } catch (fallbackError) {
                console.error('❌ [Gateway] Fallback también falló:', fallbackError);
            }

            throw error;
        }
    }

    /**
     * Transcribir audio
     */
    async transcribeAudio(audioBlob) {
        let base64Audio;

        // Si es un Blob, convertir a base64
        if (audioBlob instanceof Blob) {
            base64Audio = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(audioBlob);
            });
        } else {
            base64Audio = audioBlob;
        }

        try {
            const response = await fetch(`${this.baseUrl}/sandra/transcribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio: base64Audio })
            });

            if (!response.ok) throw new Error('Transcription Failed');

            const data = await response.json();
            return data.transcript || data.text;
        } catch (error) {
            console.error('STT Error:', error);
            return null;
        }
    }

    /**
     * Sintetizar voz
     */
    async synthesizeSpeech(text, voiceId = 'sandra-v1') {
        try {
            const response = await fetch(`${this.baseUrl}/sandra/voice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voiceId })
            });

            if (!response.ok) throw new Error('Synthesis Failed');

            const data = await response.json();
            return data.audioContent;
        } catch (error) {
            console.error('TTS Error:', error);
            return null;
        }
    }

    /**
     * Obtener modelos QWEN disponibles
     */
    async getQwenModels() {
        try {
            const response = await fetch(`${this.baseUrl}/qwen/models`);
            if (!response.ok) throw new Error('Failed to get models');
            return await response.json();
        } catch (error) {
            console.error('Error getting models:', error);
            return null;
        }
    }

    /**
     * Verificar estado del servidor MCP
     */
    async getMCPStatus() {
        try {
            // Construir URL base sin /api
            const mcpUrl = this.baseUrl.replace('/api', '');
            const response = await fetch(`${mcpUrl}/mcp/status`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('MCP Status Error:', error);
            return null;
        }
    }

    /**
     * Cambiar modelo QWEN
     */
    setModel(model) {
        this.defaultModel = model;
        console.log(`🔄 [Gateway] Modelo cambiado a: ${model}`);
    }

    /**
     * Habilitar/deshabilitar MCP
     */
    setMCPEnabled(enabled) {
        this.enableMCP = enabled;
        console.log(`🔄 [Gateway] MCP ${enabled ? 'habilitado' : 'deshabilitado'}`);
    }

    /**
     * Limpiar historial
     */
    clearHistory() {
        this.history = [];
        console.log('🗑️ [Gateway] Historial limpiado');
    }
}

// También exportar como clase global
if (typeof window !== 'undefined') {
    window.SandraGateway = SandraGateway;
}
