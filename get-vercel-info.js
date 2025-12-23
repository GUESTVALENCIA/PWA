#!/usr/bin/env node
/**
 * Obtener información del proyecto en Vercel y configurar variables
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
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve(body);
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

async function main() {
  console.log(' Buscando proyecto en Vercel...\n');
  
  try {
    // Obtener lista de proyectos
    const projects = await vercelAPI('/v9/projects');
    
    if (projects.projects && projects.projects.length > 0) {
      console.log(' Proyectos encontrados:\n');
      
      for (const project of projects.projects) {
        console.log(`   ${project.name}`);
        console.log(`     ID: ${project.id}`);
        
        // Obtener deployments
        const deployments = await vercelAPI(`/v6/deployments?projectId=${project.id}&limit=1`);
        
        if (deployments.deployments && deployments.deployments.length > 0) {
          const latest = deployments.deployments[0];
          console.log(`     URL: https://${latest.url}`);
          console.log(`     Estado: ${latest.state}`);
          console.log('');
          
          // Guardar URL
          if (latest.url) {
            const fs = require('fs');
            fs.writeFileSync('PRODUCTION_URL.txt', `https://${latest.url}\n${new Date().toISOString()}\n`);
            console.log(` URL guardada en PRODUCTION_URL.txt\n`);
            
            console.log('='.repeat(60));
            console.log(' URL DE PRODUCCIÓN');
            console.log('='.repeat(60));
            console.log(`\n ${latest.url}\n`);
          }
        }
        
        // Mostrar variables de entorno
        console.log(' Variables de entorno configuradas:');
        const envVars = await vercelAPI(`/v9/projects/${project.id}/env`);
        
        if (envVars.envs && envVars.envs.length > 0) {
          for (const env of envVars.envs) {
            const value = env.value ? (env.value.substring(0, 20) + '...') : '(vacío)';
            console.log(`   ${env.key} (${env.target?.join(', ') || 'all'})`);
          }
        } else {
          console.log('    No hay variables configuradas\n');
        }
        
        console.log('\n');
      }
    } else {
      console.log('  No se encontraron proyectos\n');
    }
    
  } catch (error) {
    console.error(' Error:', error.message);
  }
}

main();

