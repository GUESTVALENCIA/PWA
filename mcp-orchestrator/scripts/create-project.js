#!/usr/bin/env node

/**
 * Create Project Script
 * Crea un nuevo proyecto en el registro
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const registryPath = path.join(__dirname, '../config/projects-registry.json');

const args = process.argv.slice(2);
const [projectName, projectPath] = args;

if (!projectName || !projectPath) {
  console.error('❌ Uso: node create-project.js <nombre> <path>');
  console.error('   Ejemplo: node create-project.js pwa-ecommerce /Users/user/Projects/pwa-ecommerce');
  process.exit(1);
}

try {
  // Leer registry actual
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));

  // Crear nuevo proyecto
  const newProject = {
    id: uuidv4(),
    name: projectName,
    path: projectPath,
    status: 'active',
    lock_status: 'unlocked',
    created_at: new Date().toISOString(),
    context: {}
  };

  // Agregar a registry
  registry.projects.push(newProject);
  registry.updated_at = new Date().toISOString();

  // Guardar
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

  console.log('✅ Proyecto creado exitosamente!');
  console.log(`   ID: ${newProject.id}`);
  console.log(`   Nombre: ${newProject.name}`);
  console.log(`   Path: ${newProject.path}`);
} catch (error) {
  console.error('❌ Error creando proyecto:', error.message);
  process.exit(1);
}
