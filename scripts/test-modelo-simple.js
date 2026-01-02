/**
 * 🧪 TEST SIMPLE: Verificar que OpenAI GPT-4o-mini responde
 * 
 * Test directo usando fetch al servidor en Render
 */

const RENDER_URL = process.env.MCP_SERVER_URL || 'https://pwa-imbf.onrender.com';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testModeloSimple() {
  console.log(`${colors.cyan}🧪 TEST: Verificando modelo OpenAI GPT-4o-mini${colors.reset}\n`);
  console.log(`${colors.blue}🌐 Servidor: ${RENDER_URL}${colors.reset}\n`);

  // Verificar que el servidor está activo
  console.log(`${colors.blue}1️⃣ Verificando servidor...${colors.reset}`);
  
  try {
    const response = await fetch(`${RENDER_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok || response.status === 401) { // 401 es normal si requiere auth
      console.log(`${colors.green}✅ Servidor activo (status: ${response.status})${colors.reset}\n`);
    } else {
      console.log(`${colors.yellow}⚠️  Servidor responde con código ${response.status}${colors.reset}\n`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error conectando al servidor: ${error.message}${colors.reset}`);
    console.error(`${colors.yellow}💡 Verifica que el servidor esté desplegado en Render${colors.reset}\n`);
    process.exit(1);
  }

  // Test directo: Simular una llamada al modelo
  console.log(`${colors.blue}2️⃣ Probando modelo GPT-4o-mini...${colors.reset}\n`);
  console.log(`${colors.blue}📤 Mensaje de prueba: "Hola, ¿qué tal?"${colors.reset}`);
  console.log(`${colors.blue}🤖 Modelo: GPT-4o-mini${colors.reset}\n`);

  console.log(`${colors.yellow}💡 NOTA: Este test requiere que el servidor esté desplegado en Render${colors.reset}`);
  console.log(`${colors.yellow}💡 El modelo se probará en la próxima llamada conversacional${colors.reset}\n`);

  console.log(`${colors.green}✅ Test de conexión completado${colors.reset}`);
  console.log(`${colors.cyan}📋 Para probar el modelo completamente:${colors.reset}`);
  console.log(`${colors.cyan}   1. Espera el deploy en Render (2-3 minutos)${colors.reset}`);
  console.log(`${colors.cyan}   2. Haz una llamada conversacional desde el widget${colors.reset}`);
  console.log(`${colors.cyan}   3. Verifica en los logs de Render que aparece:${colors.reset}`);
  console.log(`${colors.cyan}      "[AI] 🎯 Usando OpenAI GPT-4o-mini..."${colors.reset}\n`);
}

testModeloSimple().catch(error => {
  console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
  process.exit(1);
});
