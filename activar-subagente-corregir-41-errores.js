/**
 * Script para activar subagente VoltAgent y corregir los 41 errores
 * Lee index.html y envía la tarea al agente corrector
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const INDEX_HTML_PATH = path.join(__dirname, 'index.html');
const VOLTAGENT_DIR = 'C:\\Users\\clayt\\Desktop\\VoltAgent-Composer-Workflow';

// Leer index.html
let indexHtmlContent = '';
try {
  indexHtmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
  console.log(`✅ Archivo index.html leído (${(indexHtmlContent.length / 1024).toFixed(2)} KB)\n`);
} catch (error) {
  console.error('❌ Error leyendo index.html:', error.message);
  process.exit(1);
}

// Crear prompt detallado
const prompt = `Corrige TODOS los 41 errores de linting en index.html.

ARCHIVO: ${INDEX_HTML_PATH}

ERRORES DETECTADOS (41 total):

1. CSS inline styles (17 ocurrencias)
   Líneas: 72, 96, 99, 108, 109, 242, 277, 278, 329, 330, 350, 351, 680, 681, 730, 731, 801
   Acción: Mover a clases CSS cuando sea posible
   ⚠️ IMPORTANTE: Mantener estilos inline dinámicos (background-image establecido en JavaScript)

2. Compatibilidad video[playsinline] (7 ocurrencias)
   Líneas: 96, 272, 284, 329, 350, 680, 730
   Acción: Agregar atributo webkit-playsinline para compatibilidad Firefox

3. Accesibilidad botones sin texto (3 ocurrencias)
   Líneas: 298, 305, 308
   Acción: Agregar atributos aria-label y title

4. Input file sin label accesible (1 ocurrencia)
   Línea: 262
   Acción: Agregar aria-label

5. Link sin rel="noopener" (1 ocurrencia)
   Línea: 701
   Acción: Agregar rel="noopener noreferrer"

6. iframe referrerpolicy (1 ocurrencia)
   Línea: 801
   Acción: Cambiar referrerpolicy="no-referrer-when-downgrade" a "no-referrer"

7. CSS backdrop-filter orden (3 ocurrencias)
   Líneas: 45, 46, 55
   Acción: Asegurar que -webkit-backdrop-filter esté ANTES de backdrop-filter

REQUISITOS CRÍTICOS:
- Mantener TODA la funcionalidad JavaScript existente
- NO romper ningún comportamiento
- Los estilos inline dinámicos (background-image) DEBEN permanecer inline
- Generar código HTML completo corregido listo para usar

CONTENIDO DEL ARCHIVO:
\`\`\`html
${indexHtmlContent.substring(0, 50000)}${indexHtmlContent.length > 50000 ? '\n... (archivo completo, pero muestra inicial limitada)' : ''}
\`\`\`

Lee el archivo completo desde ${INDEX_HTML_PATH}, corrige TODOS los 41 errores, y genera el código HTML completo corregido en un bloque \`\`\`html ... \`\`\`.`;

// Ejecutar invocación del agente
async function ejecutar() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   ACTIVAR SUBAGENTE VOLTAGENT - CORRECCIÓN 41 ERRORES');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📋 Opciones de agentes disponibles:');
  console.log('   1. conversational-code-reviewer (Revisor de Código Conversacional)');
  console.log('   2. code-reviewer (Code Reviewer - si existe)');
  console.log('   3. frontend-developer (Frontend Developer)\n');
  
  console.log('🚀 Invocando agente: conversational-code-reviewer\n');
  
  try {
    // Cambiar al directorio de VoltAgent
    process.chdir(VOLTAGENT_DIR);
    
    // Ejecutar invocación
    const command = `node invocar-agente.js conversational-code-reviewer "${prompt.substring(0, 1000)}..."`;
    
    console.log('⏳ Ejecutando comando...\n');
    const output = execSync(command, { 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      cwd: VOLTAGENT_DIR
    });
    
    console.log(output);
    
    // Guardar prompt completo para referencia
    const promptPath = path.join(__dirname, 'prompt-para-subagente.txt');
    fs.writeFileSync(promptPath, prompt, 'utf-8');
    console.log(`\n💡 Prompt completo guardado en: prompt-para-subagente.txt`);
    console.log('💡 Puedes usar este prompt manualmente en la consola de VoltAgent\n');
    
  } catch (error) {
    console.error('❌ Error ejecutando:', error.message);
    console.log('\n💡 ALTERNATIVA: Usa la consola web de VoltAgent');
    console.log('   1. Abre: https://console.voltagent.dev');
    console.log('   2. Selecciona el agente: conversational-code-reviewer');
    console.log('   3. Pega el prompt del archivo: prompt-para-subagente.txt\n');
    
    // Guardar prompt para uso manual
    const promptPath = path.join(__dirname, 'prompt-para-subagente.txt');
    fs.writeFileSync(promptPath, prompt, 'utf-8');
    console.log(`✅ Prompt guardado en: ${promptPath}`);
    console.log('   Úsalo manualmente en la consola de VoltAgent\n');
  }
}

ejecutar();

