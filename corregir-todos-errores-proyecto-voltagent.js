/**
 * Script Master: Corregir TODOS los errores del proyecto usando VoltAgent
 * Escanea todo el proyecto, identifica errores, y activa subagentes para corregirlos
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
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

// Cargar tokens de VoltAgent
const tokensPaths = [
  'C:\\Users\\clayt\\Desktop\\VoltAgent-Composer-Workflow\\tokens.json',
  path.join(__dirname, '..', 'Desktop', 'VoltAgent-Composer-Workflow', 'tokens.json'),
  path.join(__dirname, '..', '..', 'Desktop', 'VoltAgent-Composer-Workflow', 'tokens.json')
];

let tokens = {};
let tokensPath = null;

for (const tp of tokensPaths) {
  if (fs.existsSync(tp)) {
    tokensPath = tp;
    break;
  }
}

try {
  if (tokensPath) {
    tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    log('✅ Tokens de VoltAgent cargados', 'green');
    log(`   Desde: ${tokensPath}`, 'blue');
  } else {
    log('⚠️  tokens.json no encontrado en rutas esperadas', 'yellow');
    log(`   Buscado en: ${tokensPaths.slice(0, 1).join(', ')}`, 'yellow');
  }
} catch (e) {
  log(`⚠️  Error cargando tokens: ${e.message}`, 'yellow');
}

// Configuración
const API_BASE = 'https://api.voltagent.dev';
const TOKEN = tokens.tokens?.development?.token || tokens.tokens?.original?.token || tokens.tokens?.admin?.token;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Directorios y archivos a escanear
const PROJECT_ROOT = __dirname;
const EXTENSIONS_TO_CHECK = ['.html', '.js', '.css', '.md', '.json'];
const DIRECTORIES_TO_SKIP = ['node_modules', '.git', 'dist', 'build', '.next', '.vercel'];

// Resultado del escaneo
let allErrors = {
  html: [],
  js: [],
  css: [],
  md: [],
  json: [],
  total: 0
};

/**
 * Verificar si un directorio debe ser omitido
 */
function shouldSkipDirectory(dirName) {
  return DIRECTORIES_TO_SKIP.includes(dirName) || dirName.startsWith('.');
}

/**
 * Escanear directorio recursivamente
 */
function scanDirectory(dirPath, relativePath = '') {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.join(relativePath, entry.name).replace(/\\/g, '/');
      
      if (entry.isDirectory()) {
        if (!shouldSkipDirectory(entry.name)) {
          files.push(...scanDirectory(fullPath, relPath));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (EXTENSIONS_TO_CHECK.includes(ext)) {
          files.push({
            path: fullPath,
            relativePath: relPath,
            extension: ext,
            name: entry.name
          });
        }
      }
    }
  } catch (error) {
    log(`⚠️  Error escaneando ${dirPath}: ${error.message}`, 'yellow');
  }
  
  return files;
}

/**
 * Ejecutar linter en un archivo y obtener errores
 */
