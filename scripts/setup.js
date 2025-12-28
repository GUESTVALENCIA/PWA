#!/usr/bin/env node

/**
 * Setup Script - Inicialización del MCP Orchestrator
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('🚀 Inicializando MCP Orchestrator...\n');

// 1. Crear directorios si no existen
const dirs = [
  'logs',
  'config',
  'src',
  'skills',
  'scripts',
  'database'
];

dirs.forEach(dir => {
  const dirPath = path.join(rootDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Directorio creado: ${dir}`);
  }
});

// 2. Crear .env si no existe
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ .env creado desde .env.example');
  console.log('⚠️  POR FAVOR: Edita .env con tus credenciales');
}

// 3. Crear .gitignore
const gitignorePath = path.join(rootDir, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  fs.writeFileSync(gitignorePath, `
node_modules/
.env
.env.local
logs/
dist/
*.log
.DS_Store
.vscode/
.idea/
*.swp
*.swo
  `.trim());
  console.log('✅ .gitignore creado');
}

// 4. Crear registro de proyectos vacío si no existe
const registryPath = path.join(rootDir, 'config', 'projects-registry.json');
if (!fs.existsSync(registryPath)) {
  fs.writeFileSync(registryPath, JSON.stringify({
    version: '1.0.0',
    updated_at: new Date().toISOString(),
    projects: []
  }, null, 2));
  console.log('✅ Registry de proyectos creado');
}

console.log('\n✅ Setup completado!');
console.log('\n📋 Próximos pasos:');
console.log('1. Edita .env con tus credenciales');
console.log('2. Ejecuta: npm install');
console.log('3. Ejecuta: npm run dev');
console.log('4. Accede a: http://localhost:3000');
