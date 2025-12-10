#!/usr/bin/env node
/**
 * Script para Verificar Variables de Entorno en Vercel
 * Lista las variables actuales y muestra qué falta
 */

const https = require('https');

const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_API_URL = 'api.vercel.com';
const PROJECT_NAME = 'pwa';

const REQUIRED_VARS = ['MCP_SERVER_URL'];
const OPTIONAL_VARS = ['MCP_TOKEN'];

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
  try {
    const response = await vercelAPI('/v9/projects');
    
    if (response.status !== 200) {
      console.error(`❌ Error obteniendo proyectos: ${response.status}`);
      return null;
    }
    
    const projects = response.data.projects || [];
    const project = projects.find(p => p.name === PROJECT_NAME);
    
    if (!project) {
      console.error(`❌ Proyecto "${PROJECT_NAME}" no encontrado`);
      return null;
    }
    
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
      return [];
    }
    
    return response.data.envs || [];
  } catch (error) {
    return [];
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 VERIFICACIÓN DE VARIABLES DE ENTORNO EN VERCEL');
  console.log('='.repeat(70));
  console.log('');
  
  // 1. Obtener proyecto
  const project = await getProjectInfo();
  if (!project) {
    console.error('❌ No se pudo encontrar el proyecto');
    process.exit(1);
  }
  
  console.log(`✅ Proyecto: ${project.name} (${project.id})\n`);
  
  // 2. Obtener variables actuales
  console.log('📋 Obteniendo variables de entorno...\n');
  const currentVars = await getCurrentEnvVars(project.id);
  
  const currentVarKeys = currentVars.map(v => v.key);
  
  // 3. Mostrar variables actuales
  console.log('📊 VARIABLES ACTUALES:');
  console.log('');
  
  if (currentVars.length === 0) {
    console.log('   (ninguna configurada)\n');
  } else {
    currentVars.forEach(v => {
      const envs = Array.isArray(v.target) ? v.target.join(', ') : v.target || 'all';
      const masked = v.key.includes('TOKEN') && v.value ? '***' + v.value.slice(-4) : v.value;
      const icon = REQUIRED_VARS.includes(v.key) ? '✅' : '📌';
      console.log(`   ${icon} ${v.key} = ${masked}`);
      console.log(`      Ambientes: ${envs}\n`);
    });
  }
  
  // 4. Verificar variables requeridas
  console.log('🔍 VERIFICACIÓN:');
  console.log('');
  
  const missingRequired = REQUIRED_VARS.filter(key => !currentVarKeys.includes(key));
  const missingOptional = OPTIONAL_VARS.filter(key => !currentVarKeys.includes(key));
  
  let allOk = true;
  
  // Requeridas
  REQUIRED_VARS.forEach(key => {
    if (currentVarKeys.includes(key)) {
      console.log(`   ✅ ${key} - CONFIGURADA`);
    } else {
      console.log(`   ❌ ${key} - FALTANTE (REQUERIDA)`);
      allOk = false;
    }
  });
  
  console.log('');
  
  // Opcionales
  OPTIONAL_VARS.forEach(key => {
    if (currentVarKeys.includes(key)) {
      console.log(`   ✅ ${key} - CONFIGURADA`);
    } else {
      console.log(`   ⚠️  ${key} - NO CONFIGURADA (Opcional)`);
    }
  });
  
  console.log('');
  
  // 5. Resumen
  console.log('='.repeat(70));
  if (allOk) {
    console.log('✅ TODAS LAS VARIABLES REQUERIDAS ESTÁN CONFIGURADAS');
    console.log('='.repeat(70));
    console.log('');
    console.log('🎉 Tu proyecto está listo para producción!\n');
  } else {
    console.log('⚠️  VARIABLES REQUERIDAS FALTANTES');
    console.log('='.repeat(70));
    console.log('');
    console.log('❌ Faltan las siguientes variables REQUERIDAS:\n');
    
    missingRequired.forEach(key => {
      console.log(`   • ${key}`);
    });
    
    console.log('');
    console.log('📋 CÓMO CONFIGURAR:');
    console.log('');
    console.log('   1. Ejecuta el script interactivo:');
    console.log('      node configurar-variables-vercel.js');
    console.log('');
    console.log('   2. O configura manualmente en Vercel:');
    console.log('      - Ve a: https://vercel.com/dashboard');
    console.log(`      - Proyecto: ${project.name}`);
    console.log('      - Settings > Environment Variables');
    console.log('      - Add New');
    console.log('');
    console.log('📖 Para más información, lee: VARIABLES_VERCEL_REQUERIDAS.md\n');
  }
  
  // 6. Mostrar instrucciones de configuración si faltan
  if (!allOk) {
    console.log('🔧 CONFIGURACIÓN RÁPIDA:');
    console.log('');
    console.log('   MCP_SERVER_URL:');
    console.log('   - Nombre: MCP_SERVER_URL');
    console.log('   - Valor: https://tu-servidor-mcp.com');
    console.log('   - Ambiente: Production');
    console.log('');
    if (missingOptional.includes('MCP_TOKEN')) {
      console.log('   MCP_TOKEN (opcional):');
      console.log('   - Solo si tu servidor MCP requiere autenticación');
      console.log('');
    }
  }
}

main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

