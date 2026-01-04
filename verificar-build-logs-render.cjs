#!/usr/bin/env node

/**
 * Verificar logs de build para ver si el submodule se clonó
 */

const https = require('https');

const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';
const RENDER_API_BASE = 'api.render.com';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: RENDER_API_BASE,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json',
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

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 VERIFICAR LOGS DE BUILD - SUBMODULE');
  console.log('='.repeat(70));
  console.log(`\n🔗 Servicio: ${SERVICE_ID}\n`);

  // Obtener últimos deploys
  console.log('📦 Obteniendo últimos deploys...');
  const deploysResponse = await makeRequest(`/v1/services/${SERVICE_ID}/deploys?limit=3`);
  
  if (deploysResponse.status === 200) {
    const deploys = deploysResponse.data.deploys || deploysResponse.data || [];
    console.log(`\n✅ Encontrados ${deploys.length} deploy(s) reciente(s):\n`);
    
    for (const deploy of deploys.slice(0, 2)) {
      const deployData = deploy.deploy || deploy;
      const deployId = deployData.id;
      const status = deployData.status || 'unknown';
      const createdAt = deployData.createdAt ? new Date(deployData.createdAt).toLocaleString('es-ES') : 'N/A';
      
      console.log(`📦 Deploy: ${deployId}`);
      console.log(`   Estado: ${status}`);
      console.log(`   Creado: ${createdAt}`);
      
      // Obtener logs del deploy
      console.log(`\n📋 Obteniendo logs del deploy ${deployId}...`);
      const logsResponse = await makeRequest(`/v1/services/${SERVICE_ID}/deploys/${deployId}/logs`);
      
      if (logsResponse.status === 200 && logsResponse.data.logs) {
        const logs = logsResponse.data.logs;
        
        // Buscar indicadores de submodule
        const submoduleIndicators = [
          'Submodule',
          'IA-SANDRA',
          'submodule update',
          'Cloning into',
          'registered'
        ];
        
        const foundIndicators = [];
        const relevantLines = [];
        
        submoduleIndicators.forEach(indicator => {
          if (logs.includes(indicator)) {
            foundIndicators.push(indicator);
            // Extraer líneas relevantes
            const lines = logs.split('\n');
            lines.forEach((line, idx) => {
              if (line.includes(indicator) && idx < 50) { // Primeras 50 líneas
                relevantLines.push(line.trim());
              }
            });
          }
        });
        
        if (foundIndicators.length > 0) {
          console.log(`✅ Indicadores encontrados: ${foundIndicators.join(', ')}`);
          console.log(`\n📄 Líneas relevantes (primeras 10):`);
          relevantLines.slice(0, 10).forEach(line => {
            if (line) console.log(`   ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
          });
        } else {
          console.log(`❌ No se encontraron indicadores de submodule en los logs`);
          console.log(`   Esto sugiere que el Build Command no se ejecutó o falló`);
        }
      } else {
        console.log(`⚠️  No se pudieron obtener logs del deploy`);
      }
      
      console.log('\n' + '-'.repeat(70) + '\n');
    }
  } else {
    console.error(`❌ Error obteniendo deploys: ${deploysResponse.status}`);
  }

  console.log('='.repeat(70));
  console.log('💡 Si no se encontraron indicadores de submodule:');
  console.log('   1. Verifica que el Build Command esté configurado correctamente');
  console.log('   2. Verifica que .gitmodules esté en el repositorio');
  console.log('   3. Verifica los logs completos en Render Dashboard');
  console.log('='.repeat(70));
  console.log(`\n🔗 Dashboard: https://dashboard.render.com/web/${SERVICE_ID}\n`);
}

main().catch(console.error);
