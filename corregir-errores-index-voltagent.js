/**
 * Script para activar subagente VoltAgent y corregir 41 errores en index.html
 * Usa la API de VoltAgent para invocar un agente especializado
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Cargar tokens de VoltAgent
const tokensPath = path.join(__dirname, '..', '..', 'Desktop', 'VoltAgent-Composer-Workflow', 'tokens.json');
let tokens = {};
try {
  if (fs.existsSync(tokensPath)) {
    tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    console.log('✅ Tokens de VoltAgent cargados');
  } else {
    console.warn('⚠️  tokens.json no encontrado en VoltAgent-Composer-Workflow');
  }
} catch (e) {
  console.warn('⚠️  Error cargando tokens:', e.message);
}

// Configuración VoltAgent
const API_BASE = 'https://api.voltagent.dev';
const TOKEN = tokens.tokens?.development?.token || tokens.tokens?.original?.token;

// Ruta del archivo a corregir
const INDEX_HTML_PATH = path.join(__dirname, 'index.html');

// Leer el archivo index.html
let indexHtmlContent = '';
try {
  indexHtmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
  console.log(`✅ Archivo index.html leído (${(indexHtmlContent.length / 1024).toFixed(2)} KB)\n`);
} catch (error) {
  console.error('❌ Error leyendo index.html:', error.message);
  process.exit(1);
}

// Función para hacer petición HTTP/HTTPS
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Prompt detallado para el agente
const prompt = `Corrige TODOS los 41 errores de linting en el siguiente archivo HTML.

ARCHIVO: index.html
LOCALIZACIÓN: ${INDEX_HTML_PATH}

ERRORES A CORREGIR:
1. CSS inline styles - Mover a clases CSS cuando sea posible (líneas: 72, 96, 99, 108, 109, 242, 277, 278, 329, 330, 350, 351, 680, 681, 730, 731, 801)
2. Compatibilidad video[playsinline] - Agregar webkit-playsinline para Firefox (líneas: 96, 272, 284, 329, 350, 680, 730)
3. Accesibilidad - Agregar aria-label y title a botones (líneas: 298, 305, 308)
4. Input file sin label accesible - Agregar aria-label (línea: 262)
5. Link sin rel="noopener" - Agregar rel="noopener noreferrer" (línea: 701)
6. iframe referrerpolicy - Cambiar a "no-referrer" para compatibilidad (línea: 801)
7. CSS backdrop-filter - Asegurar que -webkit-backdrop-filter esté ANTES de backdrop-filter (líneas: 45, 46, 55)

REQUISITOS:
- Mantener TODA la funcionalidad existente
- Los estilos inline dinámicos (background-image establecido en JavaScript) DEBEN mantenerse inline
- Generar el código HTML completo corregido
- NO romper ninguna funcionalidad JavaScript
- Mantener la estructura y clases existentes

CONTENIDO DEL ARCHIVO:
\`\`\`html
${indexHtmlContent.substring(0, 100000)}${indexHtmlContent.length > 100000 ? '\n... (archivo truncado para envío, pero corregir TODO el archivo)' : ''}
\`\`\`

Responde SOLO con el código HTML completo corregido, sin explicaciones adicionales.`;

// Invocar agente VoltAgent
async function invocarAgenteVoltAgent() {
  if (!TOKEN) {
    console.error('❌ No se encontró token válido de VoltAgent');
    console.log('\n💡 Opciones:');
    console.log('   1. Ejecutar desde el directorio VoltAgent-Composer-Workflow:');
    console.log('      cd C:\\Users\\clayt\\Desktop\\VoltAgent-Composer-Workflow');
    console.log('      node invocar-agente.js claude-code "Corrige los errores..."');
    console.log('\n   2. O usar el script directo de VoltAgent');
    process.exit(1);
  }

  console.log('🚀 Invocando agente VoltAgent: claude-code\n');
  console.log('📝 Tarea: Corregir 41 errores de linting en index.html\n');
  console.log('⏳ Esperando respuesta del agente...\n');

  const agentId = 'claude-code';
  const endpoints = [
    { 
      url: `${API_BASE}/agents/${agentId}/chat`, 
      body: { 
        input: [{ role: 'user', text: prompt, content: prompt }],
        options: {
          userId: 'sandra-coo-user',
          conversationId: `conv-${Date.now()}`,
          temperature: 0.3,
          maxOutputTokens: 16000
        }
      } 
    },
    { 
      url: `http://localhost:3141/agents/${agentId}/chat`, 
      body: { 
        input: [{ role: 'user', text: prompt, content: prompt }],
        options: {
          userId: 'sandra-coo-user',
          conversationId: `conv-${Date.now()}`,
          temperature: 0.3,
          maxOutputTokens: 16000
        }
      } 
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`   Intentando: ${endpoint.url}`);
      const response = await makeRequest(endpoint.url, {
        method: 'POST'
      }, endpoint.body);

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Respuesta del agente recibida\n');
        
        let respuesta = '';
        if (response.data.text) {
          respuesta = response.data.text;
        } else if (response.data.message) {
          respuesta = response.data.message;
        } else if (response.data.content) {
          respuesta = response.data.content;
        } else if (typeof response.data === 'string') {
          respuesta = response.data;
        } else {
          respuesta = JSON.stringify(response.data, null, 2);
        }

        // Extraer código HTML si está en un bloque de código
        const htmlMatch = respuesta.match(/```html\s*([\s\S]*?)```/) || 
                         respuesta.match(/```\s*([\s\S]*?)```/);
        
        const codigoCorregido = htmlMatch ? htmlMatch[1].trim() : respuesta;

        // Guardar resultado
        const outputPath = path.join(__dirname, 'index-corrected.html');
        fs.writeFileSync(outputPath, codigoCorregido, 'utf-8');
        
        console.log('✅ Código corregido guardado en: index-corrected.html');
        console.log('\n📋 PRÓXIMOS PASOS:');
        console.log('   1. Revisa el archivo index-corrected.html');
        console.log('   2. Compara con index.html original');
        console.log('   3. Si está correcto, reemplaza: mv index-corrected.html index.html');
        console.log('   4. Verifica con el linter que todos los errores están corregidos\n');
        
        return;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      continue;
    }
  }

  console.error('❌ No se pudo invocar el agente de VoltAgent');
  console.log('\n💡 Usa el script de VoltAgent directamente:');
  console.log('   cd C:\\Users\\clayt\\Desktop\\VoltAgent-Composer-Workflow');
  console.log(`   node invocar-agente.js claude-code "${prompt.substring(0, 200)}..."`);
}

// Ejecutar
invocarAgenteVoltAgent().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

