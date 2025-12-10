#!/usr/bin/env node
/**
 * Verificar conexiones del servidor MCP
 * El servidor MCP es donde SANDRA realmente procesa las llamadas
 */

const https = require('https');

const MCP_SERVER_URL = 'https://mcp.sandra-ia.com';
const MCP_PORT = 4042;

// Colores
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000
    };

    const req = https.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json, ok: res.statusCode >= 200 && res.statusCode < 300 });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, ok: res.statusCode >= 200 && res.statusCode < 300 });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testMCPHealth() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.blue}🔍 VERIFICANDO SERVIDOR MCP${colors.reset}`);
  console.log('='.repeat(70));
  console.log(`\n🌐 URL: ${MCP_SERVER_URL}:${MCP_PORT}\n`);

  try {
    // 1. Probar health endpoint
    console.log(`${colors.cyan}1. Probando /health...${colors.reset}`);
    const health = await makeRequest(`${MCP_SERVER_URL}/health`);
    
    if (health.ok) {
      console.log(`${colors.green}   ✅ Servidor MCP está online${colors.reset}`);
      console.log(`   Respuesta:`, health.data);
    } else {
      console.log(`${colors.red}   ❌ Health check falló: ${health.status}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}   ❌ No se puede conectar al servidor MCP${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    console.log(`\n${colors.yellow}   ⚠️  El servidor MCP necesita estar desplegado y funcionando${colors.reset}`);
    console.log(`   ${colors.yellow}   Verifica que esté corriendo en ${MCP_SERVER_URL}:${MCP_PORT}${colors.reset}`);
    return false;
  }

  try {
    // 2. Probar status endpoint
    console.log(`\n${colors.cyan}2. Probando /api/status...${colors.reset}`);
    const status = await makeRequest(`${MCP_SERVER_URL}/api/status`);
    
    if (status.ok && status.data) {
      console.log(`${colors.green}   ✅ Status endpoint funcionando${colors.reset}`);
      
      // Verificar qué servicios están disponibles
      if (status.data.services) {
        console.log(`\n   Servicios disponibles:`);
        Object.entries(status.data.services).forEach(([name, service]) => {
          const isReady = service.ready || service.available;
          const icon = isReady ? colors.green + '✅' : colors.red + '❌';
          console.log(`   ${icon} ${colors.reset}${name}`);
          
          if (!isReady && service.error) {
            console.log(`      Error: ${service.error}`);
          }
        });
      }
      
      // Verificar API keys disponibles
      if (status.data.config || status.data.env) {
        console.log(`\n   Variables de entorno en MCP:`);
        const env = status.data.config || status.data.env || {};
        
        const checks = [
          { name: 'OPENAI_API_KEY', key: 'OPENAI_API_KEY' },
          { name: 'GROQ_API_KEY', key: 'GROQ_API_KEY' },
          { name: 'QWEN_API_KEY', key: 'QWEN_API_KEY' },
          { name: 'DEEPSEEK_API_KEY', key: 'DEEPSEEK_API_KEY' },
          { name: 'GEMINI_API_KEY', key: 'GEMINI_API_KEY' },
          { name: 'CARTESIA_API_KEY', key: 'CARTESIA_API_KEY' },
          { name: 'DEEPGRAM_API_KEY', key: 'DEEPGRAM_API_KEY' }
        ];
        
        checks.forEach(check => {
          const exists = !!(env[check.key] || (typeof env[check.key] === 'string' && env[check.key].length > 0));
          const icon = exists ? colors.green + '✅' : colors.red + '❌';
          console.log(`   ${icon} ${colors.reset}${check.name}`);
        });
      }
      
      return status.data;
    } else {
      console.log(`${colors.yellow}   ⚠️  Status endpoint responde pero sin información${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.yellow}   ⚠️  Status endpoint no disponible: ${error.message}${colors.reset}`);
  }

  try {
    // 3. Probar endpoint de conserje (mensaje)
    console.log(`\n${colors.cyan}3. Probando /api/conserje/message...${colors.reset}`);
    const message = await makeRequest(`${MCP_SERVER_URL}/api/conserje/message`, {
      method: 'POST',
      body: {
        message: 'Hola Sandra, ¿estás ahí?',
        context: 'Test de conexión',
        timezone: 'Europe/Madrid'
      }
    });
    
    if (message.ok && message.data && message.data.response) {
      console.log(`${colors.green}   ✅ Endpoint de conserje funcionando${colors.reset}`);
      console.log(`   Modelo usado: ${message.data.model || 'unknown'}`);
      console.log(`   Respuesta: "${message.data.response.substring(0, 80)}..."`);
      
      // Verificar qué modelo se está usando
      if (message.data.model) {
        if (message.data.model.includes('gpt-4')) {
          console.log(`   ${colors.green}✅ Usando GPT-4o (correcto)${colors.reset}`);
        } else if (message.data.model.includes('deepseek')) {
          console.log(`   ${colors.yellow}⚠️  Usando DeepSeek (fallback)${colors.reset}`);
        } else if (message.data.model.includes('qwen')) {
          console.log(`   ${colors.yellow}⚠️  Usando Qwen (fallback)${colors.reset}`);
        } else if (message.data.model.includes('gemini')) {
          console.log(`   ${colors.red}❌ Usando Gemini (último recurso - verifica OPENAI_API_KEY)${colors.reset}`);
        }
      }
      
      return message.data;
    } else {
      console.log(`${colors.red}   ❌ Endpoint de conserje falló: ${message.status}${colors.reset}`);
      console.log(`   Respuesta:`, message.data);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}   ❌ Error probando conserje: ${error.message}${colors.reset}`);
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}🔍 VERIFICACIÓN DEL SERVIDOR MCP (SANDRA)${colors.reset}`);
  console.log('='.repeat(70));
  console.log(`\n📅 Fecha: ${new Date().toISOString()}\n`);

  const result = await testMCPHealth();

  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}📊 RESUMEN${colors.reset}`);
  console.log('='.repeat(70));

  if (result) {
    console.log(`\n${colors.green}✅ Servidor MCP está funcionando${colors.reset}`);
    
    if (result.model && result.model.includes('gemini')) {
      console.log(`\n${colors.red}⚠️  PROBLEMA DETECTADO:${colors.reset}`);
      console.log(`   El servidor MCP está usando Gemini como último recurso.`);
      console.log(`   Esto significa que ${colors.yellow}OPENAI_API_KEY no está configurada${colors.reset} en el servidor MCP.`);
      console.log(`\n${colors.yellow}💡 SOLUCIÓN:${colors.reset}`);
      console.log(`   1. Ve a donde está desplegado el servidor MCP (Railway, Render, VPS)`);
      console.log(`   2. Configura las variables de entorno allí:`);
      console.log(`      - OPENAI_API_KEY`);
      console.log(`      - GROQ_API_KEY (opcional, para fallback)`);
      console.log(`      - GEMINI_API_KEY (último recurso)`);
      console.log(`   3. Reinicia el servidor MCP después de configurar las variables`);
    } else if (result.model && (result.model.includes('gpt-4') || result.model.includes('deepseek') || result.model.includes('qwen'))) {
      console.log(`\n${colors.green}✅ El servidor MCP está usando el modelo correcto: ${result.model}${colors.reset}`);
    }
  } else {
    console.log(`\n${colors.red}❌ No se pudo verificar el servidor MCP${colors.reset}`);
    console.log(`\n${colors.yellow}💡 VERIFICA:${colors.reset}`);
    console.log(`   1. Que el servidor MCP esté desplegado y corriendo`);
    console.log(`   2. Que sea accesible en ${MCP_SERVER_URL}:${MCP_PORT}`);
    console.log(`   3. Que las variables de entorno estén configuradas EN EL SERVIDOR MCP`);
  }

  console.log('\n');
}

main().catch(error => {
  console.error(`\n${colors.red}❌ Error fatal: ${error}${colors.reset}`);
  process.exit(1);
});

