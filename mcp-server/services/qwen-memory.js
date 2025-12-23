/**
 * QWEN Memory Service - Memoria Persistente con Neon DB
 * Almacena conversaciones, contexto y preferencias del usuario
 */

const { Pool } = require('pg');

class QwenMemory {
    constructor(options = {}) {
        // Conexión a Neon DB
        this.pool = new Pool({
            connectionString: options.connectionString || process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        this.tableName = options.tableName || 'qwen_memory';
        this.maxHistorySize = options.maxHistorySize || 50; // Máximo de mensajes por usuario
        this.initialized = false;
    }

    /**
     * Inicializar tablas si no existen
     */
    async initialize() {
        if (this.initialized) return;

        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        session_id VARCHAR(255),
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        model VARCHAR(100),
        tool_calls JSONB,
        tool_results JSONB,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_user_id ON ${this.tableName}(user_id);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_session_id ON ${this.tableName}(session_id);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_created_at ON ${this.tableName}(created_at DESC);
      
      -- Tabla para preferencias de usuario
      CREATE TABLE IF NOT EXISTS ${this.tableName}_preferences (
        user_id VARCHAR(255) PRIMARY KEY,
        default_model VARCHAR(100) DEFAULT 'qwen-main',
        language VARCHAR(10) DEFAULT 'es',
        mcp_enabled BOOLEAN DEFAULT true,
        custom_prompt TEXT,
        metadata JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Tabla para contexto de largo plazo
      CREATE TABLE IF NOT EXISTS ${this.tableName}_context (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        context_type VARCHAR(50) NOT NULL,
        context_key VARCHAR(255) NOT NULL,
        context_value TEXT,
        importance INTEGER DEFAULT 5,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, context_type, context_key)
      );
    `;

        try {
            await this.pool.query(createTableSQL);
            this.initialized = true;
            console.log(' [QwenMemory] Tablas inicializadas');
        } catch (error) {
            console.error(' [QwenMemory] Error inicializando tablas:', error);
            throw error;
        }
    }

    /**
     * Guardar mensaje en la memoria
     */
    async saveMessage(userId, role, content, options = {}) {
        await this.initialize();

        const { sessionId, model, toolCalls, toolResults, metadata } = options;

        const sql = `
      INSERT INTO ${this.tableName} 
      (user_id, session_id, role, content, model, tool_calls, tool_results, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

        try {
            const result = await this.pool.query(sql, [
                userId,
                sessionId || null,
                role,
                content,
                model || null,
                toolCalls ? JSON.stringify(toolCalls) : null,
                toolResults ? JSON.stringify(toolResults) : null,
                metadata ? JSON.stringify(metadata) : null
            ]);

            // Limpiar mensajes antiguos si excede el límite
            await this.pruneOldMessages(userId);

            return result.rows[0].id;
        } catch (error) {
            console.error(' [QwenMemory] Error guardando mensaje:', error);
            throw error;
        }
    }

    /**
     * Obtener historial de conversación
     */
    async getHistory(userId, options = {}) {
        await this.initialize();

        const { limit = 20, sessionId = null, includeTools = false } = options;

        let sql = `
      SELECT id, role, content, model, created_at
      ${includeTools ? ', tool_calls, tool_results' : ''}
      FROM ${this.tableName}
      WHERE user_id = $1
      ${sessionId ? 'AND session_id = $2' : ''}
      ORDER BY created_at DESC
      LIMIT $${sessionId ? 3 : 2}
    `;

        const params = sessionId ? [userId, sessionId, limit] : [userId, limit];

        try {
            const result = await this.pool.query(sql, params);
            // Invertir para orden cronológico
            return result.rows.reverse().map(row => ({
                role: row.role,
                content: row.content,
                ...(includeTools && row.tool_calls ? { toolCalls: row.tool_calls } : {}),
                ...(includeTools && row.tool_results ? { toolResults: row.tool_results } : {})
            }));
        } catch (error) {
            console.error(' [QwenMemory] Error obteniendo historial:', error);
            return [];
        }
    }

    /**
     * Limpiar mensajes antiguos
     */
    async pruneOldMessages(userId) {
        const sql = `
      DELETE FROM ${this.tableName}
      WHERE user_id = $1 
      AND id NOT IN (
        SELECT id FROM ${this.tableName}
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      )
    `;

        try {
            await this.pool.query(sql, [userId, this.maxHistorySize]);
        } catch (error) {
            console.error(' [QwenMemory] Error limpiando mensajes:', error);
        }
    }

    /**
     * Guardar contexto de largo plazo
     */
    async saveContext(userId, contextType, contextKey, contextValue, options = {}) {
        await this.initialize();

        const { importance = 5, expiresAt = null } = options;

        const sql = `
      INSERT INTO ${this.tableName}_context 
      (user_id, context_type, context_key, context_value, importance, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, context_type, context_key)
      DO UPDATE SET 
        context_value = EXCLUDED.context_value,
        importance = EXCLUDED.importance,
        expires_at = EXCLUDED.expires_at,
        created_at = CURRENT_TIMESTAMP
      RETURNING id
    `;

        try {
            const result = await this.pool.query(sql, [
                userId, contextType, contextKey, contextValue, importance, expiresAt
            ]);
            return result.rows[0].id;
        } catch (error) {
            console.error(' [QwenMemory] Error guardando contexto:', error);
            throw error;
        }
    }

    /**
     * Obtener contexto del usuario
     */
    async getContext(userId, contextType = null) {
        await this.initialize();

        let sql = `
      SELECT context_type, context_key, context_value, importance
      FROM ${this.tableName}_context
      WHERE user_id = $1
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ${contextType ? 'AND context_type = $2' : ''}
      ORDER BY importance DESC, created_at DESC
    `;

        const params = contextType ? [userId, contextType] : [userId];

        try {
            const result = await this.pool.query(sql, params);
            return result.rows;
        } catch (error) {
            console.error(' [QwenMemory] Error obteniendo contexto:', error);
            return [];
        }
    }

    /**
     * Guardar preferencias de usuario
     */
    async savePreferences(userId, preferences) {
        await this.initialize();

        const { defaultModel, language, mcpEnabled, customPrompt, metadata } = preferences;

        const sql = `
      INSERT INTO ${this.tableName}_preferences 
      (user_id, default_model, language, mcp_enabled, custom_prompt, metadata, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET 
        default_model = COALESCE(EXCLUDED.default_model, ${this.tableName}_preferences.default_model),
        language = COALESCE(EXCLUDED.language, ${this.tableName}_preferences.language),
        mcp_enabled = COALESCE(EXCLUDED.mcp_enabled, ${this.tableName}_preferences.mcp_enabled),
        custom_prompt = COALESCE(EXCLUDED.custom_prompt, ${this.tableName}_preferences.custom_prompt),
        metadata = COALESCE(EXCLUDED.metadata, ${this.tableName}_preferences.metadata),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

        try {
            const result = await this.pool.query(sql, [
                userId,
                defaultModel || null,
                language || null,
                mcpEnabled,
                customPrompt || null,
                metadata ? JSON.stringify(metadata) : null
            ]);
            return result.rows[0];
        } catch (error) {
            console.error(' [QwenMemory] Error guardando preferencias:', error);
            throw error;
        }
    }

    /**
     * Obtener preferencias de usuario
     */
    async getPreferences(userId) {
        await this.initialize();

        const sql = `
      SELECT * FROM ${this.tableName}_preferences WHERE user_id = $1
    `;

        try {
            const result = await this.pool.query(sql, [userId]);
            return result.rows[0] || {
                user_id: userId,
                default_model: 'qwen-main',
                language: 'es',
                mcp_enabled: true,
                custom_prompt: null,
                metadata: null
            };
        } catch (error) {
            console.error(' [QwenMemory] Error obteniendo preferencias:', error);
            return null;
        }
    }

    /**
     * Construir prompt con memoria
     */
    async buildMemoryPrompt(userId, options = {}) {
        const { maxContextItems = 5, maxHistoryItems = 10 } = options;

        // Obtener preferencias
        const prefs = await this.getPreferences(userId);

        // Obtener contexto importante
        const context = await this.getContext(userId);
        const topContext = context.slice(0, maxContextItems);

        // Obtener historial reciente
        const history = await this.getHistory(userId, { limit: maxHistoryItems });

        // Construir prompt de memoria
        let memoryPrompt = '';

        // Añadir contexto de largo plazo
        if (topContext.length > 0) {
            memoryPrompt += '\n\n## CONTEXTO RECORDADO:\n';
            topContext.forEach(ctx => {
                memoryPrompt += `- [${ctx.context_type}] ${ctx.context_key}: ${ctx.context_value}\n`;
            });
        }

        // Añadir preferencias personalizadas
        if (prefs && prefs.custom_prompt) {
            memoryPrompt += `\n\n## INSTRUCCIONES PERSONALIZADAS:\n${prefs.custom_prompt}\n`;
        }

        return {
            memoryPrompt,
            history,
            preferences: prefs
        };
    }

    /**
     * Cerrar conexión
     */
    async close() {
        await this.pool.end();
    }
}

module.exports = QwenMemory;
