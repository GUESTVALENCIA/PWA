#!/usr/bin/env node
/**
 * Script para configurar Vercel con dominio oficial guestsvalencia.es
 * - Conecta el dominio personalizado
 * - Limpia rutas innecesarias
 * - Configura el proyecto correctamente
 */

const https = require('https');

const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_API_URL = 'api.vercel.com';
const PROJECT_ID = 'prj_j0oMCNvOgiMauVLQrYIkaHFymn8o';
const DOMINIO_OFICIAL = 'guestsvalencia.es';

console.log('🔧 CONFIGURANDO VERCEL CON DOMINIO OFICIAL\n');
console.log('='.repeat(60));
console.log(`Proyecto: ${PROJECT_ID}`);
console.log(`Dominio: ${DOMINIO_OFICIAL}`);
console.log('='.repeat(60) + '\n');

// Función para hacer requests a la API de Vercel
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
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = { status: res.statusCode, data: JSON.parse(body) };
          resolve(result);
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Vercel API timeout'));
    });
    
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// 1. Listar todos los proyectos para encontrar el correcto
async function listarProyectos() {
  console.log('📋 1. Listando proyectos de Vercel...');
  try {
    const result = await vercelAPI('/v9/projects?limit=100');
    
    if (result.status === 200) {
      const projects = result.data.projects || [];
      console.log(`   📦 Proyectos encontrados: ${projects.length}`);
      
      // Buscar proyecto por ID o nombre
      let proyecto = projects.find(p => p.id === PROJECT_ID);
      
      if (!proyecto) {
        // Buscar por nombre que contenga "guestsvalencia" o "sandra"
        proyecto = projects.find(p => 
          p.name?.toLowerCase().includes('guestsvalencia') ||
          p.name?.toLowerCase().includes('sandra') ||
          p.name?.toLowerCase().includes('pwa')
        );
      }
      
      if (proyecto) {
        console.log(`   ✅ Proyecto encontrado: ${proyecto.name} (${proyecto.id})`);
        return proyecto;
      } else {
        console.log('   📋 Proyectos disponibles:');
        projects.slice(0, 10).forEach((p, i) => {
          console.log(`      ${i + 1}. ${p.name} (${p.id})`);
        });
        return null;
      }
    } else {
      console.error('   ❌ Error:', result.status, result.data);
      return null;
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return null;
  }
}

// 1b. Obtener información del proyecto
async function obtenerProyecto(projectId) {
  console.log(`\n📋 Obteniendo información del proyecto ${projectId}...`);
  try {
    const result = await vercelAPI(`/v9/projects/${projectId}`);
    
    if (result.status === 200) {
      console.log('   ✅ Proyecto encontrado:', result.data.name);
      return result.data;
    } else {
      console.error('   ❌ Error:', result.status, result.data);
      return null;
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return null;
  }
}

// 2. Listar dominios actuales
async function listarDominios(projectId) {
  console.log('\n🌐 2. Listando dominios del proyecto...');
  try {
    const result = await vercelAPI(`/v9/projects/${projectId}/domains`);
    
    if (result.status === 200) {
      const domains = result.data.domains || [];
      console.log(`   📋 Dominios encontrados: ${domains.length}`);
      domains.forEach(domain => {
        console.log(`      - ${domain.name} (${domain.verified ? '✅ Verificado' : '❌ No verificado'})`);
      });
      return domains;
    } else {
      console.log('   ⚠️  No se pudieron listar dominios');
      return [];
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return [];
  }
}

// 3. Agregar dominio personalizado
async function agregarDominio(projectId, domain) {
  console.log(`\n➕ 3. Agregando dominio ${domain}...`);
  try {
    const result = await vercelAPI(
      `/v10/projects/${projectId}/domains`,
      'POST',
      { name: domain }
    );
    
    if (result.status === 200 || result.status === 201) {
      console.log(`   ✅ Dominio ${domain} agregado correctamente`);
      console.log('   📝 Configuración DNS requerida:');
      console.log('      - Tipo: CNAME');
      console.log('      - Nombre: @ o www');
      console.log('      - Valor: cname.vercel-dns.com');
      return true;
    } else if (result.status === 409) {
      console.log(`   ⚠️  Dominio ${domain} ya está configurado`);
      return true;
    } else {
      console.error('   ❌ Error:', result.status, result.data);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return false;
  }
}

// 4. Verificar configuración de vercel.json
async function verificarVercelJson() {
  console.log('\n📄 4. Verificando vercel.json...');
  const fs = require('fs');
  const path = require('path');
  
  try {
    const vercelJsonPath = path.join(__dirname, 'vercel.json');
    if (!fs.existsSync(vercelJsonPath)) {
      console.log('   ⚠️  vercel.json no existe, creando uno limpio...');
      const cleanConfig = {
        version: 2,
        buildCommand: null,
        outputDirectory: ".",
        framework: null,
        cleanUrls: true,
        trailingSlash: false
      };
      fs.writeFileSync(vercelJsonPath, JSON.stringify(cleanConfig, null, 2));
      console.log('   ✅ vercel.json creado');
      return cleanConfig;
    }
    
    const config = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    console.log('   ✅ vercel.json existe');
    
    // Verificar que no tenga rutas innecesarias
    if (config.rewrites && config.rewrites.length > 0) {
      console.log('   ⚠️  Tiene rewrites configurados:', config.rewrites.length);
      console.log('   📝 Limpiando rewrites innecesarios...');
      
      // Mantener solo rewrites esenciales para /api
      const essentialRewrites = config.rewrites.filter(r => 
        r.source && r.source.startsWith('/api')
      );
      
      config.rewrites = essentialRewrites;
      fs.writeFileSync(vercelJsonPath, JSON.stringify(config, null, 2));
      console.log('   ✅ Rewrites limpiados');
    }
    
    return config;
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return null;
  }
}

// 5. Actualizar variables de entorno si es necesario
async function verificarVariables(projectId) {
  console.log('\n🔐 5. Verificando variables de entorno críticas...');
  try {
    const result = await vercelAPI(`/v9/projects/${projectId}/env`);
    
    if (result.status === 200) {
      const envVars = result.data.envs || [];
      const criticalVars = ['MCP_SERVER_URL'];
      const found = {};
      
      envVars.forEach(env => {
        if (criticalVars.includes(env.key)) {
          found[env.key] = true;
          const masked = env.value ? env.value.substring(0, 20) + '...' : 'NO CONFIGURADA';
          console.log(`   ✅ ${env.key}: ${masked}`);
        }
      });
      
      criticalVars.forEach(key => {
        if (!found[key]) {
          console.log(`   ⚠️  FALTA: ${key}`);
        }
      });
      
      return envVars;
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  return [];
}

// 6. Obtener deployments recientes
async function obtenerDeployments(projectId) {
  console.log('\n🚀 6. Verificando deployments...');
  try {
    const result = await vercelAPI(`/v6/deployments?projectId=${projectId}&limit=5`);
    
    if (result.status === 200) {
      const deployments = result.data.deployments || [];
      console.log(`   📋 Últimos ${deployments.length} deployments:`);
      deployments.slice(0, 3).forEach((dep, i) => {
        const date = new Date(dep.createdAt).toLocaleString('es-ES');
        const state = dep.readyState === 'READY' ? '✅' : '⏳';
        console.log(`      ${i + 1}. ${state} ${date} - ${dep.url || 'N/A'}`);
      });
      return deployments;
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  return [];
}

// Función principal
async function main() {
  try {
    // 1. Listar proyectos y encontrar el correcto
    let proyecto = await listarProyectos();
    
    if (!proyecto) {
      // Intentar con el ID proporcionado
      console.log(`\n⚠️  Intentando con ID proporcionado: ${PROJECT_ID}`);
      proyecto = await obtenerProyecto(PROJECT_ID);
    }
    
    if (!proyecto) {
      console.error('\n❌ No se pudo encontrar el proyecto');
      console.error('   Por favor, verifica el PROJECT_ID en el script');
      process.exit(1);
    }
    
    const projectId = proyecto.id;

    // 2. Listar dominios
    const dominios = await listarDominios(projectId);
    
    // 3. Agregar dominio oficial si no existe
    const dominioExiste = dominios.some(d => d.name === DOMINIO_OFICIAL || d.name === `www.${DOMINIO_OFICIAL}`);
    if (!dominioExiste) {
      await agregarDominio(projectId, DOMINIO_OFICIAL);
      await agregarDominio(projectId, `www.${DOMINIO_OFICIAL}`);
    } else {
      console.log(`\n✅ Dominio ${DOMINIO_OFICIAL} ya está configurado`);
    }

    // 4. Verificar vercel.json
    await verificarVercelJson();

    // 5. Verificar variables
    await verificarVariables(projectId);

    // 6. Deployments
    await obtenerDeployments(projectId);

    console.log('\n' + '='.repeat(60));
    console.log('✅ CONFIGURACIÓN COMPLETADA\n');
    console.log('📋 PRÓXIMOS PASOS:');
    console.log('   1. Verificar configuración DNS del dominio:');
    console.log('      - CNAME: @ → cname.vercel-dns.com');
    console.log('      - CNAME: www → cname.vercel-dns.com');
    console.log('   2. Esperar propagación DNS (puede tardar hasta 24h)');
    console.log('   3. Verificar dominio en Vercel Dashboard');
    console.log('   4. Hacer nuevo deploy para aplicar cambios\n');
    console.log(`🌐 Dominio oficial: https://${DOMINIO_OFICIAL}\n`);

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

main();

