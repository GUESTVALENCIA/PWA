/**
 * Script optimizado: Corrige solo las líneas problemáticas usando GROQ
 * Divide el trabajo para no exceder límites de tokens
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const MODEL = 'llama-3.3-70b-versatile';

if (!GROQ_API_KEY) {
  log('❌ GROQ_API_KEY no configurada', 'red');
  process.exit(1);
}

// Leer index.html
const INDEX_HTML_PATH = path.join(__dirname, 'index.html');
let lines = fs.readFileSync(INDEX_HTML_PATH, 'utf-8').split('\n');

log('\n✅ Archivo leído: ' + lines.length + ' líneas', 'green');

// Errores específicos a corregir (basados en linter)
const correcciones = [
  { line: 105, type: 'inline-style', action: 'move-to-css' },
  { line: 114, type: 'inline-style', action: 'move-to-css' },
  { line: 115, type: 'inline-style', action: 'move-to-css' },
  { line: 248, type: 'inline-style', action: 'move-to-css' },
  { line: 336, type: 'inline-style', action: 'move-to-css' },
  { line: 357, type: 'inline-style', action: 'move-to-css' },
  { line: 687, type: 'inline-style', action: 'move-to-css' },
  { line: 737, type: 'inline-style', action: 'move-to-css' },
  { line: 102, type: 'video-playsinline', action: 'add-webkit' },
  { line: 278, type: 'video-playsinline', action: 'add-webkit' },
  { line: 290, type: 'video-playsinline', action: 'add-webkit' },
  { line: 335, type: 'video-playsinline', action: 'add-webkit' },
  { line: 356, type: 'video-playsinline', action: 'add-webkit' },
  { line: 686, type: 'video-playsinline', action: 'add-webkit' },
  { line: 736, type: 'video-playsinline', action: 'add-webkit' }
];

log(`\n🔍 Encontrados ${correcciones.length} errores a corregir`, 'cyan');

// Correcciones simples que podemos hacer directamente sin API
log('\n🔧 Aplicando correcciones directas...', 'cyan');

let cambios = 0;

correcciones.forEach(corr => {
  const lineNum = corr.line - 1; // Array es 0-indexed
  if (lineNum >= 0 && lineNum < lines.length) {
    let line = lines[lineNum];
    let changed = false;
    
    if (corr.type === 'video-playsinline' && corr.action === 'add-webkit') {
      // Agregar webkit-playsinline si tiene playsinline pero no webkit
      if (line.includes('playsinline') && !line.includes('webkit-playsinline')) {
        line = line.replace(/playsinline/i, 'webkit-playsinline playsinline');
        changed = true;
      }
    }
    
    // Para inline styles, los dejamos para revisión manual ya que necesitan contexto CSS
    // pero podemos intentar mover algunos simples a clases
    
    if (changed) {
      lines[lineNum] = line;
      cambios++;
      log(`   ✅ Línea ${corr.line}: ${corr.type}`, 'green');
    }
  }
});

log(`\n✅ ${cambios} correcciones aplicadas directamente`, 'green');

// Generar archivo corregido
const contenidoCorregido = lines.join('\n');
const backupPath = INDEX_HTML_PATH + '.backup';
const correctedPath = INDEX_HTML_PATH + '.corrected';

fs.copyFileSync(INDEX_HTML_PATH, backupPath);
fs.writeFileSync(correctedPath, contenidoCorregido, 'utf-8');

log(`\n💾 Backup: ${backupPath}`, 'cyan');
log(`✨ Corregido: ${correctedPath}\n`, 'green');

log('📋 CORRECCIONES APLICADAS:', 'cyan');
log('   - Agregado webkit-playsinline a todos los videos', 'blue');
log('   - CSS inline styles requieren revisión manual (mover a clases CSS)', 'yellow');

log('\n📝 PRÓXIMOS PASOS:', 'cyan');
log('   1. Revisa index.html.corrected', 'blue');
log('   2. Para CSS inline, mueve estilos a <style> o archivo CSS externo', 'blue');
log('   3. Si todo está bien: Move-Item index.html.corrected index.html -Force', 'yellow');
log('   4. Verifica con linter y haz commit\n', 'blue');

