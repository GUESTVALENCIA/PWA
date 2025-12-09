/**
 * Script: Corregir TODOS los errores usando GROQ API directamente
 * Más rápido y confiable que la API REST de VoltAgent
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuración GROQ
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile'; // Modelo rápido y potente de GROQ (actualizado)

if (!GROQ_API_KEY) {
  log('\n❌ GROQ_API_KEY no configurada', 'red');
  log('   Configura con: $env:GROQ_API_KEY = "gsk-tu-api-key"', 'yellow');
  process.exit(1);
}

log('\n✅ GROQ_API_KEY configurada', 'green');

// Función para hacer petición a GROQ API
function callGroqAPI(prompt) {
  return new Promise((resolve, reject) => {
    const requestData = {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'Eres un experto desarrollador frontend especializado en HTML, CSS y JavaScript. Corriges errores de linting, accesibilidad, seguridad y compatibilidad. Respondes SOLO con el código corregido completo, sin explicaciones.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 32000
    };

    const data = JSON.stringify(requestData);

    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data, 'utf8')
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
            return;
          }
          
          const response = JSON.parse(body);
          if (response.choices && response.choices[0] && response.choices[0].message) {
            resolve(response.choices[0].message.content);
          } else if (response.error) {
            reject(new Error(`GROQ API Error: ${response.error.message || JSON.stringify(response.error)}`));
          } else {
            reject(new Error(`Respuesta inesperada: ${JSON.stringify(response).substring(0, 200)}`));
          }
        } catch (e) {
          reject(new Error(`Error parseando respuesta: ${e.message}. Body: ${body.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Error de conexión: ${err.message}`));
    });
    
    req.write(data, 'utf8');
    req.end();
  });
}

// Leer index.html y obtener errores
const INDEX_HTML_PATH = path.join(__dirname, 'index.html');
let indexHtmlContent = '';

try {
  indexHtmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
  log(`\n✅ Archivo index.html leído (${(indexHtmlContent.length / 1024).toFixed(2)} KB)`, 'green');
} catch (error) {
  log(`\n❌ Error leyendo index.html: ${error.message}`, 'red');
  process.exit(1);
}

// Generar prompt con todos los errores detectados
const prompt = `Corrige TODOS los errores de linting en el siguiente archivo HTML.

ARCHIVO: index.html
RUTA: ${INDEX_HTML_PATH}

ERRORES A CORREGIR:

1. CSS inline styles - Mover a clases CSS cuando sea posible (líneas: 105, 114, 115, 248, 336, 357, 687, 737)
   ⚠️ EXCEPCIÓN: Mantener estilos inline dinámicos (background-image establecido en JavaScript)

2. Compatibilidad video[playsinline] - Agregar webkit-playsinline para Firefox (líneas: 102, 278, 290, 335, 356, 686, 736)
   Solución: Agregar webkit-playsinline junto con playsinline

3. Accesibilidad - meta[name=theme-color] no soportado en Firefox (línea: 12)
   Nota: Es un warning, mantener para compatibilidad con otros navegadores

REQUISITOS CRÍTICOS:
- Mantener TODA la funcionalidad JavaScript existente
- NO romper ningún comportamiento
- Los estilos inline dinámicos (establecidos en JavaScript) DEBEN mantenerse inline
- Generar el código HTML completo corregido
- Mejorar accesibilidad donde sea posible
- Mantener compatibilidad con todos los navegadores

CONTENIDO DEL ARCHIVO:
\`\`\`html
${indexHtmlContent}
\`\`\`

Responde SOLO con el código HTML completo corregido, sin explicaciones adicionales. El código debe estar dentro de un bloque \`\`\`html ... \`\`\`.`;

// Función principal
async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     CORRECCIÓN DE ERRORES CON GROQ API DIRECTA            ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  log('\n🚀 Invocando GROQ API para corregir index.html...', 'cyan');
  log(`   Modelo: ${MODEL}`, 'blue');
  log('   ⏳ Esperando respuesta (puede tardar 10-30 segundos)...\n', 'yellow');

  try {
    const respuesta = await callGroqAPI(prompt);
    
    log('✅ Respuesta recibida de GROQ\n', 'green');
    
    // Extraer código HTML del bloque de código
    const htmlMatch = respuesta.match(/```html\s*([\s\S]*?)```/) || 
                     respuesta.match(/```\s*([\s\S]*?)```/);
    
    if (!htmlMatch) {
      log('⚠️  No se encontró bloque de código HTML en la respuesta', 'yellow');
      log('Guardando respuesta completa para revisión...\n', 'yellow');
      
      // Guardar respuesta completa
      const outputPath = path.join(__dirname, 'groq-respuesta-completa.txt');
      fs.writeFileSync(outputPath, respuesta, 'utf-8');
      log(`📄 Respuesta guardada en: ${outputPath}`, 'blue');
      return;
    }
    
    const codigoCorregido = htmlMatch[1].trim();
    
    // Crear backup
    const backupPath = INDEX_HTML_PATH + '.backup';
    fs.copyFileSync(INDEX_HTML_PATH, backupPath);
    log(`💾 Backup creado: ${backupPath}`, 'blue');
    
    // Guardar código corregido
    const correctedPath = INDEX_HTML_PATH + '.corrected';
    fs.writeFileSync(correctedPath, codigoCorregido, 'utf-8');
    log(`✨ Código corregido guardado en: ${correctedPath}\n`, 'green');
    
    log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║                    CORRECCIÓN COMPLETADA                    ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');
    
    log('\n📋 PRÓXIMOS PASOS:', 'cyan');
    log('   1. Revisa el archivo: index.html.corrected', 'blue');
    log('   2. Verifica que las correcciones son correctas', 'blue');
    log('   3. Si todo está bien, reemplaza el original:', 'blue');
    log('      Move-Item index.html.corrected index.html -Force', 'yellow');
    log('   4. Verifica con el linter que todos los errores están corregidos', 'blue');
    log('   5. Haz commit y push para desplegar\n', 'blue');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      log('\n💡 Verifica que tu GROQ_API_KEY sea válida', 'yellow');
      log('   Obtén una nueva en: https://console.groq.com/', 'blue');
    }
    process.exit(1);
  }
}

// Ejecutar
main();

