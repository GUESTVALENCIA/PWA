/**
 * Script de Verificación Pre-Deploy
 * Ejecuta verificaciones antes del deployment a Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificación Pre-Deploy - GuestsValencia PWA + Sandra IA\n');

let errors = [];
let warnings = [];
let success = [];

// 1. Verificar archivos críticos
const criticalFiles = [
  'index.html',
  'vercel.json',
  'package.json',
  'api/sandra/chat.js',
  'api/sandra/voice.js',
  'api/sandra/transcribe.js',
  'src/utils/env.js'
];

console.log('📁 Verificando archivos críticos...');
criticalFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    success.push(`✅ ${file} existe`);
  } else {
    errors.push(`❌ ${file} NO existe`);
  }
});

// 2. Verificar vercel.json
console.log('\n⚙️ Verificando vercel.json...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercelConfig.rewrites && vercelConfig.rewrites.length > 0) {
    success.push('✅ vercel.json tiene rewrites configurados');
  } else {
    warnings.push('⚠️ vercel.json no tiene rewrites');
  }
  
  if (vercelConfig.outputDirectory === '.') {
    success.push('✅ outputDirectory configurado correctamente');
  }
} catch (e) {
  errors.push(`❌ Error leyendo vercel.json: ${e.message}`);
}

// 3. Verificar package.json
console.log('\n📦 Verificando package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.engines && packageJson.engines.node) {
    success.push(`✅ Node.js version requerida: ${packageJson.engines.node}`);
  }
  
  if (packageJson.scripts && packageJson.scripts.dev) {
    success.push('✅ Scripts configurados');
  }
} catch (e) {
  errors.push(`❌ Error leyendo package.json: ${e.message}`);
}

// 4. Verificar serverless functions
console.log('\n🔧 Verificando serverless functions...');
const apiFiles = [
  'api/sandra/chat.js',
  'api/sandra/voice.js',
  'api/sandra/transcribe.js'
];

apiFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    
    if (content.includes('module.exports') || content.includes('export default')) {
      success.push(`✅ ${file} tiene export correcto`);
    } else {
      warnings.push(`⚠️ ${file} podría no tener export correcto`);
    }
    
    if (content.includes('process.env')) {
      success.push(`✅ ${file} usa variables de entorno`);
    }
  }
});

// 5. Verificar src/utils/env.js
console.log('\n🧠 Verificando utilidades de entorno...');
if (fs.existsSync('src/utils/env.js')) {
  const envContent = fs.readFileSync('src/utils/env.js', 'utf8');
  
  if (envContent.includes('getEnv()')) {
    success.push('✅ getEnv() implementado');
  }
  
  if (envContent.includes('getSandraResponse')) {
    success.push('✅ getSandraResponse() implementado');
  }
  
  if (envContent.includes('flujoCompletoSandraVoz')) {
    success.push('✅ flujoCompletoSandraVoz() implementado');
  }
}

// 6. Verificar .env.production.example
console.log('\n🔐 Verificando variables de entorno...');
if (fs.existsSync('.env.production.example')) {
  success.push('✅ .env.production.example existe');
  warnings.push('⚠️ Recuerda configurar variables en Vercel UI');
} else {
  warnings.push('⚠️ .env.production.example no encontrado');
}

// 7. Verificar .gitignore
console.log('\n🚫 Verificando .gitignore...');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (gitignore.includes('.env')) {
    success.push('✅ .env está en .gitignore');
  } else {
    warnings.push('⚠️ .env debería estar en .gitignore');
  }
} else {
  warnings.push('⚠️ .gitignore no existe');
}

// Resumen
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE VERIFICACIÓN\n');

if (success.length > 0) {
  console.log('✅ Éxitos:');
  success.forEach(msg => console.log(`   ${msg}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️ Advertencias:');
  warnings.forEach(msg => console.log(`   ${msg}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Errores:');
  errors.forEach(msg => console.log(`   ${msg}`));
  console.log('');
  console.log('🚨 HAY ERRORES CRÍTICOS. Corrígelos antes de desplegar.');
  process.exit(1);
} else {
  console.log('✨ ¡Todo verificado correctamente!');
  console.log('\n📋 Próximos pasos:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "Ready for deployment"');
  console.log('   3. git push origin main');
  console.log('   4. Ir a Vercel y configurar variables de entorno');
  console.log('   5. Hacer deploy\n');
  
  if (warnings.length > 0) {
    console.log('⚠️ Revisa las advertencias antes de desplegar.\n');
  }
  
  process.exit(0);
}

