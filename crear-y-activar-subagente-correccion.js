/**
 * Script para crear y activar subagente especializado en corrección de código HTML/CSS
 * Crea el agente y luego lo invoca para corregir los 41 errores en index.html
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Cargar tokens
const tokensPath = path.join(__dirname, '..', '..', 'Desktop', 'VoltAgent-Composer-Workflow', 'tokens.json');
let tokens = {};
try {
  if (fs.existsSync(tokensPath)) {
    tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    console.log('✅ Tokens cargados');
  } else {
    console.error('❌ tokens.json no encontrado');
    process.exit(1);
  }
} catch (e) {
  console.error('❌ Error cargando tokens:', e.message);
  process.exit(1);
}

const API_BASE = 'https://api.voltagent.dev';
const TOKEN = tokens.tokens?.development?.token || tokens.tokens?.admin?.token || tokens.tokens?.original?.token;

if (!TOKEN) {
  console.error('❌ No se encontró token válido');
  process.exit(1);
}

// Función para hacer petición HTTP
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Configuración del agente especializado
const AGENT_CONFIG = {
  id: 'html-css-linter-fixer',
  name: 'HTML/CSS Linter Fixer',
  description: 'Especialista en corrección de errores de linting en HTML y CSS. Corrige CSS inline styles, accesibilidad, compatibilidad de navegadores y errores de código.',
  model: 'gpt-4o',
  systemPrompt: `Eres un experto en corrección de código HTML/CSS y linting.

ESPECIALIDADES:
- Mover estilos inline a clases CSS manteniendo funcionalidad
- Corregir problemas de accesibilidad (ARIA labels, titles, labels)
- Compatibilidad entre navegadores (prefijos CSS, atributos)
- Optimización de código HTML sin romper funcionalidad
- Corrección de errores de linting específicos

CUANDO CORRIJAS CÓDIGO:
1. Lee el archivo completo
2. Identifica TODOS los errores de linting
3. Mueve estilos inline a clases CSS (excepto dinámicos de JavaScript)
4. Agrega atributos de accesibilidad faltantes
5. Corrige compatibilidad entre navegadores
6. MANTÉN toda la funcionalidad JavaScript existente
7. NO rompas ningún comportamiento

FORMATO DE RESPUESTA:
- Genera el código HTML completo corregido
- Envuelve en bloque de código \`\`\`html ... \`\`\`
- NO agregues explicaciones adicionales, solo el código

Sé preciso, técnico y proporciona código listo para usar.`,
  tools: ['read', 'write', 'edit', 'glob', 'grep'],
  enabled: true
};

// Crear el agente
async function crearAgente() {
  console.log('\n🚀 CREANDO SUBAGENTE ESPECIALIZADO...\n');
  console.log(`📝 ID: ${AGENT_CONFIG.id}`);
  console.log(`📋 Nombre: ${AGENT_CONFIG.name}\n`);

  const endpoints = [
    `${API_BASE}/agents`,
    `${API_BASE}/api/agents`,
    `${API_BASE}/v1/agents`
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`   Intentando: ${endpoint}`);
      const response = await makeRequest(endpoint, { method: 'POST' }, AGENT_CONFIG);

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Agente creado exitosamente!\n');
        return true;
      } else {
        console.log(`   Status: ${response.status}`);
        if (response.status === 409) {
          console.log('   ⚠️  Agente ya existe, continuando...\n');
          return true; // Ya existe, continuar
        }
      }
    } catch (err) {
      continue;
    }
  }

  console.log('⚠️  No se pudo crear el agente via API');
  console.log('💡 El agente puede que ya exista o necesite crearse desde la consola\n');
  return false;
}

// Invocar el agente para corregir errores
async function invocarAgenteParaCorregir() {
  console.log('\n🔧 INVOCANDO AGENTE PARA CORREGIR ERRORES...\n');

  const indexHtmlPath = path.join(__dirname, 'index.html');
  let indexHtmlContent = '';
  
  try {
    indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    console.log(`✅ Archivo index.html leído (${(indexHtmlContent.length / 1024).toFixed(2)} KB)\n`);
  } catch (error) {
    console.error('❌ Error leyendo index.html:', error.message);
    return;
  }

  const prompt = `Corrige TODOS los 41 errores de linting en index.html.

ARCHIVO: ${indexHtmlPath}

ERRORES A CORREGIR:
1. CSS inline styles → Mover a clases CSS (líneas: 72, 96, 99, 108, 109, 242, 277, 278, 329, 330, 350, 351, 680, 681, 730, 731, 801)
   ⚠️ EXCEPCIÓN: Mantener estilos inline dinámicos (background-image establecido en JavaScript)

2. Compatibilidad video[playsinline] → Agregar webkit-playsinline (líneas: 96, 272, 284, 329, 350, 680, 730)

3. Accesibilidad botones → Agregar aria-label y title (líneas: 298, 305, 308)

4. Input file → Agregar aria-label (línea: 262)

5. Link sin rel="noopener" → Agregar rel="noopener noreferrer" (línea: 701)

6. iframe referrerpolicy → Cambiar a "no-referrer" (línea: 801)

7. CSS backdrop-filter → Asegurar que -webkit-backdrop-filter esté ANTES (líneas: 45, 46, 55)

CONTENIDO DEL ARCHIVO:
\`\`\`html
${indexHtmlContent}
\`\`\`

Corrige TODOS los errores y genera el código HTML completo corregido.`;

  const endpoints = [
    { 
      url: `${API_BASE}/agents/${AGENT_CONFIG.id}/chat`, 
      body: { 
        input: [{ role: 'user', text: prompt, content: prompt }],
        options: {
          userId: 'sandra-coo-user',
          conversationId: `conv-${Date.now()}`,
          temperature: 0.3,
          maxOutputTokens: 20000
        }
      } 
    },
    { 
      url: `http://localhost:3141/agents/${AGENT_CONFIG.id}/chat`, 
      body: { 
        input: [{ role: 'user', text: prompt, content: prompt }],
        options: {
          userId: 'sandra-coo-user',
          conversationId: `conv-${Date.now()}`,
          temperature: 0.3,
          maxOutputTokens: 20000
        }
      } 
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`   Intentando: ${endpoint.url}`);
      const response = await makeRequest(endpoint.url, { method: 'POST' }, endpoint.body);

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

        // Extraer código HTML
        const htmlMatch = respuesta.match(/```html\s*([\s\S]*?)```/) || 
                         respuesta.match(/```\s*([\s\S]*?)```/);
        
        const codigoCorregido = htmlMatch ? htmlMatch[1].trim() : respuesta;

        // Guardar resultado
        const outputPath = path.join(__dirname, 'index-corrected-by-voltagent.html');
        fs.writeFileSync(outputPath, codigoCorregido, 'utf-8');
        
        console.log('✅ Código corregido guardado en: index-corrected-by-voltagent.html');
        console.log('\n📋 PRÓXIMOS PASOS:');
        console.log('   1. Revisa index-corrected-by-voltagent.html');
        console.log('   2. Compara con index.html original');
        console.log('   3. Si está correcto, reemplaza:');
        console.log('      mv index-corrected-by-voltagent.html index.html');
        console.log('   4. Verifica con linter que todos los errores están corregidos\n');
        
        return;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      continue;
    }
  }

  console.error('❌ No se pudo invocar el agente');
  console.log('\n💡 Usa la consola de VoltAgent directamente:');
  console.log('   https://console.voltagent.dev');
  console.log(`   Selecciona el agente: ${AGENT_CONFIG.id}`);
  console.log('   Pega el prompt del archivo\n');
}

// Ejecutar
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   CREAR Y ACTIVAR SUBAGENTE - CORRECCIÓN DE ERRORES');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Paso 1: Crear agente
  const creado = await crearAgente();
  
  // Paso 2: Invocar agente
  if (creado) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
    await invocarAgenteParaCorregir();
  } else {
    console.log('\n⚠️  El agente no se pudo crear via API.');
    console.log('💡 Créalo manualmente desde la consola:');
    console.log('   https://console.voltagent.dev');
    console.log('\nConfiguración del agente:');
    console.log(JSON.stringify(AGENT_CONFIG, null, 2));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

