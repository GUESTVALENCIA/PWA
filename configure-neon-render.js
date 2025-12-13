/**
 * Script para configurar NEON_DATABASE_URL en Render
 * Ejecutar: node configure-neon-render.js
 */

const https = require('https');

// Configuración
const RENDER_API_KEY = process.env.RENDER_API_KEY || 'rnd_xxxxxx'; // Tu API key de Render
const RENDER_SERVICE_ID = 'srv-ctjtbkrtq21c73a6k6d0'; // ID del servicio PWA

// URL de Neon DB
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_G2baKCg4FlyN@ep-fragrant-meadow-ah27lbiy-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function makeRenderRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.render.com',
            path: `/v1${path}`,
            method: method,
            headers: {
                'Authorization': `Bearer ${RENDER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data ? JSON.parse(data) : {});
                } else {
                    reject(new Error(`Render API Error: ${res.statusCode} - ${data}`));
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function configureNeonDB() {
    console.log('🔧 Configurando NEON_DATABASE_URL en Render...\n');

    try {
        // Método 1: Intentar actualizar variables de entorno
        console.log('📡 Añadiendo variable de entorno...');

        const envVars = [
            {
                key: 'NEON_DATABASE_URL',
                value: NEON_DATABASE_URL
            }
        ];

        await makeRenderRequest('PUT', `/services/${RENDER_SERVICE_ID}/env-vars`, envVars);

        console.log('✅ Variable NEON_DATABASE_URL configurada exitosamente');
        console.log('\n🔄 Render hará redeploy automáticamente...');

    } catch (error) {
        console.error('❌ Error con API de Render:', error.message);
        console.log('\n📋 CONFIGURACIÓN MANUAL:');
        console.log('1. Ve a: https://dashboard.render.com');
        console.log('2. Selecciona tu servicio PWA');
        console.log('3. Ve a "Environment" en el menú lateral');
        console.log('4. Añade esta variable:\n');
        console.log('   Key: NEON_DATABASE_URL');
        console.log(`   Value: ${NEON_DATABASE_URL}`);
        console.log('\n5. Haz clic en "Save Changes"');
        console.log('6. El servicio se redesplegará automáticamente');
    }
}

// También crear las tablas en Neon
async function initializeNeonTables() {
    console.log('\n📦 Inicializando tablas en Neon DB...\n');

    try {
        const { Pool } = require('pg');

        const pool = new Pool({
            connectionString: NEON_DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const createTablesSQL = `
      -- Tabla principal de memoria
      CREATE TABLE IF NOT EXISTS qwen_memory (
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
      
      CREATE INDEX IF NOT EXISTS idx_qwen_memory_user_id ON qwen_memory(user_id);
      CREATE INDEX IF NOT EXISTS idx_qwen_memory_session_id ON qwen_memory(session_id);
      CREATE INDEX IF NOT EXISTS idx_qwen_memory_created_at ON qwen_memory(created_at DESC);
      
      -- Tabla para preferencias de usuario
      CREATE TABLE IF NOT EXISTS qwen_memory_preferences (
        user_id VARCHAR(255) PRIMARY KEY,
        default_model VARCHAR(100) DEFAULT 'qwen-main',
        language VARCHAR(10) DEFAULT 'es',
        mcp_enabled BOOLEAN DEFAULT true,
        custom_prompt TEXT,
        metadata JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Tabla para contexto de largo plazo
      CREATE TABLE IF NOT EXISTS qwen_memory_context (
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
      
      CREATE INDEX IF NOT EXISTS idx_qwen_memory_context_user ON qwen_memory_context(user_id);
    `;

        await pool.query(createTablesSQL);

        console.log('✅ Tablas creadas exitosamente:');
        console.log('   - qwen_memory (conversaciones)');
        console.log('   - qwen_memory_preferences (preferencias usuario)');
        console.log('   - qwen_memory_context (contexto largo plazo)');

        // Verificar tablas
        const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'qwen%'
    `);

        console.log('\n📊 Tablas en la base de datos:');
        result.rows.forEach(row => console.log(`   ✓ ${row.table_name}`));

        await pool.end();
        console.log('\n✅ ¡Memoria persistente configurada correctamente!');

    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.log('⚠️ Módulo pg no instalado. Ejecuta: npm install pg');
            console.log('\nLuego vuelve a ejecutar este script.');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// Ejecutar
async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('   QWEN PURE - Configuración de Memoria Neon DB');
    console.log('═══════════════════════════════════════════════════\n');

    // Primero inicializar tablas en Neon
    await initializeNeonTables();

    // Luego configurar en Render (opcional, puede fallar si no hay API key)
    // await configureNeonDB();

    console.log('\n═══════════════════════════════════════════════════');
    console.log('   ✅ Configuración completada');
    console.log('═══════════════════════════════════════════════════');
}

main().catch(console.error);
