/**
 * 🧪 TEST: Verificar conexión OpenAI GPT-4o-mini para llamadas conversacionales
 * 
 * Este script verifica que:
 * 1. La API key de OpenAI está configurada
 * 2. El modelo GPT-4o-mini responde correctamente
 * 3. La latencia es aceptable para llamadas conversacionales
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testOpenAIConnection() {
  console.log(`${colors.cyan}🧪 TEST: Verificando conexión OpenAI GPT-4o-mini${colors.reset}\n`);

  // 1. Verificar API Key
  if (!OPENAI_API_KEY) {
    console.error(`${colors.red}❌ ERROR: OPENAI_API_KEY no configurada${colors.reset}`);
    console.error(`${colors.yellow}💡 Configura OPENAI_API_KEY en Render Dashboard o en .env${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}✅ OPENAI_API_KEY configurada (${OPENAI_API_KEY.length} caracteres)${colors.reset}`);

  // 2. Test de conexión con mensaje simple
  const systemPrompt = `Eres Sandra, la asistente virtual de Guests Valencia, especializada en hospitalidad y turismo.
Responde SIEMPRE en español neutro, con buena ortografía y gramática.
Actúa como una experta en Hospitalidad y Turismo.
Sé breve: máximo 4 frases salvo que se pida detalle.
Sé amable, profesional y útil.`;

  const testMessage = 'Hola, ¿qué tal?';

  console.log(`\n${colors.blue}📤 Enviando mensaje de prueba: "${testMessage}"${colors.reset}`);
  console.log(`${colors.blue}🤖 Modelo: gpt-4o-mini${colors.reset}\n`);

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: testMessage }
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = errorText.length > 200 ? errorText.substring(0, 200) : errorText;
      throw new Error(`OpenAI Error ${response.status}: ${errorMsg}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('OpenAI: Invalid response format');
    }

    const endTime = Date.now();
    const latency = endTime - startTime;
    const responseText = data.choices[0].message.content;

    console.log(`${colors.green}✅ RESPUESTA RECIBIDA${colors.reset}`);
    console.log(`${colors.cyan}⏱️  Latencia: ${latency}ms${colors.reset}`);
    console.log(`${colors.cyan}📝 Respuesta (${responseText.length} caracteres):${colors.reset}`);
    console.log(`${colors.green}"${responseText}"${colors.reset}\n`);

    // Evaluar latencia
    if (latency < 1000) {
      console.log(`${colors.green}✅ Latencia EXCELENTE (< 1s) - Perfecto para llamadas conversacionales${colors.reset}`);
    } else if (latency < 2000) {
      console.log(`${colors.yellow}⚠️  Latencia BUENA (< 2s) - Aceptable para llamadas conversacionales${colors.reset}`);
    } else if (latency < 3000) {
      console.log(`${colors.yellow}⚠️  Latencia REGULAR (< 3s) - Funcional pero mejorable${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Latencia ALTA (> 3s) - Puede afectar la experiencia de llamada${colors.reset}`);
    }

    // Verificar que la respuesta es en español
    if (responseText.trim().length > 0) {
      console.log(`${colors.green}✅ Respuesta válida recibida${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Respuesta vacía${colors.reset}`);
      process.exit(1);
    }

    console.log(`\n${colors.green}🎉 TEST COMPLETADO EXITOSAMENTE${colors.reset}`);
    console.log(`${colors.cyan}✅ OpenAI GPT-4o-mini está funcionando correctamente${colors.reset}`);
    console.log(`${colors.cyan}✅ Listo para llamadas conversacionales${colors.reset}\n`);

    return true;

  } catch (error) {
    const endTime = Date.now();
    const latency = endTime - startTime;

    console.error(`${colors.red}❌ ERROR en conexión OpenAI:${colors.reset}`);
    console.error(`${colors.red}   ${error.message}${colors.reset}`);
    
    if (error.name === 'AbortError') {
      console.error(`${colors.red}   Timeout después de ${latency}ms${colors.reset}`);
    }

    console.error(`\n${colors.yellow}💡 Verifica:${colors.reset}`);
    console.error(`${colors.yellow}   1. OPENAI_API_KEY es válida${colors.reset}`);
    console.error(`${colors.yellow}   2. Tienes crédito disponible en OpenAI${colors.reset}`);
    console.error(`${colors.yellow}   3. El modelo gpt-4o-mini está disponible${colors.reset}`);
    console.error(`${colors.yellow}   4. La conexión a internet funciona${colors.reset}\n`);

    process.exit(1);
  }
}

// Ejecutar test
testOpenAIConnection().catch(error => {
  console.error(`${colors.red}❌ Error fatal:${colors.reset}`, error);
  process.exit(1);
});
