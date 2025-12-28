#!/usr/bin/env node
/**
 * Script para verificar qué proyectos tienen qué dominios configurados
 */

const https = require('https');

const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_API_URL = 'api.vercel.com';
const DOMINIO_OFICIAL = 'guestsvalencia.es';

console.log('🔍 VERIFICANDO CONFIGURACIÓN DE DOMINIOS EN VERCEL\n');
console.log('='.repeat(60));
console.log(`Dominio a verificar: ${DOMINIO_OFICIAL}`);
console.log('='.repeat(60) + '\n');

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

async function listarTodosLosProyectos() {
  console.log('📋 Listando TODOS los proyectos de Vercel...');
  try {
    const result = await vercelAPI('/v9/projects?limit=100');
    
    if (result.status === 200) {
      const projects = result.data.projects || [];
      console.log(`   ✅ Encontrados ${projects.length} proyectos\n`);
      return projects;
    } else {
      console.error('   ❌ Error:', result.status, result.data);
      return [];
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return [];
  }
}

async function obtenerDominiosDelProyecto(projectId) {
  try {
    const result = await vercelAPI(`/v9/projects/${projectId}/domains`);
    
    if (result.status === 200) {
      return result.data.domains || [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

async function verificarDominioEnTodosLosProyectos() {
  const projects = await listarTodosLosProyectos();
  
  console.log('🔍 Verificando en qué proyectos está configurado el dominio...\n');
  
  const proyectosConDominio = [];
  
  for (const project of projects) {
    const dominios = await obtenerDominiosDelProyecto(project.id);
    
    const tieneDominio = dominios.some(d => 
      d.name === DOMINIO_OFICIAL || 
      d.name === `www.${DOMINIO_OFICIAL}`
    );
    
    if (tieneDominio) {
      proyectosConDominio.push({
        id: project.id,
        name: project.name,
        dominios: dominios.filter(d => 
          d.name === DOMINIO_OFICIAL || 
          d.name === `www.${DOMINIO_OFICIAL}`
        )
      });
    }
    
    // Mostrar progreso
    process.stdout.write(`   Verificando: ${project.name}...\r`);
  }
  
  console.log('\n');
  
  if (proyectosConDominio.length === 0) {
    console.log(`❌ El dominio ${DOMINIO_OFICIAL} NO está configurado en NINGÚN proyecto`);
    console.log('\n📝 Para configurarlo, necesitas:');
    console.log('   1. Ir al proyecto correcto en Vercel Dashboard');
    console.log('   2. Settings → Domains');
    console.log('   3. Agregar el dominio');
  } else {
    console.log(`✅ El dominio ${DOMINIO_OFICIAL} está configurado en ${proyectosConDominio.length} proyecto(s):\n`);
    
    proyectosConDominio.forEach((proj, i) => {
      console.log(`${i + 1}. Proyecto: ${proj.name}`);
      console.log(`   ID: ${proj.id}`);
      console.log(`   Dominios:`);
      proj.dominios.forEach(d => {
        console.log(`     - ${d.name} (${d.verified ? '✅ Verificado' : '❌ No verificado'})`);
      });
      console.log('');
    });
  }
  
  return proyectosConDominio;
}

async function main() {
  try {
    await verificarDominioEnTodosLosProyectos();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

main();