function getLinterErrors(filePath) {
  try {
    // Usar read_lints tool output format simulation
    // En producción, esto usaría el linter real
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();
    const errors = [];
    
    // Detectar errores básicos
    if (ext === '.html') {
      // Errores comunes en HTML
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // CSS inline
        if (line.includes('style=') && line.match(/style\s*=\s*["']/)) {
          errors.push({
            line: lineNum,
            severity: 'warning',
            message: 'CSS inline styles should not be used, move styles to an external CSS file'
          });
        }
        
        // Accesibilidad botones
        if (line.match(/<button[^>]*>/i) && !line.includes('aria-label') && !line.includes('title')) {
          const hasText = line.match(/>[^<]*[a-zA-Z]+[^<]*</i);
          if (!hasText) {
            errors.push({
              line: lineNum,
              severity: 'error',
              message: 'Buttons must have discernible text: Element has no title attribute'
            });
          }
        }
        
        // Links sin noopener
        if (line.match(/<a[^>]*target\s*=\s*["']_blank["'][^>]*>/i) && !line.includes('rel=')) {
          errors.push({
            line: lineNum,
            severity: 'error',
            message: "Link 'rel' attribute should include 'noopener'."
          });
        }
        
        // backdrop-filter sin -webkit-
        if (line.includes('backdrop-filter:') && !line.includes('-webkit-backdrop-filter')) {
          errors.push({
            line: lineNum,
            severity: 'error',
            message: "'backdrop-filter' is not supported by Safari. Add '-webkit-backdrop-filter' to support Safari 9+."
          });
        }
      });
    }
    
    // Para otros tipos de archivo, detectar errores básicos de sintaxis
    if (ext === '.js') {
      try {
        // Intentar parsear para detectar errores de sintaxis
        eval('(' + content + ')');
      } catch (e) {
        // Error de sintaxis detectado
        const match = e.message.match(/\((\d+):(\d+)\)/);
        if (match) {
          errors.push({
            line: parseInt(match[1]),
            severity: 'error',
            message: `Syntax error: ${e.message}`
          });
        }
      }
    }
    
    return errors;
  } catch (error) {
    log(`⚠️  Error analizando ${filePath}: ${error.message}`, 'yellow');
    return [];
  }
}

/**
 * Escanear todo el proyecto
 */
function scanProject() {
  log('\n🔍 ESCANEANDO PROYECTO COMPLETO...\n', 'cyan');
  
  const files = scanDirectory(PROJECT_ROOT);
  log(`📁 Archivos encontrados: ${files.length}`, 'blue');
  
  let totalErrors = 0;
  
  for (const file of files) {
    const errors = getLinterErrors(file.path);
    if (errors.length > 0) {
      const ext = file.extension.substring(1); // Sin el punto
      if (allErrors[ext]) {
        allErrors[ext].push({
          file: file.relativePath,
          fullPath: file.path,
          errors: errors
        });
      }
      totalErrors += errors.length;
    }
  }
  
  allErrors.total = totalErrors;
  
  // Mostrar resumen
  log('\n📊 RESUMEN DE ERRORES:\n', 'cyan');
  log(`HTML: ${allErrors.html.reduce((sum, f) => sum + f.errors.length, 0)} errores`, 'yellow');
  log(`JS: ${allErrors.js.reduce((sum, f) => sum + f.errors.length, 0)} errores`, 'yellow');
  log(`CSS: ${allErrors.css.reduce((sum, f) => sum + f.errors.length, 0)} errores`, 'yellow');
  log(`MD: ${allErrors.md.reduce((sum, f) => sum + f.errors.length, 0)} errores`, 'yellow');
  log(`JSON: ${allErrors.json.reduce((sum, f) => sum + f.errors.length, 0)} errores`, 'yellow');
  log(`\nTOTAL: ${totalErrors} errores encontrados\n`, 'bright');
  
  return allErrors;
}

/**
 * Generar prompt para VoltAgent
 */
function generatePromptForFile(fileInfo) {
  const content = fs.readFileSync(fileInfo.fullPath, 'utf-8');
  const errorsList = fileInfo.errors.map(e => 
    `Línea ${e.line}: [${e.severity.toUpperCase()}] ${e.message}`
  ).join('\n');
  
  return `Corrige TODOS los errores de linting en el siguiente archivo.

ARCHIVO: ${fileInfo.file}
RUTA COMPLETA: ${fileInfo.fullPath}

ERRORES A CORREGIR (${fileInfo.errors.length} total):
${errorsList}

REQUISITOS:
- Mantener TODA la funcionalidad existente
- NO romper ningún comportamiento
- Generar el código completo corregido
- Los estilos inline dinámicos (establecidos en JavaScript) DEBEN mantenerse inline

CONTENIDO DEL ARCHIVO:
\`\`\`${path.extname(fileInfo.file).substring(1)}
${content}
\`\`\`

Responde SOLO con el código completo corregido, sin explicaciones adicionales.`;
}

/**
 * Hacer petición HTTP/HTTPS
 */
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

/**
 * Invocar agente VoltAgent para corregir un archivo
 */
async function correctFileWithVoltAgent(fileInfo) {
  const prompt = generatePromptForFile(fileInfo);
  
  log(`\n🔧 Corrigiendo: ${fileInfo.file}`, 'cyan');
  log(`   Errores: ${fileInfo.errors.length}`, 'yellow');
  
  // Seleccionar agente según tipo de archivo
  let agentId = 'claude-code';
  if (fileInfo.file.endsWith('.html')) {
    agentId = 'conversational-code-reviewer';
  } else if (fileInfo.file.endsWith('.md')) {
    agentId = 'claude-code';
  }
  
  const endpoints = [
    `${API_BASE}/agents/${agentId}/chat`,
    `http://localhost:3141/agents/${agentId}/chat`
  ];
  
  const requestBody = {
    input: [{ role: 'user', text: prompt, content: prompt }],
    options: {
      userId: 'sandra-coo-user',
      conversationId: `conv-${Date.now()}-${fileInfo.file.replace(/[^a-zA-Z0-9]/g, '-')}`,
      temperature: 0.3,
      maxOutputTokens: 32000
    }
  };
  
  for (const endpoint of endpoints) {
    try {
      log(`   Intentando: ${endpoint}`, 'blue');
      const response = await makeRequest(endpoint, {
        method: 'POST'
      }, requestBody);

      if (response.status === 200 || response.status === 201) {
        log(`   ✅ Respuesta recibida`, 'green');
        
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

        // Extraer código si está en un bloque
        const ext = path.extname(fileInfo.file).substring(1);
        const codeMatch = respuesta.match(new RegExp(`\`\`\`${ext}\\s*([\\s\\S]*?)\`\`\``)) || 
                         respuesta.match(/```\s*([\s\S]*?)```/);
        
        const codigoCorregido = codeMatch ? codeMatch[1].trim() : respuesta;

        // Guardar resultado
        const backupPath = fileInfo.fullPath + '.backup';
        const correctedPath = fileInfo.fullPath + '.corrected';
        
        // Hacer backup
        fs.copyFileSync(fileInfo.fullPath, backupPath);
        
        // Guardar corrección
        fs.writeFileSync(correctedPath, codigoCorregido, 'utf-8');
        
        log(`   💾 Backup: ${backupPath}`, 'blue');
        log(`   ✨ Corregido: ${correctedPath}`, 'green');
        
        return { success: true, correctedPath, backupPath };
      }
    } catch (err) {
      log(`   ❌ Error: ${err.message}`, 'red');
      continue;
    }
  }
  
  log(`   ❌ No se pudo corregir este archivo`, 'red');
  return { success: false };
}

/**
 * Función principal
 */
async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  CORRECCIÓN MASIVA DE ERRORES CON VOLTAGENT SUBAGENTES    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  // Verificar configuración
  if (!TOKEN) {
    log('\n❌ No se encontró token de VoltAgent', 'red');
    log('\n💡 Opciones:', 'yellow');
    log('   1. Usar consola web: https://console.voltagent.dev', 'blue');
    log('   2. Verificar tokens.json en VoltAgent-Composer-Workflow', 'blue');
    process.exit(1);
  }
  
  if (!GROQ_API_KEY) {
    log('\n⚠️  GROQ_API_KEY no configurada (opcional)', 'yellow');
    log('   Configura con: $env:GROQ_API_KEY = "tu-api-key"', 'blue');
  } else {
    log('\n✅ GROQ_API_KEY configurada', 'green');
  }
  
  // Escanear proyecto
  const errors = scanProject();
  
  if (errors.total === 0) {
    log('\n🎉 ¡No se encontraron errores!', 'green');
    return;
  }
  
  log('\n🚀 INICIANDO CORRECCIÓN AUTOMÁTICA...\n', 'cyan');
  
  // Corregir archivos en orden de prioridad
  const filesToCorrect = [
    ...allErrors.html,
    ...allErrors.js,
    ...allErrors.css,
    ...allErrors.md,
    ...allErrors.json
  ];
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const fileInfo of filesToCorrect) {
    const result = await correctFileWithVoltAgent(fileInfo);
    if (result.success) {
      results.success.push(fileInfo.file);
    } else {
      results.failed.push(fileInfo.file);
    }
    
    // Pequeña pausa para no saturar la API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Resumen final
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    RESUMEN FINAL                            ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  log(`\n✅ Archivos corregidos: ${results.success.length}`, 'green');
  log(`❌ Archivos fallidos: ${results.failed.length}`, results.failed.length > 0 ? 'red' : 'green');
  
  if (results.success.length > 0) {
    log('\n📋 PRÓXIMOS PASOS:', 'cyan');
    log('   1. Revisa los archivos .corrected generados', 'blue');
    log('   2. Verifica que las correcciones son correctas', 'blue');
    log('   3. Reemplaza los archivos originales:', 'blue');
    log('      Get-ChildItem -Filter "*.corrected" | ForEach-Object {', 'yellow');
    log('        $newName = $_.Name -replace "\\.corrected$", "";', 'yellow');
    log('        Move-Item $_.FullName $newName -Force', 'yellow');
    log('      }', 'yellow');
    log('   4. Verifica con el linter que todos los errores están corregidos', 'blue');
    log('   5. Haz commit y push\n', 'blue');
  }
}

// Ejecutar
main().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

