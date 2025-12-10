#!/usr/bin/env node
/**
 * Script para Configurar Variables de Entorno en Vercel
 * Configura automáticamente las variables necesarias para el widget MCP
 */

const https = require('https');
const readline = require('readline');

const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_API_URL = 'api.vercel.com';
const PROJECT_NAME = 'pwa';

// Variables requeridas
const REQUIRED_VARS = {
  'MCP_SERVER_URL': {
    required: true,
    description: 'URL del servidor MCP (ej: https://mcp.sandra-ia.com)',
    example: 'https://mcp.sandra-ia.com',
    environments: ['production', 'preview', 'development']
  }
};

const OPTIONAL_VARS = {
  'MCP_TOKEN': {
    required: false,
    description: 'Token de autenticación para el servidor MCP (opcional)',
    example: 'tu-token-aqui',
    environments: ['production', 'preview']
  }
};

function vercelAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VERCEL_API_URL,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
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

async function getProjectInfo() {
  console.log('🔍 Buscando proyecto en Vercel...\n');
  
  try {
    const response = await vercelAPI('/v9/projects');
    
    if (response.status !== 200) {
      console.error(`❌ Error obteniendo proyectos: ${response.status}`);
      if (response.data.error) {
        console.error(`   ${response.data.error.message || JSON.stringify(response.data.error)}`);
      }
      return null;
    }
    
    const projects = response.data.projects || [];
    const project = projects.find(p => p.name === PROJECT_NAME);
    
    if (!project) {
      console.error(`❌ Proyecto "${PROJECT_NAME}" no encontrado`);
      console.log('📋 Proyectos disponibles:');
      projects.forEach(p => console.log(`   - ${p.name} (${p.id})`));
      return null;
    }
    
    console.log(`✅ Proyecto encontrado: ${project.name}`);
    console.log(`   ID: ${project.id}\n`);
    
    return project;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function getCurrentEnvVars(projectId) {
  try {
    const response = await vercelAPI(`/v9/projects/${projectId}/env`);
    
    if (response.status !== 200) {
      console.error(`❌ Error obteniendo variables: ${response.status}`);
      return [];
    }
    
    return response.data.envs || [];
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

async function createEnvVar(projectId, key, value, environments) {
  try {
    const response = await vercelAPI(
      `/v9/projects/${projectId}/env`,
      'POST',
      {
        key: key,
        value: value,
        type: 'encrypted',
        target: environments // ['production', 'preview', 'development']
      }
    );
    
    return response.status === 200 || response.status === 201;
  } catch (error) {
    console.error(`❌ Error creando variable ${key}:`, error.message);
    return false;
  }
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔧 CONFIGURACIÓN DE VARIABLES DE ENTORNO EN VERCEL');
  console.log('='.repeat(70));
  console.log('');
  
  // 1. Obtener proyecto
  const project = await getProjectInfo();
  if (!project) {
    process.exit(1);
  }
  
  // 2. Obtener variables actuales
  console.log('📋 Obteniendo variables de entorno actuales...\n');
  const currentVars = await getCurrentEnvVars(project.id);
  
  const currentVarKeys = currentVars.map(v => v.key);
  
  console.log('📊 Variables actuales:');
  if (currentVars.length === 0) {
    console.log('   (ninguna configurada)\n');
  } else {
    currentVars.forEach(v => {
      const envs = Array.isArray(v.target) ? v.target.join(', ') : v.target || 'all';
      const masked = v.key === 'MCP_TOKEN' && v.value ? '***' + v.value.slice(-4) : v.value;
      console.log(`   ✅ ${v.key} = ${masked} (${envs})`);
    });
    console.log('');
  }
  
  // 3. Identificar variables faltantes
  console.log('🔍 Analizando variables necesarias...\n');
  
  const missingRequired = [];
  const missingOptional = [];
  
  // Revisar requeridas
  for (const [key, config] of Object.entries(REQUIRED_VARS)) {
    if (!currentVarKeys.includes(key)) {
      missingRequired.push({ key, ...config });
    } else {
      console.log(`✅ ${key} - Ya configurada`);
    }
  }
  
  // Revisar opcionales
  for (const [key, config] of Object.entries(OPTIONAL_VARS)) {
    if (!currentVarKeys.includes(key)) {
      missingOptional.push({ key, ...config });
    } else {
      console.log(`✅ ${key} - Ya configurada`);
    }
  }
  
  console.log('');
  
  // 4. Si no faltan variables, mostrar resumen
  if (missingRequired.length === 0 && missingOptional.length === 0) {
    console.log('='.repeat(70));
    console.log('✅ TODAS LAS VARIABLES ESTÁN CONFIGURADAS');
    console.log('='.repeat(70));
    console.log('');
    console.log('🎉 No hay nada que configurar. Todo está listo!\n');
    process.exit(0);
  }
  
  // 5. Mostrar variables faltantes
  if (missingRequired.length > 0) {
    console.log('⚠️  VARIABLES REQUERIDAS FALTANTES:');
    missingRequired.forEach(v => {
      console.log(`   ❌ ${v.key}`);
      console.log(`      ${v.description}`);
      console.log(`      Ejemplo: ${v.example}\n`);
    });
  }
  
  if (missingOptional.length > 0) {
    console.log('📋 VARIABLES OPCIONALES FALTANTES:');
    missingOptional.forEach(v => {
      console.log(`   ○ ${v.key} (opcional)`);
      console.log(`      ${v.description}`);
      if (v.example) {
        console.log(`      Ejemplo: ${v.example}\n`);
      }
    });
    console.log('');
  }
  
  // 6. Preguntar si quiere configurar
  console.log('='.repeat(70));
  const shouldConfigure = await askQuestion('¿Deseas configurar las variables faltantes ahora? (s/n): ');
  
  if (shouldConfigure.toLowerCase() !== 's' && shouldConfigure.toLowerCase() !== 'y' && shouldConfigure.toLowerCase() !== 'sí') {
    console.log('\n⚠️  Configuración cancelada.');
    console.log('\n📋 Para configurar manualmente:');
    console.log('   1. Ve a: https://vercel.com/dashboard');
    console.log(`   2. Selecciona el proyecto: ${project.name}`);
    console.log('   3. Ve a: Settings > Environment Variables');
    console.log('   4. Añade las variables faltantes\n');
    process.exit(0);
  }
  
  console.log('');
  
  // 7. Configurar variables requeridas
  for (const varConfig of missingRequired) {
    console.log(`\n🔧 Configurando ${varConfig.key}...`);
    const value = await askQuestion(`${varConfig.description}\n   Valor: `);
    
    if (!value.trim()) {
      console.log(`⚠️  Valor vacío, omitiendo ${varConfig.key}`);
      continue;
    }
    
    console.log('   Configurando...');
    const success = await createEnvVar(project.id, varConfig.key, value.trim(), varConfig.environments);
    
    if (success) {
      console.log(`✅ ${varConfig.key} configurada correctamente`);
    } else {
      console.log(`❌ Error configurando ${varConfig.key}`);
    }
  }
  
  // 8. Preguntar sobre variables opcionales
  if (missingOptional.length > 0) {
    console.log('\n');
    const configureOptional = await askQuestion('¿Deseas configurar las variables opcionales? (s/n): ');
    
    if (configureOptional.toLowerCase() === 's' || configureOptional.toLowerCase() === 'y' || configureOptional.toLowerCase() === 'sí') {
      for (const varConfig of missingOptional) {
        console.log(`\n🔧 Configurando ${varConfig.key} (opcional)...`);
        const value = await askQuestion(`${varConfig.description}\n   Valor (Enter para omitir): `);
        
        if (!value.trim()) {
          console.log(`   Omitiendo ${varConfig.key}`);
          continue;
        }
        
        console.log('   Configurando...');
        const success = await createEnvVar(project.id, varConfig.key, value.trim(), varConfig.environments);
        
        if (success) {
          console.log(`✅ ${varConfig.key} configurada correctamente`);
        } else {
          console.log(`❌ Error configurando ${varConfig.key}`);
        }
      }
    }
  }
  
  // 9. Resumen final
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(70));
  console.log('');
  console.log('✅ Configuración completada!');
  console.log('');
  console.log('⚠️  IMPORTANTE: Las variables se aplicarán en el próximo deploy.');
  console.log('   Si quieres aplicarlas ahora, puedes:');
  console.log('   1. Hacer un nuevo push al repositorio');
  console.log('   2. O forzar un redeploy desde el dashboard de Vercel');
  console.log('');
  console.log('🔗 Dashboard: https://vercel.com/dashboard');
  console.log(`   Proyecto: ${project.name}`);
  console.log('');
}

main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

