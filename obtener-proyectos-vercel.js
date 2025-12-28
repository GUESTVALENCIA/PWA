#!/usr/bin/env node
/**
 * Obtener todos los proyectos de Vercel y sus variables
 */

const https = require('https');

const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_API_URL = 'api.vercel.com';

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
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('🔍 Obteniendo proyectos de Vercel...\n');
  
  try {
    // Obtener proyectos
    const projectsResponse = await vercelAPI('/v9/projects');
    
    if (projectsResponse.status !== 200) {
      console.error('❌ Error:', projectsResponse.data);
      return;
    }

    const projects = projectsResponse.data.projects || [];
    console.log(`📦 Total de proyectos: ${projects.length}\n`);
    console.log('='.repeat(70));

    for (const project of projects) {
      console.log(`\n📁 Proyecto: ${project.name}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Framework: ${project.framework || 'N/A'}`);
      console.log(`   Updated: ${project.updatedAt || 'N/A'}`);
      
      // Obtener variables de entorno
      const envResponse = await vercelAPI(`/v9/projects/${project.id}/env`);
      if (envResponse.status === 200 && envResponse.data.envs) {
        const envs = envResponse.data.envs;
        console.log(`   📝 Variables: ${envs.length}`);
        
        if (envs.length > 0) {
          console.log('   Variables configuradas:');
          envs.forEach(env => {
            const preview = env.value ? env.value.substring(0, 30) + '...' : '(vacío)';
            const targets = env.target?.join(', ') || 'all';
            console.log(`      - ${env.key} (${targets}): ${preview}`);
          });
        }
      }
      
      console.log('   ' + '-'.repeat(68));
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Proyectos obtenidos correctamente\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();

