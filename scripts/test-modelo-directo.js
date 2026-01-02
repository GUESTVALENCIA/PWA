/**
 * 🧪 TEST DIRECTO: Probar OpenAI GPT-4o-mini directamente
 * 
 * Este test importa el servicio de voz y prueba el modelo directamente
 */

import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

// Importar el servicio de voz (convertir path a URL para Windows)
const voiceServicesPath = join(__dirname, '../src/services/voice-services.js');
const voiceServicesUrl = pathToFileURL(voiceServicesPath).href;
const voiceServices = await import(voiceServicesUrl);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testModeloDirecto() {
  console.log(`${colors.cyan}🧪 TEST DIRECTO: Probando OpenAI GPT-4o-mini${colors.reset}\n`);

  // Verificar que el servicio está disponible
  const services = voiceServices.default || voiceServices;
  
  if (!services || !services.ai || !services.ai.processMessage) {
    console.error(`${colors.red}❌ ERROR: Servicio de voz no disponible${colors.reset}`);
    console.error(`${colors.yellow}💡 Verifica que el código esté correctamente importado${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}✅ Servicio de voz cargado${colors.reset}\n`);

  // Test del modelo
  const testMessage = 'Hola, ¿qué tal?';
  console.log(`${colors.blue}📤 Enviando mensaje: "${testMessage}"${colors.reset}`);
  console.log(`${colors.blue}🤖 Modelo: GPT-4o-mini${colors.reset}\n`);

  const startTime = Date.now();

  try {
    const response = await services.ai.processMessage(testMessage);
    const endTime = Date.now();
    const latency = endTime - startTime;

    console.log(`${colors.green}✅ RESPUESTA RECIBIDA${colors.reset}`);
    console.log(`${colors.cyan}⏱️  Latencia: ${latency}ms${colors.reset}`);
    console.log(`${colors.cyan}📝 Respuesta (${response.length} caracteres):${colors.reset}`);
    console.log(`${colors.green}"${response}"${colors.reset}\n`);

    // Evaluar latencia
    if (latency < 1000) {
      console.log(`${colors.green}✅ Latencia EXCELENTE (< 1s) - Perfecto para llamadas conversacionales${colors.reset}`);
    } else if (latency < 2000) {
      console.log(`${colors.green}✅ Latencia BUENA (< 2s) - Aceptable para llamadas conversacionales${colors.reset}`);
    } else if (latency < 3000) {
      console.log(`${colors.yellow}⚠️  Latencia REGULAR (< 3s) - Funcional pero mejorable${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Latencia ALTA (> 3s) - Puede afectar la experiencia${colors.reset}`);
    }

    // Verificar respuesta
    if (response && response.trim().length > 0) {
      console.log(`${colors.green}✅ Respuesta válida recibida${colors.reset}`);
      console.log(`\n${colors.green}🎉 TEST COMPLETADO EXITOSAMENTE${colors.reset}`);
      console.log(`${colors.cyan}✅ OpenAI GPT-4o-mini está funcionando correctamente${colors.reset}`);
      console.log(`${colors.cyan}✅ Listo para llamadas conversacionales${colors.reset}\n`);
      return true;
    } else {
      console.log(`${colors.red}❌ Respuesta vacía${colors.reset}`);
      process.exit(1);
    }

  } catch (error) {
    const endTime = Date.now();
    const latency = endTime - startTime;

    console.error(`${colors.red}❌ ERROR:${colors.reset}`);
    console.error(`${colors.red}   ${error.message}${colors.reset}`);
    
    if (error.message.includes('OPENAI_API_KEY')) {
      console.error(`\n${colors.yellow}💡 La API key no está configurada localmente${colors.reset}`);
      console.error(`${colors.yellow}   Esto es normal - la API key está en Render${colors.reset}`);
      console.error(`${colors.yellow}   El modelo funcionará cuando se despliegue en Render${colors.reset}\n`);
    } else {
      console.error(`\n${colors.yellow}💡 Verifica:${colors.reset}`);
      console.error(`${colors.yellow}   1. OPENAI_API_KEY es válida${colors.reset}`);
      console.error(`${colors.yellow}   2. Tienes crédito disponible en OpenAI${colors.reset}`);
      console.error(`${colors.yellow}   3. El modelo gpt-4o-mini está disponible${colors.reset}\n`);
    }

    process.exit(1);
  }
}

testModeloDirecto().catch(error => {
  console.error(`${colors.red}❌ Error fatal:${colors.reset}`, error);
  process.exit(1);
});
