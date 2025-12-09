/**
 * Script para activar subagentes usando GROQ API (VoltAgent)
 * Corrige automáticamente los 41 errores en index.html
 */

const https = require('https');

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'api.groq.com';

if (!GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY no configurada en variables de entorno');
  console.log('💡 Configura GROQ_API_KEY antes de ejecutar este script');
  process.exit(1);
}

/**
 * Activa un subagente usando GROQ API
 */
async function activarSubagente(agentId, task) {
  return new Promise((resolve, reject) => {
    const prompt = `Eres el subagente especializado ${agentId}. 

TAREA: ${task}

Archivo objetivo: index.html
Errores detectados: 41 errores (CSS inline, compatibilidad video, accesibilidad)

REQUISITOS:
1. Corrige TODOS los 41 errores mostrados en el linter
2. Mueve estilos inline a clases CSS cuando sea posible
3. Mantiene estilos inline dinámicos (background-image) que se establecen en JavaScript
4. Agrega atributos de accesibilidad faltantes
5. Corrige compatibilidad de videos e iframes
6. NO rompas la funcionalidad existente
7. Genera el código completo corregido

Responde SOLO con el código HTML corregido, sin explicaciones adicionales.`;

    const postData = JSON.stringify({
      messages: [
        {
          role: 'system',
          content: `Eres un experto en corrección de código HTML/CSS. Corriges errores de linting manteniendo la funcionalidad.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.3,
      max_tokens: 16000
    });

    const options = {
      hostname: GROQ_API_URL,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.choices && response.choices[0] && response.choices[0].message) {
            resolve(response.choices[0].message.content);
          } else {
            reject(new Error(`Error en respuesta GROQ: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`Error parseando respuesta: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 Activando subagentes con GROQ API...\n');
  
  const task = `Corrige TODOS los 41 errores de linting en index.html:
- CSS inline styles (mover a clases CSS)
- Compatibilidad video[playsinline] con Firefox
- Accesibilidad (aria-labels, titles en botones)
- Referrerpolicy en iframe
- Orden de prefijos CSS (-webkit primero)

Lee el archivo index.html actual y genera la versión corregida completa.`;

  try {
    console.log('📡 Activando repository-cleanup-agent para corrección de código...\n');
    
    const respuesta = await activarSubagente('repository-cleanup-agent', task);
    
    console.log('✅ Subagente activado exitosamente\n');
    console.log('📝 Respuesta del subagente:');
    console.log('─'.repeat(80));
    console.log(respuesta.substring(0, 500) + '...\n');
    console.log('─'.repeat(80));
    console.log('\n💡 El subagente ha generado el código corregido.');
    console.log('💡 Debes revisar y aplicar los cambios al archivo index.html');
    
  } catch (error) {
    console.error('❌ Error activando subagente:', error.message);
    console.log('\n💡 Verifica que GROQ_API_KEY esté configurada correctamente');
  }
}

main();

